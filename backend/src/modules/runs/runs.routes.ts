import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { orchestrator } from '../../services/execution/execution.orchestrator.js';
import { competitionService } from '../../services/execution/competition.service.js';
import { auditExporter } from '../../services/audit/auditExporter.js';

export async function runRoutes(fastify: FastifyInstance) {
  // GET /api/v1/runs
  fastify.get('/runs', async () => {
    return prisma.agentRun.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        workflow: true,
        exceptionCase: true,
        businessStages: { orderBy: { sequence: 'asc' } },
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
        businessStages: { orderBy: { sequence: 'asc' } },
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

  // GET /api/v1/runs/:id/export
  fastify.get('/runs/:id/export', async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    const auditBundle = await auditExporter.generateAuditPackage(run.id);
    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="arise-audit-bundle-${run.runId}.json"`);
    return auditBundle;
  });

  // POST /api/v1/runs/:id/reverse
  fastify.post('/runs/:id/reverse', async (request) => {
    const { id } = request.params as { id: string };
    const body = (request.body as { actor?: string; reason?: string }) || {};
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    return orchestrator.reverseRun(run.id, body.actor, body.reason);
  });

  // GET /api/v1/runs/:id/compliance
  fastify.get('/runs/:id/compliance', async (request) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    return competitionService.generateComplianceReport(run.id);
  });

  // GET /api/v1/runs/:id/stages
  fastify.get('/runs/:id/stages', async (request) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    return prisma.businessStage.findMany({
      where: { runId: run.id },
      orderBy: { sequence: 'asc' }
    });
  });

  // POST /api/v1/runs/:id/verify
  fastify.post('/runs/:id/verify', async (request) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    return orchestrator.verifyOutcome(run.id);
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
