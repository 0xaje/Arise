import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { validateRunStateTransition } from '../services/stateMachine.js';
import { EventService } from '../services/eventService.js';
import { AuditService } from '../services/auditService.js';
import { RunStatus, WorkflowStatus, CaseStatus, ApprovalStatus } from '@prisma/client';

const app = buildApp();

describe('ARISE Backend Foundation Integration Tests', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Test 1: Health Endpoint
  it('1. should verify health endpoint returns ok status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/health'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.database).toBe('connected');
  });

  // Test 2: Workflow Creation
  it('2. should create a new workflow via API', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workflows',
      payload: {
        name: 'Test AR Settlement Workflow',
        category: 'Accounts Receivable',
        triggerEvent: 'Bank Wire Received',
        autoApprovalThreshold: 25000,
        description: 'Auto-settle payments under $25,000'
      }
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Test AR Settlement Workflow');
    expect(body.autoApprovalThreshold).toBe(25000);
    expect(body.status).toBe('ACTIVE');
  });

  // Test 3: Workflow Validation Error
  it('3. should reject invalid workflow creation payload with 400 validation error', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workflows',
      payload: {
        name: '', // Invalid empty name
        category: 'Accounts Receivable',
        triggerEvent: 'Bank Wire',
        autoApprovalThreshold: -500 // Invalid negative threshold
      }
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  // Test 4: Run Creation
  it('4. should create an AgentRun in QUEUED state for an active workflow', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Execution Run Workflow',
        category: 'Accounts Receivable',
        triggerEvent: 'Dispute Created',
        autoApprovalThreshold: 10000,
        status: WorkflowStatus.ACTIVE
      }
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/workflows/${wf.id}/run`,
      payload: {}
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.runId).toBeDefined();
    expect(body.status).toBe('QUEUED');
    expect(body.workflowId).toBe(wf.id);
  });

  // Test 5: Invalid Run State Transition
  it('5. should reject invalid AgentRun state transitions using state machine', () => {
    expect(() => {
      validateRunStateTransition(RunStatus.COMPLETED, RunStatus.STARTING);
    }).toThrowError(/Cannot transition AgentRun/);
  });

  // Test 6: Approval Creation & Ingestion
  it('6. should query approval requests cleanly', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/approvals'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
  });

  // Test 7: Approval Decision State Transition
  it('7. should process approval decisions and update execution state', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Approval Workflow',
        category: 'Revenue Protection',
        triggerEvent: 'High Value Refund',
        autoApprovalThreshold: 5000,
        status: WorkflowStatus.ACTIVE
      }
    });

    const run = await prisma.agentRun.create({
      data: {
        runId: `RUN-APP-${Date.now()}`,
        workflowId: wf.id,
        status: RunStatus.APPROVAL_REQUIRED
      }
    });

    const approval = await prisma.approvalRequest.create({
      data: {
        runId: run.id,
        approvalId: `APP-${Date.now()}`,
        reason: 'Refund exceeds $5,000 auto-threshold',
        proposedAction: 'Authorize $7,500 writeoff',
        requiredRole: 'Finance Operations Manager',
        status: ApprovalStatus.PENDING
      }
    });

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/approvals/${approval.id}/decision`,
      payload: {
        decision: 'APPROVED',
        comment: 'Approved after executive sign-off'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('APPROVED');

    // Verify AgentRun state transitioned to RUNNING
    const updatedRun = await prisma.agentRun.findUnique({ where: { id: run.id } });
    expect(updatedRun?.status).toBe('RUNNING');
  });

  // Test 8: Tamper-Evident Audit Record Creation
  it('8. should generate SHA-256 tamper-evident verification hashes for audit logs', async () => {
    const log = await AuditService.createLog({
      actorType: 'TEST',
      actorId: 'test-runner',
      action: 'SECURITY_CHECK',
      resourceType: 'System',
      resourceId: 'sys-1',
      detailsJson: { check: 'integrity' }
    });

    expect(log.id).toBeDefined();
    expect(log.verificationHash).toBeDefined();
    expect(log.verificationHash.length).toBe(64); // SHA-256 length
  });

  // Test 9: Evidence Relationship
  it('9. should link evidence items to actual AgentRun records', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Evidence Workflow',
        category: 'Audit',
        triggerEvent: 'Capture Artifact',
        autoApprovalThreshold: 1000,
        status: WorkflowStatus.ACTIVE
      }
    });

    const run = await prisma.agentRun.create({
      data: {
        runId: `RUN-EVD-${Date.now()}`,
        workflowId: wf.id,
        status: RunStatus.RUNNING
      }
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/evidence',
      payload: {
        runId: run.id,
        type: 'SCREENSHOT',
        base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        fileName: 'dom_screenshot.png',
        mimeType: 'image/png'
      }
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.runId).toBe(run.id);
    expect(body.sha256).toBeDefined();
    expect(body.storageUrl).toContain('/api/v1/evidence/files/');
  });

  // Test 10: SSE Live Event Publication
  it('10. should create and broadcast LiveEvents', async () => {
    const event = await EventService.emit({
      type: 'STEP_COMPLETED',
      message: 'Test Step Completed',
      actorType: 'TEST',
      actorId: 'runner'
    });

    expect(event.id).toBeDefined();
    expect(event.type).toBe('STEP_COMPLETED');
  });

  // Test 11: API Validation Errors for Non-existent Endpoints/Resources
  it('11. should return structured 404 error for non-existent resources', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/workflows/non-existent-id-12345'
    });

    // 404 for unknown route or missing workflow
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error).toBeDefined();
  });

  // Test 12: Idempotency Key Handling
  it('12. should handle idempotency keys to prevent duplicate workflow run creation', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Idempotency Workflow',
        category: 'Payment',
        triggerEvent: 'Idempotent Trigger',
        autoApprovalThreshold: 1000,
        status: WorkflowStatus.ACTIVE
      }
    });

    const idempotencyKey = `IDEM-KEY-${Date.now()}`;

    const res1 = await app.inject({
      method: 'POST',
      url: `/api/v1/workflows/${wf.id}/run`,
      headers: { 'idempotency-key': idempotencyKey },
      payload: {}
    });

    const res2 = await app.inject({
      method: 'POST',
      url: `/api/v1/workflows/${wf.id}/run`,
      headers: { 'idempotency-key': idempotencyKey },
      payload: {}
    });

    expect(res1.statusCode).toBe(201);
    expect(res2.statusCode).toBe(200);

    const body1 = JSON.parse(res1.body);
    const body2 = JSON.parse(res2.body);

    expect(body1.id).toBe(body2.id);
    expect(body1.runId).toBe(body2.runId);
  });
});
