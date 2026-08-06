export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BusinessOutcomeStatus = 'PENDING' | 'RESOLVED' | 'PARTIAL' | 'ESCALATED' | 'FAILED' | 'UNAVAILABLE';

export type VerificationStatus = 'VERIFIED' | 'FAILED' | 'PARTIAL' | 'UNAVAILABLE';

export interface ExecutionPolicy {
  maxSteps: number;
  deadlineSeconds: number;
  maxRetries: number;
  approvalRequired: boolean;
  approvalThreshold: number;
  allowedApplications: string[];
  allowedActionTypes: string[];
  riskLevel: RiskLevel;
}

export interface ExecutionStageDef {
  sequence: number;
  name: string;
  objective: string;
}

export interface ExpectedBusinessState {
  recordReference: string;
  fields: Record<string, any>;
}

export interface ObservedBusinessState {
  source: string;
  observedAt: Date;
  application: string;
  recordReference: string;
  fields: Record<string, any>;
  evidenceIds: string[];
  observationMethod: 'REAL_COMPUTER_USE' | 'DIRECT_API' | 'AUDIT_LOG';
}

export type StateComparisonResult = 'MATCH' | 'MISMATCH' | 'PARTIAL' | 'UNAVAILABLE';

export interface VerificationCriterion {
  id: string;
  description: string;
  required: boolean;
  status: VerificationStatus;
  evidenceIds: string[];
  expected?: any;
  observed?: any;
  reason?: string;
}

export interface BusinessResolutionContract {
  objective: string;
  expectedState?: ExpectedBusinessState;
  verificationCriteria: VerificationCriterion[];
  requiredEvidenceTypes: string[];
  allowedResolutionActions: string[];
  approvalRequirements: {
    amountThreshold: number;
    requiredRole: string;
  };
}

export interface ExecutionPlan {
  objective: string;
  caseContext: {
    caseId?: string;
    caseNumber?: string;
    customerName?: string;
    accountNumber?: string;
    exceptionType?: string;
    amount?: number;
    currency?: string;
    sourceSystem?: string;
  };
  allowedApplications: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  policy: ExecutionPolicy;
  stages: ExecutionStageDef[];
  contract: BusinessResolutionContract;
  verificationCriteria: string[];
  stoppingConditions: string[];
}

export interface VerificationReport {
  status: VerificationStatus;
  businessOutcome: BusinessOutcomeStatus;
  criteria: VerificationCriterion[];
  expectedState?: ExpectedBusinessState;
  observedState?: ObservedBusinessState;
  comparisonResult: StateComparisonResult;
  evidence: string[];
  unverifiedCriteria: string[];
  message: string;
  verifiedAt: Date;
}
