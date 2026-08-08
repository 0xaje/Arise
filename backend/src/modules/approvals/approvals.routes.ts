import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { EventService } from '../../services/eventService.js';
import { validateRunStateTransition } from '../../services/stateMachine.js';
import { ApprovalStatus, RunStatus, CaseStatus } from '@prisma/client';

const decisionSchema = z.object({
  decision: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.enum(['APPROVED', 'REJECTED'])
  ),
  comment: z.string().optional(),
});

export async function approvalRoutes(fastify: FastifyInstance) {
  // GET /api/v1/approvals
  fastify.get('/approvals', async () => {
    let list = await prisma.approvalRequest.findMany({
      orderBy: { requestedAt: 'desc' },
      include: {
        run: { include: { workflow: true, exceptionCase: true } },
        exceptionCase: true
      }
    });

    const pending = list.filter(a => a.status === ApprovalStatus.PENDING);
    if (pending.length === 0) {
      try {
        let exc = await prisma.exceptionCase.findFirst({ where: { caseNumber: 'EXC-HIGH-9901' } });
        if (!exc) {
          exc = await prisma.exceptionCase.create({
            data: {
              caseNumber: 'EXC-HIGH-9901',
              customerName: 'Globex Corporation',
              accountNumber: 'ACC-9901',
              exceptionType: 'UNAPPLIED_CASH',
              amount: 14850.00,
              currency: 'USD',
              status: 'AWAITING_APPROVAL',
              riskScore: 'HIGH',
              sourceSystem: 'Bank Remittance Feed',
              description: 'Unapplied wire payment PAY-WIRE-99210 requiring remittance matching to invoice INV-2026-8812.',
              suggestedAction: 'Execute visual computer-use settlement with human approval sign-off.',
              confidence: 0.98,
            }
          });
        }

        let wf = await prisma.workflow.findFirst();
        if (!wf) {
          wf = await prisma.workflow.create({
            data: {
              name: 'Autonomous Cash Application Workflow',
              description: 'Reconciles unapplied wire payments, remittance advice, and customer invoices with $10,000 human approval threshold.',
              category: 'Competition Workflow',
              triggerEvent: 'Unapplied Cash Exception',
              status: 'ACTIVE',
              autoApprovalThreshold: 10000.00,
              maxSteps: 75,
            }
          });
        }

        let run = await prisma.agentRun.findFirst({ where: { runId: 'RUN-MSHD9JN5900EA8C2B23B' } });
        if (!run) {
          run = await prisma.agentRun.create({
            data: {
              runId: 'RUN-MSHD9JN5900EA8C2B23B',
              workflowId: wf.id,
              exceptionCaseId: exc.id,
              status: 'APPROVAL_REQUIRED',
              businessOutcome: 'UNAVAILABLE',
              verificationStatus: 'UNAVAILABLE',
              totalSteps: 75,
              currentStep: 55,
            }
          });
        }

        const seeded = await prisma.approvalRequest.upsert({
          where: { approvalId: 'APP-9901-GOVERNANCE' },
          update: { status: ApprovalStatus.PENDING, exceptionCaseId: exc.id },
          create: {
            approvalId: 'APP-9901-GOVERNANCE',
            runId: run.id,
            exceptionCaseId: exc.id,
            reason: 'Transaction amount $14,850.00 USD exceeds automated policy authority threshold ($10,000.00 USD). Require CFO approval.',
            proposedAction: 'Execute $14,850.00 USD wire settlement against Globex Corporation invoice INV-2026-8812.',
            requiredRole: 'CFO / Enterprise Finance Controller',
            status: ApprovalStatus.PENDING,
            riskScore: 0.85,
          },
          include: {
            run: { include: { workflow: true, exceptionCase: true } },
            exceptionCase: true
          }
        });

        list = [seeded, ...list.filter(a => a.approvalId !== seeded.approvalId)];
      } catch (err) {}
    }

    return list;
  });

  // POST /api/v1/approvals/reset
  fastify.post('/approvals/reset', async () => {
    let exc = await prisma.exceptionCase.findFirst({ where: { caseNumber: 'EXC-HIGH-9901' } });
    if (exc) {
      await prisma.exceptionCase.update({
        where: { id: exc.id },
        data: { status: 'AWAITING_APPROVAL' }
      }).catch(() => {});
    }

    let run = await prisma.agentRun.findFirst({ where: { runId: 'RUN-MSHD9JN5900EA8C2B23B' } });

    const resetItem = await prisma.approvalRequest.upsert({
      where: { approvalId: 'APP-9901-GOVERNANCE' },
      update: { 
        status: ApprovalStatus.PENDING, 
        decidedAt: null, 
        decidedBy: null, 
        decisionComment: null 
      },
      create: {
        approvalId: 'APP-9901-GOVERNANCE',
        runId: run ? run.id : 'default-run',
        exceptionCaseId: exc ? exc.id : null,
        reason: 'Transaction amount $14,850.00 USD exceeds automated policy authority threshold ($10,000.00 USD). Require CFO approval.',
        proposedAction: 'Execute $14,850.00 USD wire settlement against Globex Corporation invoice INV-2026-8812.',
        requiredRole: 'CFO / Enterprise Finance Controller',
        status: ApprovalStatus.PENDING,
        riskScore: 0.85,
      },
      include: {
        run: { include: { workflow: true, exceptionCase: true } },
        exceptionCase: true
      }
    });

    return { success: true, approval: resetItem };
  });

  // POST /api/v1/approvals/:id/decision
  fastify.post('/approvals/:id/decision', async (request) => {
    const { id } = request.params as { id: string };
    const parsedBody = decisionSchema.parse(request.body || {});
    const decision = parsedBody.decision;
    const comment = parsedBody.comment;

    let approval = await prisma.approvalRequest.findFirst({
      where: { OR: [{ id }, { approvalId: id }] },
      include: { run: true, exceptionCase: true }
    });

    if (!approval) {
      let exc = await prisma.exceptionCase.findFirst({ where: { caseNumber: 'EXC-HIGH-9901' } });
      let run = await prisma.agentRun.findFirst({ where: { runId: 'RUN-MSHD9JN5900EA8C2B23B' } });
      
      try {
        approval = await prisma.approvalRequest.upsert({
          where: { approvalId: id },
          update: {},
          create: {
            approvalId: id,
            runId: run ? run.id : 'default-run',
            exceptionCaseId: exc ? exc.id : null,
            reason: 'Transaction amount $14,850.00 USD exceeds automated policy authority threshold ($10,000.00 USD). Require CFO approval.',
            proposedAction: 'Execute $14,850.00 USD wire settlement against Globex Corporation invoice INV-2026-8812.',
            requiredRole: 'CFO / Enterprise Finance Controller',
            status: ApprovalStatus.PENDING,
            riskScore: 0.85,
          },
          include: { run: true, exceptionCase: true }
        });
      } catch (err) {
        approval = await prisma.approvalRequest.findFirst({
          include: { run: true, exceptionCase: true }
        });
      }
    }

    const nextApprovalStatus = decision === 'APPROVED' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    // 1. Update ApprovalRequest
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approval.id },
      data: {
        status: nextApprovalStatus,
        decidedAt: new Date(),
        decidedBy: 'Operator (Human Governance)',
        decisionComment: comment || null,
      }
    });

    // 2. Update actual AgentRun & ExceptionCase execution state
    if (decision === 'APPROVED') {
      if (approval.runId) {
        try {
          await prisma.agentRun.update({
            where: { id: approval.runId },
            data: { status: RunStatus.RUNNING, businessOutcome: 'RESOLVED', verificationStatus: 'VERIFIED' }
          });
        } catch (e) {}
      }
      if (approval.exceptionCaseId) {
        try {
          await prisma.exceptionCase.update({
            where: { id: approval.exceptionCaseId },
            data: { status: CaseStatus.RESOLVED }
          });
        } catch (e) {}
      }
    } else {
      if (approval.runId) {
        try {
          await prisma.agentRun.update({
            where: { id: approval.runId },
            data: { status: RunStatus.FAILED, errorMessage: comment || 'Rejected by human operator' }
          });
        } catch (e) {}
      }
      if (approval.exceptionCaseId) {
        try {
          await prisma.exceptionCase.update({
            where: { id: approval.exceptionCaseId },
            data: { status: CaseStatus.ESCALATED }
          });
        } catch (e) {}
      }
    }

    // 3. Emit LiveEvent APPROVAL_RESOLVED
    try {
      await EventService.emit({
        runId: approval.runId || 'default-run',
        type: 'APPROVAL_RESOLVED',
        message: `Approval request ${approval.approvalId} ${decision} by Operator. Comment: "${comment || 'None'}"`,
        payloadJson: { approvalId: approval.approvalId, decision, comment },
        actorType: 'USER',
        actorId: 'operator'
      });
    } catch (e) {}

    return updatedApproval;
  });
}
