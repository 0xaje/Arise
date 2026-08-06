import { prisma } from '../../lib/prisma.js';
import { EventService } from '../eventService.js';
import { AuditService } from '../auditService.js';
import { validateRunStateTransition } from '../stateMachine.js';
import { mapCoastyStatusToAriseStatus, mapCoastyActionTypeToArise, mapCoastyEventTypeToArise } from './coasty.mapper.js';
import { CoastyRunEvent, CoastyRunStatus } from './coasty.types.js';
import { RunStatus, CaseStatus, ApprovalStatus, EvidenceType } from '@prisma/client';
import { logger } from '../../lib/logger.js';

export class CoastyEventSynchronizer {
  private processedEvents = new Set<string>();

  public generateDeduplicationKey(externalRunId: string, event: CoastyRunEvent): string {
    if (event.id) return `${externalRunId}:${event.id}`;
    return `${externalRunId}:${event.event_type}:${event.sequence || 0}:${event.timestamp}`;
  }

  public async processEvent(externalRunId: string, event: CoastyRunEvent): Promise<void> {
    const dedupKey = this.generateDeduplicationKey(externalRunId, event);
    if (this.processedEvents.has(dedupKey)) {
      logger.debug({ dedupKey }, 'Skipping duplicate Coasty event');
      return;
    }
    this.processedEvents.add(dedupKey);

    // Find target AgentRun by externalRunId
    const run = await prisma.agentRun.findUnique({
      where: { externalRunId },
      include: { exceptionCase: true }
    });

    if (!run) {
      logger.warn({ externalRunId }, 'Received Coasty event for unknown externalRunId');
      return;
    }

    const ariseEventType = mapCoastyEventTypeToArise(event.event_type);

    // 1. Create AgentStep if step event
    if (event.event_type === 'step_completed' || event.event_type === 'step_started') {
      const stepCount = (run.currentStep || 0) + 1;
      await prisma.agentStep.create({
        data: {
          runId: run.id,
          sequence: event.sequence || stepCount,
          action: event.action_summary || event.message || 'Executing step action',
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
        data: { currentStep: stepCount }
      });
    }

    // 2. Handle Evidence Metadata if present
    if (event.evidence_url || event.evidence_id) {
      await prisma.evidenceItem.create({
        data: {
          runId: run.id,
          externalEvidenceId: event.evidence_id || null,
          type: EvidenceType.SCREENSHOT,
          storageUrl: event.evidence_url || `/api/v1/evidence/files/external-${event.evidence_id}`,
          capturedAt: new Date(event.timestamp),
          sha256: '0000000000000000000000000000000000000000000000000000000000000000',
          mimeType: 'image/png',
          sizeBytes: 0,
          metadataJson: JSON.stringify({ eventId: event.id, externalRunId }),
        }
      });
    }

    // 3. Handle Awaiting Human Approval Pause
    if (event.event_type === 'awaiting_human') {
      validateRunStateTransition(run.status, RunStatus.APPROVAL_REQUIRED);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: { status: RunStatus.APPROVAL_REQUIRED }
      });

      if (run.exceptionCaseId) {
        await prisma.exceptionCase.update({
          where: { id: run.exceptionCaseId },
          data: { status: CaseStatus.AWAITING_APPROVAL }
        });
      }

      const approvalId = `APP-${Date.now()}`;
      await prisma.approvalRequest.create({
        data: {
          runId: run.id,
          exceptionCaseId: run.exceptionCaseId,
          approvalId,
          reason: event.message || 'Coasty agent requires human authority review.',
          proposedAction: 'Authorize writeoff / settlement action',
          requiredRole: 'Finance Operations Manager',
          status: ApprovalStatus.PENDING,
          requestedAt: new Date(),
        }
      });
    }

    // 4. Handle Terminal Completion States
    if (event.event_type === 'run_completed') {
      validateRunStateTransition(run.status, RunStatus.COMPLETED);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: RunStatus.COMPLETED,
          completedAt: new Date(),
          outcome: event.result_summary || 'Task completed successfully',
        }
      });

      if (run.exceptionCaseId) {
        await prisma.exceptionCase.update({
          where: { id: run.exceptionCaseId },
          data: { status: CaseStatus.RESOLVED }
        });
      }
    } else if (event.event_type === 'run_failed') {
      validateRunStateTransition(run.status, RunStatus.FAILED);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: RunStatus.FAILED,
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

    // 5. Emit ARISE LiveEvent & AuditLog
    await EventService.emit({
      runId: run.id,
      type: ariseEventType,
      message: event.message || `Coasty event ${event.event_type} received.`,
      payloadJson: event.payload || { externalRunId, eventType: event.event_type },
      actorType: 'COASTY_AGENT',
      actorId: externalRunId,
    });
  }

  // Update Run status directly from Coasty Run object
  public async syncRunStatus(externalRunId: string, coastyRunStatus: CoastyRunStatus, stepCount?: number, outcome?: string, errorMsg?: string): Promise<void> {
    const run = await prisma.agentRun.findUnique({ where: { externalRunId } });
    if (!run) return;

    const newStatus = mapCoastyStatusToAriseStatus(coastyRunStatus);
    if (run.status === newStatus) return;

    validateRunStateTransition(run.status, newStatus);

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: newStatus,
        currentStep: stepCount !== undefined ? stepCount : run.currentStep,
        outcome: outcome || run.outcome,
        errorMessage: errorMsg || run.errorMessage,
        completedAt: ['COMPLETED', 'FAILED', 'CANCELLED'].includes(newStatus) ? new Date() : run.completedAt,
      }
    });

    await AuditService.createLog({
      actorType: 'COASTY_AGENT',
      actorId: externalRunId,
      action: 'SYNC_RUN_STATUS',
      resourceType: 'AgentRun',
      resourceId: run.id,
      detailsJson: { previousStatus: run.status, newStatus, coastyRunStatus }
    });
  }
}

export const coastyEventSync = new CoastyEventSynchronizer();
