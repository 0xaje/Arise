import { prisma } from '../../lib/prisma.js';
import { generateRunId } from '../../lib/idGenerator.js';
import { planBuilder } from './execution.plan.js';
import { coastyExecutionProvider } from '../coasty/coasty.provider.js';
import { outcomeVerifier } from './execution.verifier.js';
import { AuditService } from '../auditService.js';
import { EventService } from '../eventService.js';
import { AppError } from '../../lib/errors.js';
import { ObservedBusinessState } from './execution.types.js';
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

    // 5. Generate Collision-Resistant ULID Run ID
    const runIdStr = generateRunId();

    // 6. Create AgentRun record in PostgreSQL
    const createdRun = await prisma.agentRun.create({
      data: {
        runId: runIdStr,
        workflowId: workflow.id,
        exceptionCaseId: exceptionCase ? exceptionCase.id : null,
        status: RunStatus.QUEUED,
        businessOutcome: 'UNAVAILABLE',
        verificationStatus: 'UNAVAILABLE',
        executionPlanJson: JSON.stringify(plan),
        totalSteps: workflow.maxSteps || plan.policy.maxSteps,
        idempotencyKey: options.idempotencyKey || `arise:${runIdStr}:start`,
      }
    });

    // 7. Create BusinessStages in PostgreSQL
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

    // 8. Update ExceptionCase status
    if (exceptionCase) {
      await prisma.exceptionCase.update({
        where: { id: exceptionCase.id },
        data: { status: CaseStatus.INVESTIGATING }
      });
    }

    // 9. Log Audit event
    await AuditService.createLog({
      actorType: 'ARISE_ORCHESTRATOR',
      actorId: 'system',
      action: 'ORCHESTRATE_RUN_CREATED',
      resourceType: 'AgentRun',
      resourceId: createdRun.id,
      detailsJson: { runId: createdRun.runId, planObjective: plan.objective, riskLevel: plan.policy.riskLevel }
    });

    // 10. Dispatch asynchronously to Coasty provider (does not block HTTP response)
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

  // Verify business outcome of a run with observed business state
  public async verifyOutcome(runId: string, observedState?: ObservedBusinessState) {
    const report = await outcomeVerifier.verifyRun(runId, observedState);

    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        businessOutcome: report.businessOutcome,
        verificationStatus: report.status,
      }
    });

    await AuditService.createLog({
      actorType: 'BUSINESS_VERIFIER',
      actorId: 'system',
      action: 'VERIFY_BUSINESS_OUTCOME',
      resourceType: 'AgentRun',
      resourceId: runId,
      detailsJson: { 
        outcome: report.businessOutcome, 
        verificationStatus: report.status, 
        comparisonResult: report.comparisonResult,
        message: report.message 
      }
    });

    await EventService.emit({
      runId,
      type: report.businessOutcome === 'RESOLVED' ? 'BUSINESS_OUTCOME_VERIFIED' : 'BUSINESS_OUTCOME_FAILED',
      message: `Business Outcome Evaluated: ${report.businessOutcome}. Verification: ${report.status}. Result: ${report.comparisonResult}.`,
      payloadJson: report,
      actorType: 'BUSINESS_VERIFIER',
      actorId: 'system',
    });

    return report;
  }

  // Reverse a cash application run safely
  public async reverseRun(runId: string, actor: string = 'operator@arise-finance.org', reason: string = 'Cash application reversal requested') {
    const run = await prisma.agentRun.findFirst({
      where: { OR: [{ id: runId }, { runId: runId }] },
      include: { exceptionCase: true }
    });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${runId}' not found`, 404);
    }

    const updatedRun = await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: RunStatus.FAILED,
        businessOutcome: 'ESCALATED',
        verificationStatus: 'UNAVAILABLE',
        outcome: `Application reversed by ${actor}. Reason: ${reason}`,
      }
    });

    if (run.exceptionCaseId) {
      await prisma.exceptionCase.update({
        where: { id: run.exceptionCaseId },
        data: { status: CaseStatus.PENDING }
      });
    }

    await AuditService.createLog({
      actorType: 'HUMAN_OPERATOR',
      actorId: actor,
      action: 'REVERSE_CASH_APPLICATION',
      resourceType: 'AgentRun',
      resourceId: run.id,
      detailsJson: { runId: run.runId, reason, reversedAt: new Date() }
    });

    await EventService.emit({
      runId: run.id,
      type: 'RUN_FAILED',
      message: `Cash application reversed by ${actor}: ${reason}`,
      payloadJson: { reason, reversedBy: actor },
      actorType: 'HUMAN_OPERATOR',
      actorId: actor,
    });

    return updatedRun;
  }
}

export const orchestrator = new ExecutionOrchestrator();
