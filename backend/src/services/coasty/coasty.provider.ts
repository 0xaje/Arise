import { 
  ExecutionProvider, 
  ExecutionRunParams, 
  ExecutionStatusResult, 
  ConnectionTestResult 
} from '../../adapters/executionProvider.js';
import { coastyClient } from './coasty.client.js';
import { coastyEventSync } from './coasty.events.js';
import { buildInvestigationTask } from './coasty.taskBuilder.js';
import { mapCoastyStatusToAriseStatus } from './coasty.mapper.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

export class CoastyExecutionProvider implements ExecutionProvider {
  public name = 'Coasty Web Browser Agent';

  public async testConnection(): Promise<ConnectionTestResult> {
    return coastyClient.testConnection();
  }

  public async startRun(params: ExecutionRunParams): Promise<void> {
    if (!coastyClient.isConfigured()) {
      throw new AppError('COASTY_NOT_CONFIGURED', 'Coasty API connection is not configured. Missing COASTY_API_KEY.', 400);
    }

    const machineId = process.env.COASTY_MACHINE_ID;
    if (!machineId) {
      throw new AppError('MACHINE_ID_MISSING', 'COASTY_MACHINE_ID environment variable is missing.', 400);
    }

    // 1. Fetch AgentRun and ExceptionCase context
    const run = await prisma.agentRun.findUnique({
      where: { id: params.runId },
      include: { exceptionCase: true, workflow: true }
    });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${params.runId}' not found`, 404);
    }

    // 2. Build Safety-Bounded Computer-Use Task Prompt
    let taskPrompt = run.workflow.description || `Execute workflow: ${run.workflow.name}`;
    if (run.exceptionCase) {
      taskPrompt = buildInvestigationTask({
        id: run.exceptionCase.id,
        caseNumber: run.exceptionCase.caseNumber,
        customerName: run.exceptionCase.customerName,
        accountNumber: run.exceptionCase.accountNumber,
        exceptionType: run.exceptionCase.exceptionType,
        amount: run.exceptionCase.amount,
        currency: run.exceptionCase.currency,
        sourceSystem: run.exceptionCase.sourceSystem,
        description: run.exceptionCase.description,
        suggestedAction: run.exceptionCase.suggestedAction,
      });
    }

    // 3. Deterministic Idempotency Key
    const idempotencyKey = run.idempotencyKey || `arise:${run.id}:coasty:start`;

    // 4. Dispatch POST /v1/runs to Coasty API
    const coastyRun = await coastyClient.createRun({
      machine_id: machineId,
      task: taskPrompt,
      cua_version: process.env.COASTY_CUA_VERSION || 'v3',
      max_steps: parseInt(process.env.COASTY_DEFAULT_MAX_STEPS || '25', 10),
      deadline_seconds: parseInt(process.env.COASTY_DEFAULT_DEADLINE_SECONDS || '600', 10),
      on_awaiting_human: (process.env.COASTY_ON_AWAITING_HUMAN as any) || 'pause',
      webhook_url: process.env.COASTY_WEBHOOK_URL || undefined,
    }, idempotencyKey);

    // 5. Persist externalRunId and update state
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        externalRunId: coastyRun.id,
        status: mapCoastyStatusToAriseStatus(coastyRun.status),
        startedAt: new Date(),
      }
    });

    logger.info({ ariseRunId: run.id, coastyRunId: coastyRun.id }, 'Coasty run created and linked cleanly');
  }

  public async cancelRun(runId: string): Promise<void> {
    const run = await prisma.agentRun.findUnique({ where: { id: runId } });
    if (!run || !run.externalRunId) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${runId}' with externalRunId not found`, 404);
    }

    const cancelledRun = await coastyClient.cancelRun(run.externalRunId);
    await coastyEventSync.syncRunStatus(run.externalRunId, cancelledRun.status, cancelledRun.step_count, cancelledRun.result?.outcome, cancelledRun.error?.message);
  }

  public async pauseRun(runId: string): Promise<void> {
    const run = await prisma.agentRun.findUnique({ where: { id: runId } });
    if (!run || !run.externalRunId) return;
    await coastyClient.cancelRun(run.externalRunId);
  }

  public async resumeRun(runId: string): Promise<void> {
    const run = await prisma.agentRun.findUnique({ where: { id: runId } });
    if (!run || !run.externalRunId) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${runId}' with externalRunId not found`, 404);
    }

    const resumedRun = await coastyClient.resumeRun(run.externalRunId);
    await coastyEventSync.syncRunStatus(run.externalRunId, resumedRun.status, resumedRun.step_count);
  }

  public async getRunStatus(runId: string): Promise<ExecutionStatusResult> {
    const run = await prisma.agentRun.findUnique({ where: { id: runId } });
    if (!run || !run.externalRunId) {
      return {
        runId,
        status: run ? run.status : 'QUEUED',
        currentStep: run ? run.currentStep : 0,
        totalSteps: run ? run.totalSteps : 0,
        message: 'No Coasty externalRunId linked'
      };
    }

    const coastyRun = await coastyClient.getRun(run.externalRunId);
    await coastyEventSync.syncRunStatus(run.externalRunId, coastyRun.status, coastyRun.step_count, coastyRun.result?.outcome, coastyRun.error?.message);

    return {
      runId: run.id,
      status: mapCoastyStatusToAriseStatus(coastyRun.status),
      currentStep: coastyRun.step_count || run.currentStep,
      totalSteps: coastyRun.max_steps || run.totalSteps,
      message: coastyRun.result?.outcome || coastyRun.error?.message
    };
  }
}

export const coastyExecutionProvider = new CoastyExecutionProvider();
