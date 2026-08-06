import { prisma } from '../../lib/prisma.js';
import { planBuilder } from './execution.plan.js';
import { coastyExecutionProvider } from '../coasty/coasty.provider.js';
import { outcomeVerifier } from './execution.verifier.js';
import { AuditService } from '../auditService.js';
import { EventService } from '../eventService.js';
import { AppError } from '../../lib/errors.js';
import { RunStatus, CaseStatus } from '@prisma/client';
import { logger } from '../../lib/logger.js';

export interface StartOrchestrationOptions {
  workflowId: string;
  exceptionCaseId?: string;
  idempotencyKey?: string;
}

export class ExecutionOrchestrator {
  public async createAndStartRun(options: StartOrchestrationOptions) {
    // 1. Validate Workflow
    const workflow = await prisma.workflow.findUnique({ where: { id: options.workflowId } });
    if (!workflow) {
      throw new AppError('WORKFLOW_NOT_FOUND', `Workflow '${options.workflowId}' not found`, 404);
    }

    // 2. Validate ExceptionCase if provided
    let exceptionCase = null;
    if (options.exceptionCaseId) {
      exceptionCase = await prisma.exceptionCase.findUnique({ where: { id: options.exceptionCaseId } });
      if (!exceptionCase) {
        throw new AppError('EXCEPTION_NOT_FOUND', `ExceptionCase '${options.exceptionCaseId}' not found`, 404);
      }
    }

    // 3. Check Idempotency Key
    if (options.idempotencyKey) {
      const existing = await prisma.agentRun.findUnique({
        where: { idempotencyKey: options.idempotencyKey },
        include: { workflow: true, exceptionCase: true, businessStages: true }
      });
      if (existing) {
        logger.info({ idempotencyKey: options.idempotencyKey, runId: existing.runId }, 'Returning idempotent AgentRun');
        return existing;
      }
    }

    // 4. Generate Execution Plan
    const plan = planBuilder.buildPlan(workflow, exceptionCase);

    const runCount = await prisma.agentRun.count();
    const runIdStr = `RUN-${10000 + runCount + 1}`;

    // 5. Create AgentRun record in PostgreSQL
    const createdRun = await prisma.agentRun.create({
      data: {
        runId: runIdStr,
        workflowId: workflow.id,
        exceptionCaseId: exceptionCase ? exceptionCase.id : null,
        status: RunStatus.QUEUED,
        businessOutcome: 'PENDING',
        verificationStatus: 'UNAVAILABLE',
        executionPlanJson: JSON.stringify(plan),
        totalSteps: workflow.maxSteps || plan.policy.maxSteps,
        idempotencyKey: options.idempotencyKey || `arise:${runIdStr}:start`,
      }
    });

    // 6. Create BusinessStages in PostgreSQL
    for (const stageDef of plan.stages) {
      await prisma.businessStage.create({
        data: {
          runId: createdRun.id,
          sequence: stageDef.sequence,
          name: stageDef.name,
          objective: stageDef.objective,
          status: stageDef.sequence === 1 ? 'RUNNING' : 'PENDING',
          startedAt: stageDef.sequence === 1 ? new Date() : null,
        }
      });
    }

    // 7. Update ExceptionCase status
    if (exceptionCase) {
      await prisma.exceptionCase.update({
        where: { id: exceptionCase.id },
        data: { status: CaseStatus.INVESTIGATING }
      });
    }

    // 8. Log Audit event
    await AuditService.createLog({
      actorType: 'ARISE_ORCHESTRATOR',
      actorId: 'system',
      action: 'ORCHESTRATE_RUN_CREATED',
      resourceType: 'AgentRun',
      resourceId: createdRun.id,
      detailsJson: { planObjective: plan.objective, riskLevel: plan.policy.riskLevel }
    });

    // 9. Dispatch asynchronously to Coasty provider (does not block HTTP response)
    coastyExecutionProvider.startRun({
      runId: createdRun.id,
      workflowId: workflow.id,
      exceptionCaseId: exceptionCase ? exceptionCase.id : undefined,
    }).catch(err => {
      logger.error({ runId: createdRun.id, err }, 'Failed to start Coasty run execution');
    });

    // Return created run with stages promptly
    return prisma.agentRun.findUnique({
      where: { id: createdRun.id },
      include: {
        workflow: true,
        exceptionCase: true,
        businessStages: { orderBy: { sequence: 'asc' } }
      }
    });
  }

  // Verify business outcome of a run
  public async verifyOutcome(runId: string) {
    const result = await outcomeVerifier.verifyRun(runId);
    await AuditService.createLog({
      actorType: 'BUSINESS_VERIFIER',
      actorId: 'system',
      action: 'VERIFY_BUSINESS_OUTCOME',
      resourceType: 'AgentRun',
      resourceId: runId,
      detailsJson: { outcome: result.businessOutcome, verification: result.verification.status, message: result.verification.message }
    });

    await EventService.emit({
      runId,
      type: result.businessOutcome === 'RESOLVED' ? 'BUSINESS_OUTCOME_VERIFIED' : 'BUSINESS_OUTCOME_FAILED',
      message: `Business Outcome Evaluated: ${result.businessOutcome}. Verification: ${result.verification.status}.`,
      payloadJson: result.verification,
      actorType: 'BUSINESS_VERIFIER',
      actorId: 'system',
    });

    return result;
  }
}

export const orchestrator = new ExecutionOrchestrator();
