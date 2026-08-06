import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { planBuilder } from '../services/execution/execution.plan.js';
import { policyEvaluator } from '../services/execution/execution.policy.js';
import { orchestrator } from '../services/execution/execution.orchestrator.js';
import { outcomeVerifier } from '../services/execution/execution.verifier.js';
import { executionEventProcessor } from '../services/execution/execution.events.js';
import { WorkflowStatus, RunStatus } from '@prisma/client';

const app = buildApp();

describe('ARISE Phase 3.1 — Verification Integrity Hardening Tests', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Test 1: Coasty completed + no observed state = Business Outcome UNAVAILABLE (NOT RESOLVED)
  it('1. should return Business Outcome UNAVAILABLE when Coasty completes without observed business state', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'No False Positive Workflow',
        category: 'Safety',
        triggerEvent: 'Smoke Check',
        autoApprovalThreshold: 5000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const run = await prisma.agentRun.create({
      data: {
        runId: `RUN-TEST-NOFP-${Date.now()}`,
        workflowId: wf.id,
        status: RunStatus.COMPLETED
      }
    });

    const report = await outcomeVerifier.verifyRun(run.id);

    expect(report.businessOutcome).toBe('UNAVAILABLE');
    expect(report.status).toBe('UNAVAILABLE');
    expect(report.message).toContain('business state has not been independently observed');
  });

  // Test 2: Coasty completed + observed state MATCH = RESOLVED + VERIFIED
  it('2. should return Business Outcome RESOLVED when expected state matches observed business state', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Matching State Workflow',
        category: 'Accounts Receivable',
        triggerEvent: 'Wire Received',
        autoApprovalThreshold: 10000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const exc = await prisma.exceptionCase.create({
      data: {
        caseNumber: `EXC-M-${Date.now()}`,
        customerName: 'Acme Corp',
        accountNumber: 'ACC-1234',
        exceptionType: 'UNAPPLIED_CASH',
        amount: 4500,
        sourceSystem: 'Stripe',
        description: 'Test wire',
        suggestedAction: 'Match invoice',
        confidence: 95.0,
      }
    });

    const plan = planBuilder.buildPlan(wf, exc);
    plan.contract.expectedState = {
      recordReference: `case/${exc.caseNumber}`,
      fields: { status: 'RESOLVED', amount: 4500 }
    };

    const run = await prisma.agentRun.create({
      data: {
        runId: `RUN-MATCH-${Date.now()}`,
        workflowId: wf.id,
        exceptionCaseId: exc.id,
        status: RunStatus.COMPLETED,
        executionPlanJson: JSON.stringify(plan)
      }
    });

    const report = await outcomeVerifier.verifyRun(run.id, {
      source: 'NetSuite ERP',
      observedAt: new Date(),
      application: 'NetSuite',
      recordReference: `case/${exc.caseNumber}`,
      fields: { status: 'RESOLVED', amount: 4500 },
      evidenceIds: [],
      observationMethod: 'REAL_COMPUTER_USE'
    });

    expect(report.businessOutcome).toBe('RESOLVED');
    expect(report.status).toBe('VERIFIED');
    expect(report.comparisonResult).toBe('MATCH');
  });

  // Test 3: Coasty completed + observed state MISMATCH = FAILED
  it('3. should return Business Outcome FAILED when observed state mismatches expected state', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Mismatch Workflow',
        category: 'Accounts Receivable',
        triggerEvent: 'Mismatch Test',
        autoApprovalThreshold: 10000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const exc = await prisma.exceptionCase.create({
      data: {
        caseNumber: `EXC-MIS-${Date.now()}`,
        customerName: 'Beta LLC',
        accountNumber: 'ACC-[5678]',
        exceptionType: 'UNAPPLIED_CASH',
        amount: 4500,
        sourceSystem: 'Stripe',
        description: 'Test wire mismatch',
        suggestedAction: 'Match invoice',
        confidence: 90.0,
      }
    });

    const plan = planBuilder.buildPlan(wf, exc);

    const run = await prisma.agentRun.create({
      data: {
        runId: `RUN-MISMATCH-${Date.now()}`,
        workflowId: wf.id,
        exceptionCaseId: exc.id,
        status: RunStatus.COMPLETED,
        executionPlanJson: JSON.stringify(plan)
      }
    });

    const report = await outcomeVerifier.verifyRun(run.id, {
      source: 'NetSuite ERP',
      observedAt: new Date(),
      application: 'NetSuite',
      recordReference: `case/${exc.caseNumber}`,
      fields: { status: 'UNPAID', amount: 4500 }, // MISMATCH!
      evidenceIds: [],
      observationMethod: 'REAL_COMPUTER_USE'
    });

    expect(report.businessOutcome).toBe('FAILED');
    expect(report.status).toBe('FAILED');
    expect(report.comparisonResult).toBe('MISMATCH');
  });

  // Test 4: Approval required = ESCALATED
  it('4. should return Business Outcome ESCALATED when human approval is required', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Approval Escalation Workflow',
        category: 'Governance',
        triggerEvent: 'High Value',
        autoApprovalThreshold: 5000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const run = await prisma.agentRun.create({
      data: {
        runId: `RUN-ESC-${Date.now()}`,
        workflowId: wf.id,
        status: RunStatus.APPROVAL_REQUIRED
      }
    });

    const report = await outcomeVerifier.verifyRun(run.id);

    expect(report.businessOutcome).toBe('ESCALATED');
    expect(report.status).toBe('UNAVAILABLE');
  });

  // Test 5: Collision-resistant ULID Run ID Generation
  it('5. should generate unique collision-resistant ULID run IDs', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'ULID Test Workflow',
        category: 'System',
        triggerEvent: 'ULID Test',
        autoApprovalThreshold: 1000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const run1 = await orchestrator.createAndStartRun({ workflowId: wf.id });
    const run2 = await orchestrator.createAndStartRun({ workflowId: wf.id });

    expect(run1?.runId).toBeDefined();
    expect(run2?.runId).toBeDefined();
    expect(run1?.runId).not.toBe(run2?.runId);
    expect(run1?.runId).toMatch(/^RUN-[0-[#1-9A-Z]+/);
  });
});
