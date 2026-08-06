import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';

export async function auditRoutes(fastify: FastifyInstance) {
  // GET /api/v1/audit
  fastify.get('/audit', async (request) => {
    const { runId, caseId, actorId, fromDate, toDate } = request.query as {
      runId?: string;
      caseId?: string;
      actorId?: string;
      fromDate?: string;
      toDate?: string;
    };

    const where: any = {};
    if (runId) {
      where.OR = [{ resourceId: runId }, { detailsJson: { contains: runId } }];
    }
    if (caseId) {
      where.OR = [{ resourceId: caseId }, { detailsJson: { contains: caseId } }];
    }
    if (actorId) {
      where.actorId = actorId;
    }
    if (fromDate || toDate) {
      where.timestamp = {};
      if (fromDate) where.timestamp.gte = new Date(fromDate);
      if (toDate) where.timestamp.lte = new Date(toDate);
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });
  });
}
