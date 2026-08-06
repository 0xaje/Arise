import { RunStatus } from '@prisma/client';
import { AppError } from '../lib/errors.js';

const VALID_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  QUEUED: ['STARTING', 'CANCELLED', 'FAILED'],
  STARTING: ['RUNNING', 'FAILED', 'CANCELLED'],
  RUNNING: ['WAITING', 'APPROVAL_REQUIRED', 'RECOVERING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  WAITING: ['RUNNING', 'FAILED', 'CANCELLED'],
  APPROVAL_REQUIRED: ['RUNNING', 'FAILED', 'CANCELLED'],
  RECOVERING: ['RUNNING', 'FAILED', 'CANCELLED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export function validateRunStateTransition(currentStatus: RunStatus, newStatus: RunStatus): void {
  if (currentStatus === newStatus) return;

  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      'INVALID_STATE_TRANSITION',
      `Cannot transition AgentRun from status '${currentStatus}' to '${newStatus}'. Allowed transitions: [${allowed.join(', ')}]`,
      400
    );
  }
}
