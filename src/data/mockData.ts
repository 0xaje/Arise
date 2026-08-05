import { ExceptionCase, WorkflowItem, AgentRun, ApprovalRequest, ConnectionSystem, AuditLog, EvidenceItem, LiveActivityEvent } from '../types/arise';

export const INITIAL_EXCEPTIONS: ExceptionCase[] = [
  {
    id: 'exp-1',
    caseNumber: 'EXC-8092',
    customerName: 'Acme Global Enterprises',
    accountNumber: 'ACC-9921',
    exceptionType: 'Unapplied Cash',
    amount: 14850.00,
    currency: 'USD',
    status: 'Pending',
    riskScore: 'High',
    sourceSystem: 'Stripe',
    createdAt: '2026-08-05 22:10:04',
    updatedAt: '2026-08-05 22:15:30',
    assignedAgent: 'Coasty-Bot-01',
    description: 'Wire transfer received without remittance invoice matching ID.',
    suggestedAction: 'Match with open NetSuite invoice INV-2024-8891 based on customer tax ID.',
    confidence: 94.8
  },
  {
    id: 'exp-2',
    caseNumber: 'EXC-8093',
    customerName: 'Nexus Digital Tech',
    accountNumber: 'ACC-4412',
    exceptionType: 'Discrepancy',
    amount: 3200.50,
    currency: 'USD',
    status: 'Investigating',
    riskScore: 'Medium',
    sourceSystem: 'NetSuite',
    createdAt: '2026-08-05 21:45:12',
    updatedAt: '2026-08-05 22:01:00',
    assignedAgent: 'Coasty-Bot-02',
    description: 'Invoice amount $3,200.50 vs payment received $3,150.00 ($50 bank fee difference).',
    suggestedAction: 'Apply auto-writeoff for underpaid fee within configured $100 policy limit.',
    confidence: 98.2
  },
  {
    id: 'exp-3',
    caseNumber: 'EXC-8094',
    customerName: 'Vanguard Logistics',
    accountNumber: 'ACC-1108',
    exceptionType: 'Chargeback',
    amount: 45000.00,
    currency: 'USD',
    status: 'Escalated',
    riskScore: 'Critical',
    sourceSystem: 'Stripe',
    createdAt: '2026-08-05 20:30:00',
    updatedAt: '2026-08-05 21:12:45',
    assignedAgent: 'Human Approval Required',
    description: 'Disputed transaction for SaaS annual tier subscription.',
    suggestedAction: 'Escalate to VP of Finance. Gather proof of delivery and signed SLA contract.',
    confidence: 62.1
  },
  {
    id: 'exp-4',
    caseNumber: 'EXC-8095',
    customerName: 'BioHealth Pharma Corp',
    accountNumber: 'ACC-7731',
    exceptionType: 'Overpayment',
    amount: 820.00,
    currency: 'USD',
    status: 'Resolved',
    riskScore: 'Low',
    sourceSystem: 'Bank Transfer',
    createdAt: '2026-08-05 19:15:20',
    updatedAt: '2026-08-05 19:22:10',
    assignedAgent: 'Coasty-Bot-01',
    description: 'Customer sent double payment for invoice INV-1002.',
    suggestedAction: 'Issue unapplied credit memo on NetSuite account ledger.',
    confidence: 99.4
  },
  {
    id: 'exp-5',
    caseNumber: 'EXC-8096',
    customerName: 'Starlight Retail Networks',
    accountNumber: 'ACC-3044',
    exceptionType: 'Tax Variance',
    amount: 1240.75,
    currency: 'USD',
    status: 'Pending',
    riskScore: 'Medium',
    sourceSystem: 'Salesforce',
    createdAt: '2026-08-05 18:40:11',
    updatedAt: '2026-08-05 18:40:11',
    assignedAgent: 'Coasty-Bot-03',
    description: 'State tax mismatch between Avalara calculation and ERP invoice.',
    suggestedAction: 'Recalculate tax exemption certificate and update line item 3.',
    confidence: 89.1
  }
];

