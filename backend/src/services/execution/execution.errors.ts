export class ExecutionError extends Error {
  public code: string;
  public statusCode: number;
  public runId?: string;

  constructor(code: string, message: string, statusCode: number = 400, runId?: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.runId = runId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PolicyViolationError extends ExecutionError {
  constructor(message: string, runId?: string) {
    super('POLICY_VIOLATION', message, 403, runId);
  }
}

export class VerificationError extends ExecutionError {
  constructor(message: string, runId?: string) {
    super('VERIFICATION_FAILED', message, 422, runId);
  }
}

export class TerminalStateError extends ExecutionError {
  constructor(message: string, runId?: string) {
    super('TERMINAL_STATE_LOCKED', message, 409, runId);
  }
}
