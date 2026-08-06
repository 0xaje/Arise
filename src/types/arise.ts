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
  exceptionType: string;
  amount: number;
  currency: string;
  status: string;
  riskScore: string;
  sourceSystem: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  suggestedAction: string;
  confidence: number;
  assignedWorkflowId?: string;
  assignedWorkflow?: any;
}

export interface WorkflowItem {
  id: string;
  name: string;
  category: string;
  triggerEvent: string;
  status: string;
  autoApprovalThreshold: number;
  maxSteps: number;
  timeoutSeconds: number;
  retryLimit: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  _count?: {
    agentRuns: number;
  };
}

export interface AgentRun {
  id: string;
  runId: string;
  externalRunId?: string;
  workflowId: string;
  workflow?: WorkflowItem;
  exceptionCaseId?: string;
  exceptionCase?: ExceptionCase;
  status: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  currentStep: number;
  totalSteps: number;
  outcome?: string;
  errorCode?: string;
  errorMessage?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  agentSteps?: any[];
  evidenceItems?: any[];
  approvalRequests?: any[];
  liveEvents?: any[];
}

export interface ApprovalRequest {
  id: string;
  approvalId: string;
  runId: string;
  exceptionCaseId?: string;
  reason: string;
  proposedAction: string;
  requiredRole: string;
  status: string;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionComment?: string;
  run?: AgentRun;
  exceptionCase?: ExceptionCase;
}

export interface ConnectionSystem {
  id: string;
  name: string;
  type: string;
  status: string;
  endpointUrl: string;
  lastVerifiedAt?: string;
  metadataJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  detailsJson?: string;
  previousHash?: string;
  verificationHash: string;
}

export interface EvidenceItem {
  id: string;
  runId: string;
  stepId?: string;
  externalEvidenceId?: string;
  type: string;
  storageUrl: string;
  capturedAt: string;
  sha256: string;
  mimeType: string;
  sizeBytes: number;
  metadataJson?: string;
  createdAt: string;
  run?: AgentRun;
  step?: any;
}

export interface LiveActivityEvent {
  id: string;
  runId?: string;
  type: string;
  message: string;
  payloadJson?: string;
  timestamp: string;
}
