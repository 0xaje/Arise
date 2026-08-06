import { ExecutionPolicy, RiskLevel } from './execution.types.js';

export class ExecutionPolicyEvaluator {
  public evaluatePolicy(
    amount: number = 0,
    autoApprovalThreshold: number = 10000,
    actionType?: string
  ): ExecutionPolicy {
    let riskLevel: RiskLevel = 'LOW';
    let approvalRequired = false;

    if (amount > 50000) {
      riskLevel = 'CRITICAL';
      approvalRequired = true;
    } else if (amount > autoApprovalThreshold) {
      riskLevel = 'HIGH';
      approvalRequired = true;
    } else if (amount > 1000) {
      riskLevel = 'MEDIUM';
    }

    if (actionType === 'WRITE_OFF' || actionType === 'DELETE' || actionType === 'REFUND') {
      approvalRequired = true;
      riskLevel = riskLevel === 'LOW' ? 'HIGH' : riskLevel;
    }

    return {
      maxSteps: parseInt(process.env.COASTY_DEFAULT_MAX_STEPS || '25', 10),
      deadlineSeconds: parseInt(process.env.COASTY_DEFAULT_DEADLINE_SECONDS || '600', 10),
      maxRetries: 3,
      approvalRequired,
      approvalThreshold: autoApprovalThreshold,
      allowedApplications: ['Stripe', 'NetSuite ERP', 'Salesforce CRM', 'Bank Portal', 'Chrome Browser'],
      allowedActionTypes: ['OBSERVE', 'NAVIGATE', 'CLICK', 'TYPE', 'SEARCH', 'READ', 'VERIFY', 'SUBMIT'],
      riskLevel,
    };
  }

  public isActionAllowed(policy: ExecutionPolicy, actionType: string, application: string): boolean {
    if (policy.allowedApplications.length > 0 && !policy.allowedApplications.includes(application)) {
      return false;
    }
    if (policy.allowedActionTypes.length > 0 && !policy.allowedActionTypes.includes(actionType)) {
      return false;
    }
    return true;
  }
}

export const policyEvaluator = new ExecutionPolicyEvaluator();
