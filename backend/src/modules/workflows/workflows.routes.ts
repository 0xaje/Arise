import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { EventService } from '../../services/eventService.js';
import { AuditService } from '../../services/auditService.js';
import { WorkflowStatus, RunStatus } from '@prisma/client';

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  triggerEvent: z.string().min(1),
  status: z.nativeEnum(WorkflowStatus).default(WorkflowStatus.ACTIVE),
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
    const { status } = z.object({ status: z.nativeEnum(WorkflowStatus) }).parse(request.body);

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

    // Check Idempotency Key
    if (idempotencyKey) {
      const existingRun = await prisma.agentRun.findUnique({
        where: { idempotencyKey },
        include: { workflow: true, exceptionCase: true }
      });
      if (existingRun) {
        request.log.info({ idempotencyKey, runId: existingRun.runId }, 'Returning idempotent AgentRun');
        return existingRun;
      }
    }

    // 1. Validate Workflow
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      throw new AppError('WORKFLOW_NOT_FOUND', `Workflow with id '${id}' not found`, 404);
    }
    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new AppError('WORKFLOW_INACTIVE', `Workflow '${workflow.name}' is not ACTIVE (current: ${workflow.status})`, 400);
    }

    // 2. Validate ExceptionCase if provided
    let exceptionCase = null;
    if (body.exceptionCaseId) {
      exceptionCase = await prisma.exceptionCase.findUnique({ where: { id: body.exceptionCaseId } });
      if (!exceptionCase) {
        throw new AppError('EXCEPTION_NOT_FOUND', `ExceptionCase with id '${body.exceptionCaseId}' not found`, 404);
      }
    }

    // 3. Create AgentRun in QUEUED state
    const runCount = await prisma.agentRun.count();
    const runId = `RUN-${10000 + runCount + 1}`;

    const createdRun = await prisma.agentRun.create({
      data: {
        runId,
        workflowId: workflow.id,
        exceptionCaseId: exceptionCase ? exceptionCase.id : null,
        status: RunStatus.QUEUED,
        totalSteps: workflow.maxSteps,
        idempotencyKey: idempotencyKey || null,
      },
      include: {
        workflow: true,
        exceptionCase: true
      }
    });

    // 4. Emit LiveEvent RUN_CREATED
    await EventService.emit({
      runId: createdRun.id,
      type: 'RUN_CREATED',
      message: `Created AgentRun ${createdRun.runId} for workflow '${workflow.name}'. Status: QUEUED.`,
      payloadJson: { runId: createdRun.runId, workflowId: workflow.id, exceptionCaseId: createdRun.exceptionCaseId },
      actorType: 'USER',
      actorId: 'operator'
    });

    reply.status(201);
    return createdRun;
  });
}
