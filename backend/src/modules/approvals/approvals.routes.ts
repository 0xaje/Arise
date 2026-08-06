import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { EventService } from '../../services/eventService.js';
import { validateRunStateTransition } from '../../services/stateMachine.js';
import { ApprovalStatus, RunStatus, CaseStatus } from '@prisma/client';

const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});

export async function approvalRoutes(fastify: FastifyInstance) {
  // GET /api/v1/approvals
  fastify.get('/approvals', async () => {
    return prisma.approvalRequest.findMany({
      orderBy: { requestedAt: 'desc' },
      include: {
        run: { include: { workflow: true } },
        exceptionCase: true
      }
    });
  });

  // POST /api/v1/approvals/:id/decision
  fastify.post('/approvals/:id/decision', async (request) => {
    const { id } = request.params as { id: string };
    const { decision, comment } = decisionSchema.parse(request.body);

    const approval = await prisma.approvalRequest.findFirst({
      where: { OR: [{ id }, { approvalId: id }] },
      include: { run: true, exceptionCase: true }
    });

    if (!approval) {
      throw new AppError('APPROVAL_NOT_FOUND', `ApprovalRequest '${id}' not found`, 404);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new AppError('APPROVAL_ALREADY_DECIDED', `ApprovalRequest '${approval.approvalId}' is already ${approval.status}`, 400);
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
      if (approval.run) {
        validateRunStateTransition(approval.run.status, RunStatus.RUNNING);
        await prisma.agentRun.update({
          where: { id: approval.runId },
          data: { status: RunStatus.RUNNING }
        });
      }
      if (approval.exceptionCaseId) {
        await prisma.exceptionCase.update({
          where: { id: approval.exceptionCaseId },
          data: { status: CaseStatus.INVESTIGATING }
        });
      }
    } else {
      if (approval.run) {
        validateRunStateTransition(approval.run.status, RunStatus.FAILED);
        await prisma.agentRun.update({
          where: { id: approval.runId },
          data: { status: RunStatus.FAILED, errorMessage: comment || 'Rejected by human operator' }
        });
      }
      if (approval.exceptionCaseId) {
        await prisma.exceptionCase.update({
          where: { id: approval.exceptionCaseId },
          data: { status: CaseStatus.ESCALATED }
        });
      }
    }

    // 3. Emit LiveEvent APPROVAL_RESOLVED
    await EventService.emit({
      runId: approval.runId,
      type: 'APPROVAL_RESOLVED',
      message: `Approval request ${approval.approvalId} ${decision} by Operator. Comment: "${comment || 'None'}"`,
      payloadJson: { approvalId: approval.approvalId, decision, comment },
      actorType: 'USER',
      actorId: 'operator'
    });

    return updatedApproval;
  });
}
