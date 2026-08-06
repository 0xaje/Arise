import crypto from 'node:crypto';
import fs from 'node:fs';
import { prisma } from '../../lib/prisma.js';
import { storageService } from '../storageService.js';
import { 
  VerificationReport, 
  VerificationStatus, 
  BusinessOutcomeStatus, 
  ExpectedBusinessState, 
  ObservedBusinessState, 
  StateComparisonResult,
  VerificationCriterion
} from './execution.types.js';
import { logger } from '../../lib/logger.js';

export class BusinessOutcomeVerifier {
  // 1. Evidence File SHA-256 Hash Integrity Check (Does NOT prove business outcome)
  public async verifyEvidenceIntegrity(evidenceId: string): Promise<{ status: 'VERIFIED' | 'MISMATCH' | 'UNAVAILABLE'; calculatedHash?: string }> {
    const item = await prisma.evidenceItem.findUnique({ where: { id: evidenceId } });
    if (!item) return { status: 'UNAVAILABLE' };

    const fileName = item.storageUrl.split('/files/')[1];
    if (!fileName) return { status: 'UNAVAILABLE' };

    const filePath = storageService.getFilePath(fileName);
    if (!fs.existsSync(filePath)) return { status: 'UNAVAILABLE' };

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      if (calculatedHash === item.sha256) {
        await prisma.evidenceItem.update({
          where: { id: evidenceId },
          data: { verificationStatus: 'VERIFIED' }
        });
        return { status: 'VERIFIED', calculatedHash };
      } else {
        await prisma.evidenceItem.update({
          where: { id: evidenceId },
          data: { verificationStatus: 'MISMATCH' }
        });
        return { status: 'MISMATCH', calculatedHash };
      }
    } catch (err: any) {
      logger.error({ evidenceId, err }, 'Failed to verify evidence file hash');
      return { status: 'UNAVAILABLE' };
    }
  }

  // 2. Deterministic State Comparison Layer (Code-level equality check)
  public compareBusinessState(
    expected?: ExpectedBusinessState, 
    observed?: ObservedBusinessState
  ): StateComparisonResult {
    if (!expected || !observed) {
      return 'UNAVAILABLE';
    }

    if (expected.recordReference !== observed.recordReference) {
      return 'MISMATCH';
    }

    const expectedKeys = Object.keys(expected.fields);
    if (expectedKeys.length === 0) {
      return 'UNAVAILABLE';
    }

    let matchCount = 0;
    for (const key of expectedKeys) {
      if (observed.fields[key] === expected.fields[key]) {
        matchCount++;
      }
    }

    if (matchCount === expectedKeys.length) {
      return 'MATCH';
    } else if (matchCount > 0) {
      return 'PARTIAL';
    }

    return 'MISMATCH';
  }

  // 3. Independent Business Outcome Verifier (Strict - Never assumes completion = resolved)
  public async verifyRun(
    runId: string, 
    observedState?: ObservedBusinessState
  ): Promise<VerificationReport> {
    const run = await prisma.agentRun.findUnique({
      where: { id: runId },
      include: {
        exceptionCase: true,
        workflow: true,
        evidenceItems: true,
        approvalRequests: true,
        agentSteps: true,
      }
    });

    if (!run) {
      return {
        status: 'FAILED',
        businessOutcome: 'FAILED',
        criteria: [],
        comparisonResult: 'UNAVAILABLE',
        evidence: [],
        unverifiedCriteria: ['AgentRun not found'],
        message: 'AgentRun record not found',
        verifiedAt: new Date(),
      };
    }

    // Parse ExecutionPlan contract if present
    let expectedState: ExpectedBusinessState | undefined = undefined;

    if (run.executionPlanJson) {
      try {
        const parsedPlan = JSON.parse(run.executionPlanJson);
        expectedState = parsedPlan.contract?.expectedState;
      } catch (e) {}
    }

    // Check Human Governance Approvals
    const pendingApproval = run.approvalRequests.find(a => a.status === 'PENDING');
    const rejectedApproval = run.approvalRequests.find(a => a.status === 'REJECTED');

    if (pendingApproval || run.status === 'APPROVAL_REQUIRED') {
      return {
        status: 'UNAVAILABLE',
        businessOutcome: 'ESCALATED',
        criteria: [
          {
            id: 'CRIT-GOV',
            description: 'Human governance authorization required',
            required: true,
            status: 'UNAVAILABLE',
            evidenceIds: [],
            reason: 'Run paused awaiting human sign-off'
          }
        ],
        comparisonResult: 'UNAVAILABLE',
        evidence: run.evidenceItems.map(e => e.id),
        unverifiedCriteria: ['Human governance authorization required'],
        message: 'Transaction exceeds automated risk limit; business outcome ESCALATED.',
        verifiedAt: new Date(),
      };
    }

    if (rejectedApproval) {
      return {
        status: 'FAILED',
        businessOutcome: 'ESCALATED',
        criteria: [
          {
            id: 'CRIT-REJ',
            description: 'Human operator rejected proposed resolution',
            required: true,
            status: 'FAILED',
            evidenceIds: [],
            reason: 'Operator rejected resolution'
          }
        ],
        comparisonResult: 'MISMATCH',
        evidence: run.evidenceItems.map(e => e.id),
        unverifiedCriteria: ['Human operator authorization'],
        message: 'Resolution rejected by human operator.',
        verifiedAt: new Date(),
      };
    }

    // Check Execution Status Failure
    if (run.status === 'FAILED' || run.status === 'CANCELLED') {
      return {
        status: 'FAILED',
        businessOutcome: 'FAILED',
        criteria: [
          {
            id: 'CRIT-EXEC',
            description: 'Computer-use execution runner completed successfully',
            required: true,
            status: 'FAILED',
            evidenceIds: [],
            reason: run.errorMessage || 'Execution failed'
          }
        ],
        comparisonResult: 'FAILED' as any,
        evidence: run.evidenceItems.map(e => e.id),
        unverifiedCriteria: ['Computer-use execution runner completion'],
        message: `Computer-use execution failed: ${run.errorMessage || 'Execution interrupted'}`,
        verifiedAt: new Date(),
      };
    }

    // Competition Guard: Check if minimum 50 steps requirement is satisfied
    const isCompetitionWorkflow = run.workflow?.category?.includes('Competition') || run.totalSteps >= 50;
    const stepCountValid = !isCompetitionWorkflow || run.currentStep >= 50;

    // CRITICAL FIX: If no actual business state was independently observed:
    // Do NOT claim RESOLVED or VERIFIED merely because Coasty execution finished!
    if (!observedState) {
      return {
        status: 'UNAVAILABLE',
        businessOutcome: 'UNAVAILABLE',
        criteria: [
          {
            id: 'CRIT-OBS',
            description: 'Independent observation of business ledger state',
            required: true,
            status: 'UNAVAILABLE',
            evidenceIds: [],
            reason: 'No actual business state has been independently observed or submitted yet.'
          }
        ],
        expectedState,
        observedState: undefined,
        comparisonResult: 'UNAVAILABLE',
        evidence: run.evidenceItems.map(e => e.id),
        unverifiedCriteria: [
          'Independent observation of business ledger state',
          ...(!stepCountValid ? [`Minimum competition requirement not satisfied. Actual Coasty steps: ${run.currentStep} (Required: 50)`] : [])
        ],
        message: 'Coasty execution finished, but business outcome is UNAVAILABLE because actual business state has not been independently observed or verified.',
        verifiedAt: new Date(),
      };
    }

    // Perform Deterministic Comparison when observedState exists
    const comparisonResult = this.compareBusinessState(expectedState, observedState);

    // Verify Evidence Integrity
    const verifiedEvidenceIds: string[] = [];
    for (const ev of run.evidenceItems) {
      const integrity = await this.verifyEvidenceIntegrity(ev.id);
      if (integrity.status === 'VERIFIED') {
        verifiedEvidenceIds.push(ev.id);
      }
    }

    const hasEvidence = run.evidenceItems.length > 0;

    // Build Verification Criteria Checklist
    const criteria: VerificationCriterion[] = [
      {
        id: 'CRIT-1',
        description: 'Computer-use execution completed successfully',
        required: true,
        status: run.status === 'COMPLETED' ? 'VERIFIED' : 'FAILED',
        evidenceIds: [],
      },
      {
        id: 'CRIT-2',
        description: 'Target record reference match',
        required: true,
        status: (expectedState && observedState.recordReference === expectedState.recordReference) ? 'VERIFIED' : 'FAILED',
        evidenceIds: observedState.evidenceIds || [],
        expected: expectedState?.recordReference,
        observed: observedState.recordReference,
      },
      {
        id: 'CRIT-3',
        description: 'Observed business state matches expected state',
        required: true,
        status: comparisonResult === 'MATCH' ? 'VERIFIED' : comparisonResult === 'PARTIAL' ? 'PARTIAL' : 'FAILED',
        evidenceIds: observedState.evidenceIds || [],
        expected: expectedState?.fields,
        observed: observedState.fields,
      },
      {
        id: 'CRIT-4',
        description: 'Cryptographic SHA-256 evidence integrity validated',
        required: hasEvidence,
        status: hasEvidence ? (verifiedEvidenceIds.length > 0 ? 'VERIFIED' : 'UNAVAILABLE') : 'VERIFIED',
        evidenceIds: verifiedEvidenceIds,
      },
      {
        id: 'CRIT-5',
        description: 'Minimum 50 Coasty computer-use steps executed',
        required: isCompetitionWorkflow,
        status: stepCountValid ? 'VERIFIED' : 'FAILED',
        evidenceIds: [],
        expected: 50,
        observed: run.currentStep,
      }
    ];

    const allMandatoryPassed = criteria.every(c => !c.required || c.status === 'VERIFIED');

    if (allMandatoryPassed && comparisonResult === 'MATCH') {
      return {
        status: 'VERIFIED',
        businessOutcome: 'RESOLVED',
        criteria,
        expectedState,
        observedState,
        comparisonResult: 'MATCH',
        evidence: verifiedEvidenceIds,
        unverifiedCriteria: [],
        message: 'Business outcome successfully verified against observed business state and cryptographic evidence.',
        verifiedAt: new Date(),
      };
    } else {
      return {
        status: comparisonResult === 'PARTIAL' ? 'PARTIAL' : 'FAILED',
        businessOutcome: 'FAILED',
        criteria,
        expectedState,
        observedState,
        comparisonResult,
        evidence: verifiedEvidenceIds,
        unverifiedCriteria: criteria.filter(c => c.status !== 'VERIFIED').map(c => c.description),
        message: `Business outcome verification failed. Comparison result: ${comparisonResult}.`,
        verifiedAt: new Date(),
      };
    }
  }
}

export const outcomeVerifier = new BusinessOutcomeVerifier();
