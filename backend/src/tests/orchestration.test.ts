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

describe('ARISE Phase 3 — Execution Orchestration & Verification Tests', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Test 1: Execution Plan Builder
  it('1. should construct strongly typed ExecutionPlan with stages & policy', () => {
    const plan = planBuilder.buildPlan(
      { name: 'Wire Settlement', autoApprovalThreshold: 10000 },
      { caseNumber: 'EXC-101', customerName: 'Globex Corp', amount: 15000, exceptionType: 'UNAPPLIED_CASH' }
    );

    expect(plan.objective).toContain('Investigate and resolve UNAPPLIED_CASH');
    expect(plan.policy.riskLevel).toBe('HIGH');
    expect(plan.policy.approvalRequired).toBe(true);
    expect(plan.stages.length).toBe(6);
    expect(plan.forbiddenActions.length).toBeGreaterThan(0);
  });

  // Test 2: Execution Policy Risk Evaluation
  it('2. should evaluate risk levels and trigger human approval thresholds', () => {
    const lowRisk = policyEvaluator.evaluatePolicy(500, 10000);
    expect(lowRisk.riskLevel).toBe('LOW');
    expect(lowRisk.approvalRequired).toBe(false);

    const highRisk = policyEvaluator.evaluatePolicy(15000, 10000);
    expect(highRisk.riskLevel).toBe('HIGH');
    expect(highRisk.approvalRequired).toBe(true);

    const criticalRisk = policyEvaluator.evaluatePolicy(75000, 10000);
    expect(criticalRisk.riskLevel).toBe('CRITICAL');
    expect(criticalRisk.approvalRequired).toBe(true);
  });

  // Test 3: Orchestrator Run & Stage Creation
  it('3. should create AgentRun and 6 BusinessStages in PostgreSQL', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Orchestrated Settlement Workflow',
        category: 'Accounts Receivable',
        triggerEvent: 'Dispute Received',
        autoApprovalThreshold: 5000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const run = await orchestrator.createAndStartRun({
      workflowId: wf.id,
      idempotencyKey: `IDEM-ORCH-${Date.now()}`
    });

    expect(run?.id).toBeDefined();
    expect(run?.status).toBe('QUEUED');
    expect(run?.businessStages.length).toBe(6);
    expect(run?.businessStages[0].status).toBe('RUNNING');
  });

  // Test 4: Decoupled Business Outcome Verifier
  it('4. should evaluate business outcome separately from Coasty execution status', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Outcome Workflow',
        category: 'Audit',
        triggerEvent: 'Audit Check',
        autoApprovalThreshold: 1000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const run = await prisma.agentRun.create({
      data: {
        runId: `RUN-OUT-${Date.now()}`,
        workflowId: wf.id,
        status: RunStatus.COMPLETED
      }
    });

    const outcome = await outcomeVerifier.verifyRun(run.id);
    expect(outcome.businessOutcome).toBe('RESOLVED');
    expect(outcome.verification.status).toBe('UNAVAILABLE'); // No evidence files uploaded yet
  });

  // Test 5: Terminal State Protection
  it('5. should protect terminal states from late delayed events', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Terminal Lock Workflow',
        category: 'Safety',
        triggerEvent: 'Lock Test',
        autoApprovalThreshold: 1000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const extId = `ext-lock-${Date.now()}`;
    const run = await prisma.agentRun.create({
      data: {
        runId: `RUN-LOCK-${Date.now()}`,
        externalRunId: extId,
        workflowId: wf.id,
        status: RunStatus.COMPLETED
      }
    });

    // Attempt to process a delayed step_started event
    await executionEventProcessor.processEvent(extId, {
      run_id: extId,
      event_type: 'step_started',
      message: 'Late step event',
      timestamp: new Date().toISOString()
    });

    const freshRun = await prisma.agentRun.findUnique({ where: { id: run.id } });
    expect(freshRun?.status).toBe('COMPLETED'); // Remained COMPLETED!
  });
});
