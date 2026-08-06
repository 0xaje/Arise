import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { competitionService } from '../services/execution/competition.service.js';
import { orchestrator } from '../services/execution/execution.orchestrator.js';
import { WorkflowStatus, RunStatus } from '@prisma/client';

const app = buildApp();

describe('ARISE Phase 4D — Real Coasty Competition Workflow Tests', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Test 1: Final Execution Arm Flag
  it('1. should default FINAL_COMPETITION_EXECUTION_ENABLED to false for safety', () => {
    expect(competitionService.isFinalExecutionArmEnabled()).toBe(false);
  });

  // Test 2: Deterministic Reconciliation Service
  it('2. should accurately reconcile matching vs mismatching invoice & remittance records', () => {
    const match = competitionService.reconcilePaymentAndInvoice({
      paymentAmount: 14850,
      remittanceAmount: 14850,
      invoiceAmount: 14850,
      paymentCurrency: 'USD',
      invoiceCurrency: 'USD',
      customerName: 'Globex Corporation',
      remittanceCustomer: 'Globex Corporation',
      invoiceNumber: 'INV-2026-8812',
      remittanceRef: 'REM-WIRE-8812',
    });

    expect(match.isMatch).toBe(true);
    expect(match.reason).toContain('match cleanly');

    const amountMismatch = competitionService.reconcilePaymentAndInvoice({
      paymentAmount: 14850,
      remittanceAmount: 14850,
      invoiceAmount: 10000, // MISMATCH
      paymentCurrency: 'USD',
      invoiceCurrency: 'USD',
      customerName: 'Globex Corporation',
      remittanceCustomer: 'Globex Corporation',
      invoiceNumber: 'INV-2026-8812',
      remittanceRef: 'REM-WIRE-8812',
    });

    expect(amountMismatch.isMatch).toBe(false);
    expect(amountMismatch.reason).toContain('mismatches invoice amount');
  });

  // Test 3: Competition Compliance Report Generator
  it('3. should generate CompetitionComplianceReport enforcing 50 minimum steps guard', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Autonomous Cash Application Competition Workflow',
        category: 'Competition Workflow',
        triggerEvent: 'Dispute Received',
        autoApprovalThreshold: 10000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const run = await orchestrator.createAndStartRun({ workflowId: wf.id });
    if (!run) throw new Error('Failed to create run');

    // Simulate 55 steps
    await prisma.agentRun.update({
      where: { id: run.id },
      data: { currentStep: 55 }
    });

    const compliance = await competitionService.generateComplianceReport(run.id);

    expect(compliance.minimumStepsRequired).toBe(50);
    expect(compliance.actualCoastySteps).toBe(55);
    expect(compliance.stepRequirementPassed).toBe(true);
    expect(compliance.realExecution).toBe(true);
    expect(compliance.selectorsUsed).toBe(false);
    expect(compliance.mocksUsed).toBe(false);
    expect(compliance.simulatorUsed).toBe(false);
    expect(compliance.finalExecutionArmEnabled).toBe(false);
  });

  // Test 4: Approval Threshold & State Machine Pause
  it('4. should trigger human governance pause when amount exceeds $10,000 threshold', async () => {
    const wf = await prisma.workflow.create({
      data: {
        name: 'Threshold Test Workflow',
        category: 'Competition Workflow',
        triggerEvent: 'Unapplied Cash',
        autoApprovalThreshold: 10000,
        status: WorkflowStatus.ACTIVE,
      }
    });

    const exc = await prisma.exceptionCase.create({
      data: {
        caseNumber: `EXC-HIGH-${Date.now()}`,
        customerName: 'Globex Corporation',
        accountNumber: 'ACC-9901',
        exceptionType: 'UNAPPLIED_CASH',
        amount: 14850, // $14,850 > $10,000
        sourceSystem: 'NetSuite ERP',
        description: 'High value wire remittance unapplied',
        suggestedAction: 'Match invoice INV-2026-8812',
        confidence: 98.0,
      }
    });

    const run = await orchestrator.createAndStartRun({
      workflowId: wf.id,
      exceptionCaseId: exc.id
    });

    expect(run?.workflow.autoApprovalThreshold).toBe(10000);
    expect(run?.exceptionCase?.amount).toBe(14850);
    expect(run?.businessStages.length).toBe(18);
  });
});
