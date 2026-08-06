import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { CaseStatus, RunStatus } from '@prisma/client';

export async function reportRoutes(fastify: FastifyInstance) {
  // GET /api/v1/reports/summary
  fastify.get('/reports/summary', async () => {
    // 1. Calculate Monthly Recovered Revenue from RESOLVED ExceptionCases
    const resolvedCases = await prisma.exceptionCase.findMany({
      where: { status: CaseStatus.RESOLVED }
    });

    const monthlyRecoveredValue = resolvedCases.reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Calculate MTTR (Mean Time to Resolution) from COMPLETED AgentRuns
    const completedRuns = await prisma.agentRun.findMany({
      where: { status: RunStatus.COMPLETED, durationMs: { not: null } }
    });

    const totalDurationMs = completedRuns.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
    const mttrSeconds = completedRuns.length > 0
      ? Number((totalDurationMs / completedRuns.length / 1000).toFixed(2))
      : 0;

    // 3. Calculate FTE Hours Saved (assumes 15 min saved per resolved case)
    const fteHoursSaved = Number(((resolvedCases.length * 15) / 60).toFixed(1));

    // 4. Calculate Resolution Velocity by Exception Category
    const allCases = await prisma.exceptionCase.findMany();
    const categoriesMap: Record<string, { total: number; resolved: number }> = {};

    for (const c of allCases) {
      if (!categoriesMap[c.exceptionType]) {
        categoriesMap[c.exceptionType] = { total: 0, resolved: 0 };
      }
      categoriesMap[c.exceptionType].total += 1;
      if (c.status === CaseStatus.RESOLVED) {
        categoriesMap[c.exceptionType].resolved += 1;
      }
    }

    const resolutionVelocity = Object.entries(categoriesMap).map(([type, stats]) => ({
      category: type.replace(/_/g, ' '),
      count: stats.total,
      automationRate: stats.total > 0 ? Number(((stats.resolved / stats.total) * 100).toFixed(1)) : 0
    }));

    const totalCount = allCases.length;
    const totalResolved = resolvedCases.length;
    const automationRate = totalCount > 0 ? Number(((totalResolved / totalCount) * 100).toFixed(1)) : 0;

    return {
      monthlyRecoveredValue,
      mttrSeconds,
      fteHoursSaved,
      automationRate,
      resolutionVelocity,
      totalCasesCount: totalCount,
      resolvedCasesCount: totalResolved
    };
  });
}
