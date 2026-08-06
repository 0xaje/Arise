import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { AuditService } from '../../services/auditService.js';
import { EventService } from '../../services/eventService.js';
import { CaseStatus, ExceptionType, RiskScore } from '@prisma/client';

const createExceptionSchema = z.object({
  caseNumber: z.string().optional(),
  customerName: z.string().min(1),
  accountNumber: z.string().min(1),
  exceptionType: z.nativeEnum(ExceptionType),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  riskScore: z.nativeEnum(RiskScore).default(RiskScore.MEDIUM),
  sourceSystem: z.string().min(1),
  description: z.string().min(1),
  suggestedAction: z.string().min(1),
  confidence: z.number().min(0).max(100).default(95.0),
  assignedWorkflowId: z.string().optional(),
});

export async function exceptionRoutes(fastify: FastifyInstance) {
  // GET /api/v1/exceptions
  fastify.get('/exceptions', async (request) => {
    const { status, search, limit = 50, page = 1 } = request.query as {
      status?: CaseStatus;
      search?: string;
      limit?: number;
      page?: number;
    };

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const where: any = {};
    if (status && Object.values(CaseStatus).includes(status)) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.exceptionCase.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { assignedWorkflow: true }
      }),
      prisma.exceptionCase.count({ where })
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  });

  // GET /api/v1/exceptions/:id
  fastify.get('/exceptions/:id', async (request) => {
    const { id } = request.params as { id: string };
    const exception = await prisma.exceptionCase.findUnique({
      where: { id },
      include: {
        assignedWorkflow: true,
        agentRuns: { orderBy: { createdAt: 'desc' } },
        approvalRequests: { orderBy: { requestedAt: 'desc' } }
      }
    });

    if (!exception) {
      throw new AppError('EXCEPTION_NOT_FOUND', `ExceptionCase with id '${id}' not found`, 404);
    }

    return exception;
  });

  // POST /api/v1/exceptions
  fastify.post('/exceptions', async (request, reply) => {
    const data = createExceptionSchema.parse(request.body);
    const count = await prisma.exceptionCase.count();
    const caseNumber = data.caseNumber || `EXC-${1000 + count + 1}`;

    const created = await prisma.exceptionCase.create({
      data: {
        ...data,
        caseNumber,
      }
    });

    await AuditService.createLog({
      actorType: 'API',
      actorId: 'client',
      action: 'INGEST_EXCEPTION',
      resourceType: 'ExceptionCase',
      resourceId: created.id,
      detailsJson: { caseNumber: created.caseNumber, amount: created.amount, customerName: created.customerName }
    });

    reply.status(201);
    return created;
  });

  // POST /api/v1/exceptions/:id/resolve
  fastify.post('/exceptions/:id/resolve', async (request) => {
    const { id } = request.params as { id: string };
    const exception = await prisma.exceptionCase.findUnique({ where: { id } });

    if (!exception) {
      throw new AppError('EXCEPTION_NOT_FOUND', `ExceptionCase with id '${id}' not found`, 404);
    }

    if (exception.status === CaseStatus.RESOLVED) {
      return exception; // idempotent
    }

    const updated = await prisma.exceptionCase.update({
      where: { id },
      data: { status: CaseStatus.RESOLVED }
    });

    await EventService.emit({
      type: 'STEP_COMPLETED',
      message: `Exception Case ${updated.caseNumber} ($${updated.amount} ${updated.customerName}) marked as RESOLVED.`,
      payloadJson: { caseId: updated.id, caseNumber: updated.caseNumber },
      actorType: 'USER',
      actorId: 'operator'
    });

    return updated;
  });
}
