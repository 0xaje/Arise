import crypto from 'node:crypto';

// Generates collision-resistant ULID-style run IDs: RUN-01J...
export function generateRunId(): string {
  const timeMs = Date.now().toString(36).toUpperCase().padStart(8, '0');
  const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `RUN-${timeMs}${randomBytes}`;
}

export function generateApprovalId(): string {
  const timeMs = Date.now().toString(36).toUpperCase().padStart(8, '0');
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `APP-${timeMs}${randomBytes}`;
}
