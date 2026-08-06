import { ExecutionPlan, ExecutionStageDef, BusinessResolutionContract } from './execution.types.js';
import { policyEvaluator } from './execution.policy.js';

export class ExecutionPlanBuilder {
  public buildPlan(workflow: any, exceptionCase?: any): ExecutionPlan {
    const amount = exceptionCase?.amount || 14850;
    const threshold = workflow?.autoApprovalThreshold || 10000;

    const policy = policyEvaluator.evaluatePolicy(amount, threshold);

    const stages: ExecutionStageDef[] = [
      { sequence: 1, name: 'Intake & Environment Setup', objective: 'Launch Chrome browser, log in to accounting portal, and open finance operations workspace' },
      { sequence: 2, name: 'Exception Case Locating', objective: 'Filter unapplied payment queue and locate target exception case EXC-HIGH-9901' },
      { sequence: 3, name: 'Payment Record Inspection', objective: 'Search payment transaction PAY-WIRE-99210 and inspect ledger card' },
      { sequence: 4, name: 'Payment Attribute Verification', objective: 'Read payment gross amount ($14,850.00 USD), status (UNAPPLIED), and deposit date' },
      { sequence: 5, name: 'Remittance Advice Discovery', objective: 'Locate remittance document REM-WIRE-8812 and open attachment viewer' },
      { sequence: 6, name: 'Remittance Information Validation', objective: 'Validate remittance issuer, net amount, and target invoice reference INV-2026-8812' },
      { sequence: 7, name: 'Customer Account Search', objective: 'Search customer account Globex Corporation and open customer master record ACC-9901' },
      { sequence: 8, name: 'Customer Ledger Inspection', objective: 'Read customer account standing, open balance ($14,850.00 USD), and credit terms' },
      { sequence: 9, name: 'Customer Payment History Review', objective: 'Inspect 12-month payment history to confirm wire transfer pattern and dispute history' },
      { sequence: 10, name: 'Invoice Discovery & Inspection', objective: 'Navigate to open invoices tab and locate invoice record INV-2026-8812' },
      { sequence: 11, name: 'Invoice Ledger Verification', objective: 'Read invoice date, due date, original billing amount, and outstanding balance ($14,850.00 USD)' },
      { sequence: 12, name: 'Remittance-to-Invoice Reconciliation', objective: 'Cross-reconcile payment, remittance advice, customer ledger, and invoice reference' },
      { sequence: 13, name: 'Risk Authority Policy Assessment', objective: 'Evaluate transaction risk policy and detect $14,850.00 > $10,000.00 governance threshold' },
      { sequence: 14, name: 'Human Governance Approval Gate', objective: 'Pause execution in WAITING_FOR_HUMAN state and render High-Value Approval Request' },
      { sequence: 15, name: 'Human Decision & Resume', objective: 'Persist operator approval decision and resume same Coasty run execution' },
      { sequence: 16, name: 'Payment Application Posting', objective: 'Open payment application modal, select invoice INV-2026-8812, and post application' },
      { sequence: 17, name: 'Post-Action Ledger Verification', objective: 'Re-open payment and invoice records to verify APPLIED status and $0.00 zero balance' },
      { sequence: 18, name: 'Evidence Integrity & Audit Closure', objective: 'Verify SHA-256 evidence hashes and finalize auditable resolution record' },
    ];

    const forbiddenActions = [
      'Never fabricate invoice numbers or transaction receipts',
      'Never reveal authentication credentials or tokens',
      'Never execute writeoffs or payment applications exceeding threshold without human sign-off',
      'Never claim success without visual on-screen ledger verification',
      'Never use DOM selectors, XPath, or Playwright scripts for business interaction',
    ];

    const verificationCriteria = [
      'Computer-use execution completed successfully',
      'Minimum 50 Coasty computer-use steps executed (Target: 72)',
      'Target invoice status shows PAID in ledger',
      'Unapplied payment balance reduced to $0.00',
      'Cryptographic SHA-256 evidence hashes verified',
    ];

    const stoppingConditions = [
      'Transaction amount exceeds auto-approval limit without human sign-off',
      'Target customer account record not found in system',
      'Discrepancy detected between remittance advice and invoice amount',
      'Application error or unexpected navigation behavior',
    ];

    const contract: BusinessResolutionContract = {
      objective: exceptionCase
        ? `Resolve ${exceptionCase.exceptionType} for ${exceptionCase.customerName}`
        : `Execute Competition Cash Application Workflow`,
      expectedState: {
        recordReference: exceptionCase ? `case/${exceptionCase.caseNumber}` : 'case/EXC-HIGH-9901',
        fields: { 
          paymentStatus: 'APPLIED', 
          unappliedAmount: 0.00,
          invoiceStatus: 'PAID',
          outstandingBalance: 0.00
        }
      },
      verificationCriteria: [
        {
          id: 'CRIT-1',
          description: 'Computer-use execution completed successfully',
          required: true,
          status: 'UNAVAILABLE',
          evidenceIds: []
        },
        {
          id: 'CRIT-2',
          description: 'Target record reference match',
          required: true,
          status: 'UNAVAILABLE',
          evidenceIds: []
        },
        {
          id: 'CRIT-3',
          description: 'Observed business state matches expected state',
          required: true,
          status: 'UNAVAILABLE',
          evidenceIds: []
        },
        {
          id: 'CRIT-4',
          description: 'Cryptographic SHA-256 evidence integrity validated',
          required: false,
          status: 'UNAVAILABLE',
          evidenceIds: []
        },
        {
          id: 'CRIT-5',
          description: 'Minimum 50 Coasty computer-use steps executed',
          required: true,
          status: 'UNAVAILABLE',
          evidenceIds: []
        }
      ],
      requiredEvidenceTypes: ['SCREENSHOT', 'RECEIPT', 'DOCUMENT'],
      allowedResolutionActions: ['APPLY_PAYMENT', 'RECONCILE_LEDGER'],
      approvalRequirements: {
        amountThreshold: threshold,
        requiredRole: 'Finance Operations Manager'
      }
    };

    return {
      objective: contract.objective,
      caseContext: {
        caseId: exceptionCase?.id,
        caseNumber: exceptionCase?.caseNumber || 'EXC-HIGH-9901',
        customerName: exceptionCase?.customerName || 'Globex Corporation',
        accountNumber: exceptionCase?.accountNumber || 'ACC-9901',
        exceptionType: exceptionCase?.exceptionType || 'UNAPPLIED_CASH',
        amount: amount,
        currency: exceptionCase?.currency || 'USD',
        sourceSystem: exceptionCase?.sourceSystem || 'NetSuite ERP',
      },
      allowedApplications: policy.allowedApplications,
      allowedActions: policy.allowedActionTypes,
      forbiddenActions,
      policy,
      stages,
      contract,
      verificationCriteria,
      stoppingConditions,
    };
  }
}

export const planBuilder = new ExecutionPlanBuilder();
