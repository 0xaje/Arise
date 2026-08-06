import { prisma } from '../../lib/prisma.js';
import { validateRunStateTransition } from '../stateMachine.js';
import { mapCoastyStatusToAriseStatus, mapCoastyActionTypeToArise, mapCoastyEventTypeToArise } from '../coasty/coasty.mapper.js';
import { CoastyRunEvent } from '../coasty/coasty.types.js';
import { EventService } from '../eventService.js';
import { outcomeVerifier } from './execution.verifier.js';
import { RunStatus, CaseStatus, ApprovalStatus, EvidenceType } from '@prisma/client';
import { logger } from '../../lib/logger.js';

export class ExecutionEventProcessor {
  private processedEvents = new Set<string>();

  // Terminal state lock check
  public isTerminalState(status: RunStatus): boolean {
    return status === RunStatus.COMPLETED || status === RunStatus.FAILED || status === RunStatus.CANCELLED;
  }

  public generateDeduplicationKey(externalRunId: string, event: CoastyRunEvent): string {
    if (event.id) return `${externalRunId}:${event.id}`;
    return `${externalRunId}:${event.event_type}:${event.sequence || 0}:${event.timestamp}`;
  }

  public async processEvent(externalRunId: string, event: CoastyRunEvent): Promise<void> {
    const dedupKey = this.generateDeduplicationKey(externalRunId, event);
    if (this.processedEvents.has(dedupKey)) {
      logger.debug({ dedupKey }, 'Ignoring duplicate execution event');
      return;
    }
    this.processedEvents.add(dedupKey);

    const run = await prisma.agentRun.findUnique({
      where: { externalRunId },
      include: { businessStages: { orderBy: { sequence: 'asc' } }, exceptionCase: true }
    });

    if (!run) {
      logger.warn({ externalRunId }, 'Execution event targeting unknown run');
      return;
    }

    // Terminal State Lock: Prevent late events from reverting COMPLETED / FAILED / CANCELLED runs
    if (this.isTerminalState(run.status) && event.event_type !== 'run_completed' && event.event_type !== 'run_failed') {
      logger.info({ runId: run.id, currentStatus: run.status, eventType: event.event_type }, 'Prevented late event from modifying terminal state');
      return;
    }

    const ariseEventType = mapCoastyEventTypeToArise(event.event_type);

    // 1. Create AgentStep Record
    if (event.event_type === 'step_completed' || event.event_type === 'step_started') {
      const stepSeq = event.sequence || (run.currentStep || 0) + 1;

      await prisma.agentStep.create({
        data: {
          runId: run.id,
          sequence: stepSeq,
          action: event.action_summary || event.message || 'Executing operational step',
          actionType: mapCoastyActionTypeToArise(event.action_type),
          application: event.application || 'Chrome Browser',
          status: event.event_type === 'step_completed' ? 'COMPLETED' : 'RUNNING',
          startedAt: new Date(event.timestamp),
          completedAt: event.event_type === 'step_completed' ? new Date() : null,
          result: event.result_summary || null,
          externalStepId: event.id || null,
        }
      });

      await prisma.agentRun.update({
        where: { id: run.id },
        data: { currentStep: stepSeq }
      });

      // Update current active BusinessStage
      await this.advanceBusinessStage(run.id, stepSeq);
    }

    // 2. Capture Evidence Artifact metadata
    if (event.evidence_url || event.evidence_id) {
      await prisma.evidenceItem.create({
        data: {
          runId: run.id,
          externalEvidenceId: event.evidence_id || null,
          type: EvidenceType.SCREENSHOT,
          source: 'COASTY',
          storageUrl: event.evidence_url || `/api/v1/evidence/files/ext-${event.evidence_id}`,
          capturedAt: new Date(event.timestamp),
          sha256: '0000000000000000000000000000000000000000000000000000000000000000',
          mimeType: 'image/png',
          sizeBytes: 0,
          verificationStatus: 'UNAVAILABLE',
          metadataJson: JSON.stringify({ eventId: event.id, externalRunId }),
        }
      });
    }

    // 3. Handle Awaiting Human Pause
    if (event.event_type === 'awaiting_human') {
      validateRunStateTransition(run.status, RunStatus.APPROVAL_REQUIRED);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: { status: RunStatus.APPROVAL_REQUIRED, businessOutcome: 'ESCALATED', verificationStatus: 'UNAVAILABLE' }
      });

      if (run.exceptionCaseId) {
        await prisma.exceptionCase.update({
          where: { id: run.exceptionCaseId },
          data: { status: CaseStatus.AWAITING_APPROVAL }
        });
      }

      await prisma.approvalRequest.create({
        data: {
          runId: run.id,
          exceptionCaseId: run.exceptionCaseId,
          approvalId: `APP-${Date.now()}`,
          reason: event.message || 'Action requires human authority sign-off.',
          proposedAction: 'Authorize fee adjustment / invoice writeoff',
          requiredRole: 'Finance Operations Manager',
          status: ApprovalStatus.PENDING,
          requestedAt: new Date(),
        }
      });
    }

    // 4. Handle Terminal Completion
    if (event.event_type === 'run_completed') {
      validateRunStateTransition(run.status, RunStatus.COMPLETED);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: RunStatus.COMPLETED,
          completedAt: new Date(),
          outcome: event.result_summary || 'Execution completed',
        }
      });

      // Strict Outcome Verification: Will evaluate to UNAVAILABLE unless observed business state exists!
      const report = await outcomeVerifier.verifyRun(run.id);

      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          businessOutcome: report.businessOutcome,
          verificationStatus: report.status,
        }
      });

      if (run.exceptionCaseId) {
        await prisma.exceptionCase.update({
          where: { id: run.exceptionCaseId },
          data: { status: report.businessOutcome === 'RESOLVED' ? CaseStatus.RESOLVED : CaseStatus.ESCALATED }
        });
      }
    } else if (event.event_type === 'run_failed') {
      validateRunStateTransition(run.status, RunStatus.FAILED);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: RunStatus.FAILED,
          businessOutcome: 'FAILED',
          verificationStatus: 'FAILED',
          completedAt: new Date(),
          errorMessage: event.message || 'Execution failed',
        }
      });

      if (run.exceptionCaseId) {
        await prisma.exceptionCase.update({
          where: { id: run.exceptionCaseId },
          data: { status: CaseStatus.FAILED }
        });
      }
    }

    // 5. Emit LiveEvent
    await EventService.emit({
      runId: run.id,
      type: ariseEventType,
      message: event.message || `Execution event ${event.event_type} processed.`,
      payloadJson: event.payload || { externalRunId },
      actorType: 'COASTY_AGENT',
      actorId: externalRunId,
    });
  }

  // Advance business stages as steps complete
  private async advanceBusinessStage(runId: string, currentStep: number): Promise<void> {
    const stages = await prisma.businessStage.findMany({
      where: { runId },
      orderBy: { sequence: 'asc' }
    });

    if (stages.length === 0) return;

    const targetStageIndex = Math.min(Math.floor((currentStep - 1) / 2), stages.length - 1);
    const targetStage = stages[targetStageIndex];

    if (targetStage && targetStage.status !== 'COMPLETED') {
      await prisma.businessStage.update({
        where: { id: targetStage.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          verificationStatus: 'UNAVAILABLE', // Must be independently verified by Verifier
          result: `Stage executed at step ${currentStep}`
        }
      });
    }
  }
}

export const executionEventProcessor = new ExecutionEventProcessor();