export const INITIAL_WORKFLOWS: WorkflowItem[] = [
  {
    id: 'wf-1',
    name: 'Unapplied Cash Settlement',
    category: 'Accounts Receivable',
    triggerEvent: 'Incoming Bank Wire / ACH',
    status: 'Active',
    autoApprovalThreshold: 25000,
    totalResolved: 1420,
    successRate: 98.4,
    lastRun: '2 mins ago',
    description: 'Automatically cross-checks customer bank remittances against open NetSuite ERP invoices.'
  },
  {
    id: 'wf-2',
    name: 'Minor Short-Pay Auto-Writeoff',
    category: 'Revenue Protection',
    triggerEvent: 'Payment Remittance Variance',
    status: 'Active',
    autoApprovalThreshold: 100,
    totalResolved: 890,
    successRate: 99.8,
    lastRun: '14 mins ago',
    description: 'Resolves minor fee differences (< $100) by creating general ledger fee write-off entries.'
  },
  {
    id: 'wf-3',
    name: 'Stripe Chargeback Defense',
    category: 'Dispute Management',
    triggerEvent: 'Stripe dispute.created webhook',
    status: 'Active',
    autoApprovalThreshold: 5000,
    totalResolved: 215,
    successRate: 84.2,
    lastRun: '1 hour ago',
    description: 'Compiles evidence packets (signed agreement, login audit, IP logs) and submits dispute response.'
  },
  {
    id: 'wf-4',
    name: 'Salesforce Contract Reconciliation',
    category: 'Billing Audit',
    triggerEvent: 'Opportunity Closed Won',
    status: 'Paused',
    autoApprovalThreshold: 10000,
    totalResolved: 450,
    successRate: 95.1,
    lastRun: '1 day ago',
    description: 'Validates discount codes and custom payment terms between Salesforce CRM and NetSuite.'
  }
];

export const INITIAL_RUNS: AgentRun[] = [
  {
    id: 'run-101',
    runId: 'RUN-99012',
    workflowName: 'Unapplied Cash Settlement',
    status: 'Completed',
    startedAt: '2026-08-05 22:15:00',
    durationMs: 1420,
    targetCase: 'EXC-8095',
    stepsCount: 5,
    evidenceId: 'EVD-901',
    logSummary: 'Matched Wire #9921 with Invoice #INV-2024-8891. Updated NetSuite status to Paid.'
  },
  {
    id: 'run-102',
    runId: 'RUN-99013',
    workflowName: 'Minor Short-Pay Auto-Writeoff',
    status: 'Completed',
    startedAt: '2026-08-05 22:00:30',
    durationMs: 850,
    targetCase: 'EXC-8093',
    stepsCount: 4,
    evidenceId: 'EVD-902',
    logSummary: 'Applied $50 bank charge writeoff to account ACC-4412.'
  },
  {
    id: 'run-103',
    runId: 'RUN-99014',
    workflowName: 'Stripe Chargeback Defense',
    status: 'Escalated',
    startedAt: '2026-08-05 20:30:15',
    durationMs: 3100,
    targetCase: 'EXC-8094',
    stepsCount: 6,
    logSummary: 'Amount $45,000 exceeds auto-approval threshold of $5,000. Escalated to Finance Director.'
  }
];

export const INITIAL_APPROVALS: ApprovalRequest[] = [
  {
    id: 'app-1',
    approvalId: 'APR-701',
    caseNumber: 'EXC-8094',
    type: 'High-Value Chargeback Challenge',
    customerName: 'Vanguard Logistics',
    amount: 45000.00,
    reasonForEscalation: 'Dispute amount exceeds automated resolution limit ($5,000).',
    requiredRole: 'VP of Finance',
    createdAt: '2026-08-05 20:30:00',
    status: 'Pending',
    agentRecommendation: 'Approve dispute challenge packet. Contract signed on 2026-01-15 with 100% SLA compliance.'
  },
  {
    id: 'app-2',
    approvalId: 'APR-702',
    caseNumber: 'EXC-8089',
    type: 'Manual Tax Credit Adjustment',
    customerName: 'Global Cloud Systems',
    amount: 18500.00,
    reasonForEscalation: 'Tax exemption certificate pending manual state validation.',
    requiredRole: 'Tax Compliance Lead',
    createdAt: '2026-08-05 16:20:00',
    status: 'Pending',
    agentRecommendation: 'Approve $18,500 tax adjustment after verifying Avalara exemption ID #AV-99120.'
  }
];

