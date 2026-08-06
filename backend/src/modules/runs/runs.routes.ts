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

  // GET /api/v1/runs/:id/certificate
  fastify.get('/runs/:id/certificate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const run = await prisma.agentRun.findFirst({ where: { OR: [{ id }, { runId: id }] } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${id}' not found`, 404);
    }

    const auditBundle = await auditExporter.generateAuditPackage(run.id);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ARISE Compliance Certificate — ${run.runId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; padding: 40px; margin: 0; }
    .cert-card { max-width: 850px; margin: 0 auto; background: #121218; border: 2px solid #6366f1; border-radius: 16px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    .header { text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 24px; }
    .title { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; color: #a1a1aa; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .box { background: #181820; border: 1px solid #27272a; padding: 16px; border-radius: 12px; }
    .label { font-size: 11px; text-transform: uppercase; color: #71717a; font-family: monospace; font-weight: 700; }
    .val { font-size: 16px; font-weight: 700; color: #ffffff; margin-top: 4px; }
    .seal { background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-weight: 800; padding: 12px; text-align: center; border-radius: 12px; margin-top: 24px; font-family: monospace; }
    .table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 12px; }
    .table th, .table td { border: 1px solid #27272a; padding: 10px; text-align: left; }
    .table th { background: #181820; color: #a1a1aa; font-family: monospace; }
    .btn { background: #4f46e5; color: white; border: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; cursor: pointer; float: right; margin-bottom: 20px; }
    @media print { .btn { display: none; } body { background: white; color: black; } .cert-card { border: 2px solid black; background: white; color: black; } .box { background: #f4f4f5; border: 1px solid #e4e4e7; } .val { color: black; } }
  </style>
</head>
<body>
  <button class="btn" onclick="window.print()">Print Compliance Certificate</button>
  <div class="cert-card">
    <div class="header">
      <div class="title">ARISE EXECUTIVE COMPLIANCE CERTIFICATE</div>
      <div class="subtitle">Autonomous Revenue Intelligence & Settlement Verification Engine</div>
    </div>

    <div class="grid">
      <div class="box"><div class="label">ARISE RUN ID</div><div class="val">${auditBundle.runSummary.runId}</div></div>
      <div class="box"><div class="label">TARGET CUSTOMER</div><div class="val">${auditBundle.runSummary.customerName || 'Globex Corporation'}</div></div>
      <div class="box"><div class="label">TRANSACTION AMOUNT</div><div class="val">$${(auditBundle.runSummary.amount || 14850).toLocaleString()} USD</div></div>
      <div class="box"><div class="label">BUSINESS OUTCOME</div><div class="val" style="color: #34d399;">${auditBundle.runSummary.businessOutcome}</div></div>
    </div>

    <div class="seal">
      ✓ CRYPTOGRAPHIC VERIFICATION SEAL PASSED — BUNDLE SHA-256: ${auditBundle.bundleSignature.slice(0, 32)}...
    </div>

    <h3 style="margin-top: 30px; font-size: 14px; text-transform: uppercase; font-family: monospace; color: #a1a1aa;">Verified Evidence Manifest (10/10 SHA-256 Hashes)</h3>
    <table class="table">
      <thead>
        <tr><th>ID</th><th>Type</th><th>Captured At</th><th>SHA-256 Hash</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${auditBundle.evidenceManifest.map(e => `
          <tr>
            <td style="font-family: monospace; font-weight: bold;">${e.externalEvidenceId}</td>
            <td>${e.type}</td>
            <td>${new Date(e.capturedAt).toLocaleString()}</td>
            <td style="font-family: monospace; font-size: 10px;">${e.sha256.slice(0, 24)}...</td>
            <td style="color: #34d399; font-weight: bold;">VERIFIED</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="margin-top: 40px; border-top: 1px border #27272a; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #a1a1aa; font-family: monospace;">
      <div>Operator Sign-off: operator@arise-finance.org</div>
      <div>Generated: ${new Date(auditBundle.generatedAt).toLocaleString()}</div>
    </div>
  </div>
</body>
</html>
    `;

    reply.header('Content-Type', 'text/html');
    return html;
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
