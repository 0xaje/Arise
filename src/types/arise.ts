export type RouteId = 
  | '/' 
  | '/exceptions' 
  | '/workflows' 
  | '/runs' 
  | '/approvals' 
  | '/reports' 
  | '/audit' 
  | '/evidence' 
  | '/connections' 
  | '/coasty' 
  | '/settings';

export interface ExceptionCase {
  id: string;
  caseNumber: string;
  customerName: string;
  accountNumber: string;
  exceptionType: 'Unapplied Cash' | 'Discrepancy' | 'Chargeback' | 'Overpayment' | 'Tax Variance';
  amount: number;
  currency: string;
  status: 'Pending' | 'Investigating' | 'Resolved' | 'Escalated';
  riskScore: 'Low' | 'Medium' | 'High' | 'Critical';
  sourceSystem: 'Stripe' | 'NetSuite' | 'Salesforce' | 'Bank Transfer';
  createdAt: string;
  updatedAt: string;
  assignedAgent: string;
  description: string;
  suggestedAction: string;
  confidence: number;
}

export interface WorkflowItem {
  id: string;
  name: string;
  category: string;
  triggerEvent: string;
  status: 'Active' | 'Paused' | 'Draft';
  autoApprovalThreshold: number;
  totalResolved: number;
  successRate: number;
  lastRun: string;
  description: string;
}

export interface AgentRun {
  id: string;
  runId: string;
  workflowName: string;
  status: 'Completed' | 'In Progress' | 'Escalated' | 'Failed';
  startedAt: string;
  durationMs: number;
  targetCase: string;
  stepsCount: number;
  evidenceId?: string;
  logSummary: string;
}

export interface ApprovalRequest {
  id: string;
  approvalId: string;
  caseNumber: string;
  type: string;
  customerName: string;
  amount: number;
  reasonForEscalation: string;
  requiredRole: string;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  agentRecommendation: string;
}

export interface ConnectionSystem {
  id: string;
  name: string;
  type: 'Payment Gateway' | 'ERP' | 'CRM' | 'Browser Agent';
  status: 'Connected' | 'Disconnected' | 'Error' | 'Configuring';
  lastSync: string;
  endpointUrl: string;
  healthScore: number;
  iconName: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetResource: string;
  details: string;
  verificationHash: string;
}

export interface EvidenceItem {
  id: string;
  evidenceCode: string;
  caseNumber: string;
  type: 'DOM Screenshot' | 'PDF Receipt' | 'API Payload' | 'DB Snapshot';
  capturedAt: string;
  verifiedBy: string;
  url: string;
  fileSize: string;
}

export interface LiveActivityEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  source: string;
}