export const INITIAL_CONNECTIONS: ConnectionSystem[] = [
  {
    id: 'conn-1',
    name: 'Stripe Billing & Payments',
    type: 'Payment Gateway',
    status: 'Connected',
    lastSync: '1 min ago',
    endpointUrl: 'https://api.stripe.com/v1',
    healthScore: 99.9,
    iconName: 'CreditCard'
  },
  {
    id: 'conn-2',
    name: 'Oracle NetSuite ERP',
    type: 'ERP',
    status: 'Connected',
    lastSync: '3 mins ago',
    endpointUrl: 'https://1234567.restlets.api.netsuite.com',
    healthScore: 98.7,
    iconName: 'Database'
  },
  {
    id: 'conn-3',
    name: 'Salesforce CRM',
    type: 'CRM',
    status: 'Connected',
    lastSync: '12 mins ago',
    endpointUrl: 'https://acme.my.salesforce.com/services/data/v58.0',
    healthScore: 100.0,
    iconName: 'Users'
  },
  {
    id: 'conn-4',
    name: 'Coasty Browser Agent Hub',
    type: 'Browser Agent',
    status: 'Disconnected',
    lastSync: 'Never',
    endpointUrl: 'https://agent-ws.coasty.ai/v1/stream',
    healthScore: 0.0,
    iconName: 'Bot'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-08-05 22:15:30',
    actor: 'ARISE Engine (v2.4)',
    action: 'SETTLE_UNAPPLIED_CASH',
    targetResource: 'NetSuite Invoice #INV-2024-8891',
    details: 'Matched $14,850 wire transfer from Acme Global Enterprises with confidence score 94.8%.',
    verificationHash: '0x8f1a...4b92'
  },
  {
    id: 'aud-2',
    timestamp: '2026-08-05 22:01:00',
    actor: 'Coasty-Bot-02',
    action: 'APPLY_FEE_WRITEOFF',
    targetResource: 'Account #ACC-4412',
    details: 'Applied underpayment fee tolerance writeoff of $50.00.',
    verificationHash: '0x3c2e...7d11'
  },
  {
    id: 'aud-3',
    timestamp: '2026-08-05 20:30:15',
    actor: 'ARISE Policy Evaluator',
    action: 'ESCALATE_TO_HUMAN',
    targetResource: 'Dispute Case #EXC-8094',
    details: 'Triggered escalation: Amount $45,000 exceeds $5,000 threshold.',
    verificationHash: '0x99a1...11ef'
  }
];

export const INITIAL_EVIDENCE: EvidenceItem[] = [
  {
    id: 'evd-1',
    evidenceCode: 'EVD-901',
    caseNumber: 'EXC-8092',
    type: 'DOM Screenshot',
    capturedAt: '2026-08-05 22:15:10',
    verifiedBy: 'Coasty Web Vision Parser',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    fileSize: '1.4 MB'
  },
  {
    id: 'evd-2',
    evidenceCode: 'EVD-902',
    caseNumber: 'EXC-8093',
    type: 'PDF Receipt',
    capturedAt: '2026-08-05 22:00:50',
    verifiedBy: 'Stripe Webhook Signer',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop',
    fileSize: '420 KB'
  }
];

export const INITIAL_LIVE_EVENTS: LiveActivityEvent[] = [
  {
    id: 'evt-1',
    timestamp: '22:15:30',
    type: 'success',
    message: 'Coasty verified bank remittance remittance matching 100% against NetSuite ERP.',
    source: 'Coasty Worker #1'
  },
  {
    id: 'evt-2',
    timestamp: '22:01:00',
    type: 'info',
    message: 'Applied $50 underpayment tolerance writeoff for Nexus Digital Tech.',
    source: 'ARISE Engine'
  },
  {
    id: 'evt-3',
    timestamp: '20:30:15',
    type: 'warning',
    message: 'Escalation triggered for Case EXC-8094 ($45,000 Dispute Challenge).',
    source: 'Policy Evaluator'
  }
];
