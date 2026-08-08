import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { AuditService } from '../../services/auditService.js';
import { orchestrator } from '../../services/execution/execution.orchestrator.js';
import { WorkflowStatus } from '@prisma/client';

const statusEnumSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.toUpperCase() : val),
  z.nativeEnum(WorkflowStatus)
);

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  triggerEvent: z.string().min(1),
  status: statusEnumSchema.default(WorkflowStatus.ACTIVE),
  autoApprovalThreshold: z.number().nonnegative(),
  maxSteps: z.number().int().positive().default(20),
  timeoutSeconds: z.number().int().positive().default(300),
  retryLimit: z.number().int().nonnegative().default(3),
});

const runWorkflowSchema = z.object({
  exceptionCaseId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function workflowRoutes(fastify: FastifyInstance) {
  // GET /api/v1/workflows
  fastify.get('/workflows', async () => {
    return prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { agentRuns: true } } }
    });
  });

  // POST /api/v1/workflows
  fastify.post('/workflows', async (request, reply) => {
    const data = createWorkflowSchema.parse(request.body);
    const created = await prisma.workflow.create({ data });

    await AuditService.createLog({
      actorType: 'USER',
      actorId: 'operator',
      action: 'CREATE_WORKFLOW',
      resourceType: 'Workflow',
      resourceId: created.id,
      detailsJson: { name: created.name, category: created.category, threshold: created.autoApprovalThreshold }
    });

    reply.status(201);
    return created;
  });

  // PATCH /api/v1/workflows/:id/status
  fastify.patch('/workflows/:id/status', async (request) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({ status: statusEnumSchema }).parse(request.body);

    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      throw new AppError('WORKFLOW_NOT_FOUND', `Workflow with id '${id}' not found`, 404);
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: { status }
    });

    await AuditService.createLog({
      actorType: 'USER',
      actorId: 'operator',
      action: 'UPDATE_WORKFLOW_STATUS',
      resourceType: 'Workflow',
      resourceId: updated.id,
      detailsJson: { previousStatus: workflow.status, newStatus: updated.status }
    });

    return updated;
  });

  // POST /api/v1/workflows/:id/run
  fastify.post('/workflows/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = runWorkflowSchema.parse(request.body || {});
    const idempotencyHeader = request.headers['idempotency-key'] as string | undefined;
    const idempotencyKey = body.idempotencyKey || idempotencyHeader;

    const createdRun = await orchestrator.createAndStartRun({
      workflowId: id,
      exceptionCaseId: body.exceptionCaseId,
      idempotencyKey,
    });

    reply.status(201);
    return createdRun;
  });
}
