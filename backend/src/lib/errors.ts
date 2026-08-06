import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(error: FastifyError | AppError | ZodError | any, request: FastifyRequest, reply: FastifyReply) {
  const requestId = (request.id as string) || `req-${Date.now()}`;

  if (error instanceof AppError) {
    request.log.warn({ requestId, errCode: error.code, message: error.message }, 'Application domain error');
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        requestId,
      }
    });
  }

  // Zod Validation Error
  if (error instanceof ZodError || error?.name === 'ZodError') {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: (error as ZodError).issues || (error as any).errors,
        requestId,
      }
    });
  }

  // Fastify Validation Errors
  if ((error as any).validation) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Request validation failed',
        details: (error as any).validation,
        requestId,
      }
    });
  }

  request.log.error({ requestId, err: error }, 'Unhandled server error');

  return reply.status(error.statusCode || 500).send({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : error.message,
      requestId,
    }
  });
}
