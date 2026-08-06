import { ExecutionPlan, ExecutionStageDef } from './execution.types.js';
import { policyEvaluator } from './execution.policy.js';

export class ExecutionPlanBuilder {
  public buildPlan(workflow: any, exceptionCase?: any): ExecutionPlan {
    const amount = exceptionCase?.amount || 0;
    const threshold = workflow?.autoApprovalThreshold || 10000;

    const policy = policyEvaluator.evaluatePolicy(amount, threshold);

    const stages: ExecutionStageDef[] = [
      { sequence: 1, name: 'Intake & Initialization', objective: 'Initialize execution environment and load target case context' },
      { sequence: 2, name: 'Target Case Identification', objective: 'Navigate to business application and locate customer ledger' },
      { sequence: 3, name: 'Cross-System Reconciliation', objective: 'Inspect unapplied wire receipts against open ERP invoice balances' },
      { sequence: 4, name: 'Policy & Authority Evaluation', objective: 'Evaluate transaction risk level and auto-settlement threshold limits' },
      { sequence: 5, name: 'Operational Resolution Action', objective: 'Apply authorized invoice posting or request human governance approval' },
      { sequence: 6, name: 'Visual Outcome Verification', objective: 'Verify resulting ledger state visually and capture evidence proof' },
    ];

    const forbiddenActions = [
      'Never fabricate invoice numbers or transaction receipts',
      'Never reveal authentication credentials or tokens',
      'Never execute writeoffs exceeding authorized threshold without human sign-off',
      'Never claim success without visual on-screen verification',
    ];

    const verificationCriteria = [
      'Target invoice status shows PAID or APPLIED in ledger',
      'Unapplied cash balance reduced by exact wire remittance amount',
      'Cryptographic SHA-256 evidence item captured in vault',
    ];

    const stoppingConditions = [
      'Transaction amount exceeds auto-approval limit',
      'Target customer account record not found in system',
      'Application error or unexpected navigation behavior',
    ];

    return {
      objective: exceptionCase
        ? `Investigate and resolve ${exceptionCase.exceptionType} for ${exceptionCase.customerName} ($${exceptionCase.amount} ${exceptionCase.currency})`
        : `Execute workflow: ${workflow.name}`,
      caseContext: {
        caseId: exceptionCase?.id,
        caseNumber: exceptionCase?.caseNumber,
        customerName: exceptionCase?.customerName,
        accountNumber: exceptionCase?.accountNumber,
        exceptionType: exceptionCase?.exceptionType,
        amount: exceptionCase?.amount,
        currency: exceptionCase?.currency || 'USD',
        sourceSystem: exceptionCase?.sourceSystem,
      },
      allowedApplications: policy.allowedApplications,
      allowedActions: policy.allowedActionTypes,
      forbiddenActions,
      policy,
      stages,
      verificationCriteria,
      stoppingConditions,
    };
  }
}

export const planBuilder = new ExecutionPlanBuilder();
