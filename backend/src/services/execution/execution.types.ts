export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BusinessOutcomeStatus = 'PENDING' | 'RESOLVED' | 'PARTIAL' | 'ESCALATED' | 'FAILED';

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
  verificationCriteria: string[];
  stoppingConditions: string[];
}

export interface VerificationResult {
  status: VerificationStatus;
  verifiedAt: Date;
  criteria: string[];
  evidenceIds: string[];
  actualState: Record<string, any>;
  expectedState: Record<string, any>;
  message: string;
}
