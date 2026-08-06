import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export async function runRoutes(fastify: FastifyInstance) {
  // GET /api/v1/runs
  fastify.get('/runs', async () => {
    return prisma.agentRun.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        workflow: true,
        exceptionCase: true,
        _count: { select: { agentSteps: true, evidenceItems: true } }
      }
    });
  });

  // GET /api/v1/runs/:id
  fastify.get('/runs/:id', async (request) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({
      where: { OR: [{ id }, { runId: id }] },
      include: {
        workflow: true,
        exceptionCase: true,
        agentSteps: { orderBy: { sequence: 'asc' } },
        evidenceItems: { orderBy: { capturedAt: 'desc' } },
        approvalRequests: { orderBy: { requestedAt: 'desc' } },
        liveEvents: { orderBy: { timestamp: 'desc' } }
      }
    });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    return run;
  });

  // GET /api/v1/runs/:id/steps
  fastify.get('/runs/:id/steps', async (request) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    return prisma.agentStep.findMany({
      where: { runId: run.id },
      orderBy: { sequence: 'asc' },
      include: { evidenceItems: true }
    });
  });

  // GET /api/v1/runs/:id/evidence
  fastify.get('/runs/:id/evidence', async (request) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    return prisma.evidenceItem.findMany({
      where: { runId: run.id },
      orderBy: { capturedAt: 'desc' }
    });
  });

  // GET /api/v1/runs/:id/events
  fastify.get('/runs/:id/events', async (request) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    return prisma.liveEvent.findMany({
      where: { runId: run.id },
      orderBy: { timestamp: 'desc' }
    });
  });
}
