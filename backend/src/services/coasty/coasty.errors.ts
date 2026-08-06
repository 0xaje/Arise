export class CoastyError extends Error {
  public code: string;
  public statusCode: number;
  public externalRunId?: string;
  public retryable: boolean;
  public requestId?: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    retryable: boolean = false,
    externalRunId?: string,
    requestId?: string
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.externalRunId = externalRunId;
    this.requestId = requestId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
