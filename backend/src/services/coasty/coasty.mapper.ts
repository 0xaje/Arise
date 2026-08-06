import { RunStatus, ActionType, EventType } from '@prisma/client';
import { CoastyRunStatus } from './coasty.types.js';

export function mapCoastyStatusToAriseStatus(status: CoastyRunStatus): RunStatus {
  switch (status) {
    case 'queued':
      return RunStatus.QUEUED;
    case 'starting':
      return RunStatus.STARTING;
    case 'running':
      return RunStatus.RUNNING;
    case 'awaiting_human':
      return RunStatus.APPROVAL_REQUIRED;
    case 'succeeded':
      return RunStatus.COMPLETED;
    case 'failed':
    case 'timed_out':
      return RunStatus.FAILED;
    case 'cancelled':
      return RunStatus.CANCELLED;
    default:
      return RunStatus.RUNNING;
  }
}

export function mapCoastyActionTypeToArise(actionType?: string): ActionType {
  if (!actionType) return ActionType.OBSERVE;

  const upper = actionType.toUpperCase();
  if (upper in ActionType) {
    return upper as ActionType;
  }

  if (upper.includes('CLICK')) return ActionType.CLICK;
  if (upper.includes('TYPE') || upper.includes('INPUT')) return ActionType.TYPE;
  if (upper.includes('NAV') || upper.includes('URL') || upper.includes('GOTO')) return ActionType.NAVIGATE;
  if (upper.includes('SEARCH') || upper.includes('FIND')) return ActionType.SEARCH;
  if (upper.includes('READ') || upper.includes('EXTRACT')) return ActionType.READ;
  if (upper.includes('VERIFY') || upper.includes('ASSERT')) return ActionType.VERIFY;
  if (upper.includes('SUBMIT') || upper.includes('POST')) return ActionType.SUBMIT;

  return ActionType.OBSERVE;
}

export function mapCoastyEventTypeToArise(eventType: string): EventType {
  switch (eventType) {
    case 'run_created':
      return EventType.RUN_CREATED;
    case 'run_started':
      return EventType.RUN_STARTED;
    case 'step_started':
      return EventType.STEP_STARTED;
    case 'step_completed':
      return EventType.STEP_COMPLETED;
    case 'awaiting_human':
      return EventType.APPROVAL_REQUIRED;
    case 'run_completed':
      return EventType.RUN_COMPLETED;
    case 'run_failed':
      return EventType.RUN_FAILED;
    default:
      return EventType.STEP_COMPLETED;
  }
}
