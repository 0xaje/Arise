import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

export interface AuditPackage {
  title: string;
  generatedAt: string;
  runSummary: {
    id: string;
    runId: string;
    externalRunId: string | null;
    status: string;
    businessOutcome: string;
    verificationStatus: string;
    currentStep: number;
    totalSteps: number;
    createdAt: string;
    completedAt: string | null;
    caseNumber: string | null;
    customerName: string | null;
    amount: number | null;
  };
  evidenceManifest: Array<{
    externalEvidenceId: string;
    type: string;
    source: string;
    capturedAt: string;
    sha256: string;
    verificationStatus: string;
    metadata: any;
  }>;
  approvalHistory: Array<{
    approvalId: string;
    status: string;
    reason: string;
    requestedAt: string;
    decidedAt: string | null;
    decidedBy: string | null;
    decisionComment: string | null;
  }>;
  auditTrail: Array<{
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    details: any;
  }>;
  bundleSignature: string;
}

export class AuditExporterService {
  public async generateAuditPackage(runId: string): Promise<AuditPackage> {
    const run = await prisma.agentRun.findFirst({
      where: { OR: [{ id: runId }, { runId: runId }] },
      include: {
        workflow: true,
        exceptionCase: true,
        evidenceItems: { orderBy: { capturedAt: 'asc' } },
        approvalRequests: { orderBy: { requestedAt: 'asc' } },
      }
    });

    if (!run) {
      throw new Error(`AgentRun '${runId}' not found`);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { resourceId: run.id },
      orderBy: { timestamp: 'asc' }
    });

    const runSummary = {
      id: run.id,
      runId: run.runId,
      externalRunId: run.externalRunId,
      status: run.status,
      businessOutcome: run.businessOutcome,
      verificationStatus: run.verificationStatus,
      currentStep: run.currentStep,
      totalSteps: run.totalSteps,
      createdAt: run.createdAt.toISOString(),
      completedAt: run.completedAt ? run.completedAt.toISOString() : null,
      caseNumber: run.exceptionCase?.caseNumber || null,
      customerName: run.exceptionCase?.customerName || null,
      amount: run.exceptionCase?.amount ? Number(run.exceptionCase.amount) : null,
    };

    const evidenceManifest = run.evidenceItems.map((ev: any) => ({
      externalEvidenceId: ev.externalEvidenceId,
      type: ev.type,
      source: ev.source,
      capturedAt: ev.capturedAt.toISOString(),
      sha256: ev.sha256,
      verificationStatus: ev.verificationStatus,
      metadata: ev.metadataJson ? JSON.parse(ev.metadataJson) : null,
    }));

    const approvalHistory = run.approvalRequests.map((app: any) => ({
      approvalId: app.approvalId,
      status: app.status,
      reason: app.reason,
      requestedAt: app.requestedAt.toISOString(),
      decidedAt: app.decidedAt ? app.decidedAt.toISOString() : null,
      decidedBy: app.decidedBy || null,
      decisionComment: app.decisionComment || null,
    }));

    const auditTrail = auditLogs.map((log: any) => ({
      id: log.id,
      action: log.action,
      actor: `${log.actorType}:${log.actorId}`,
      timestamp: log.timestamp.toISOString(),
      details: log.detailsJson ? JSON.parse(log.detailsJson) : null,
    }));

    const payloadToHash = JSON.stringify({ runSummary, evidenceManifest, approvalHistory });
    const bundleSignature = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const auditPackage: AuditPackage = {
      title: `ARISE Autonomous Finance Cryptographic Audit Bundle — ${run.runId}`,
      generatedAt: new Date().toISOString(),
      runSummary,
      evidenceManifest,
      approvalHistory,
      auditTrail,
      bundleSignature,
    };

    logger.info({ runId: run.runId, bundleSignature }, 'Generated Cryptographic Audit Package');
    return auditPackage;
  }
}

export const auditExporter = new AuditExporterService();
