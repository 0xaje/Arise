import { describe, it, expect } from 'vitest';
import { 
  mapCoastyStatusToAriseStatus, 
  mapCoastyActionTypeToArise, 
  mapCoastyEventTypeToArise 
} from '../services/coasty/coasty.mapper.js';
import { buildInvestigationTask } from '../services/coasty/coasty.taskBuilder.js';
import { coastyClient } from '../services/coasty/coasty.client.js';
import { coastyEventSync } from '../services/coasty/coasty.events.js';
import { RunStatus, ActionType, EventType } from '@prisma/client';

describe('Coasty Computer-Use Service Unit Tests', () => {
  it('1. should map Coasty statuses to ARISE domain RunStatuses', () => {
    expect(mapCoastyStatusToAriseStatus('queued')).toBe(RunStatus.QUEUED);
    expect(mapCoastyStatusToAriseStatus('running')).toBe(RunStatus.RUNNING);
    expect(mapCoastyStatusToAriseStatus('awaiting_human')).toBe(RunStatus.APPROVAL_REQUIRED);
    expect(mapCoastyStatusToAriseStatus('succeeded')).toBe(RunStatus.COMPLETED);
    expect(mapCoastyStatusToAriseStatus('failed')).toBe(RunStatus.FAILED);
    expect(mapCoastyStatusToAriseStatus('cancelled')).toBe(RunStatus.CANCELLED);
  });

  it('2. should map Coasty action types to ARISE ActionTypes', () => {
    expect(mapCoastyActionTypeToArise('CLICK')).toBe(ActionType.CLICK);
    expect(mapCoastyActionTypeToArise('TYPE_INPUT')).toBe(ActionType.TYPE);
    expect(mapCoastyActionTypeToArise('NAVIGATE_URL')).toBe(ActionType.NAVIGATE);
    expect(mapCoastyActionTypeToArise('UNKNOWN_ACTION')).toBe(ActionType.OBSERVE);
  });

  it('3. should map Coasty event types to ARISE EventTypes', () => {
    expect(mapCoastyEventTypeToArise('run_created')).toBe(EventType.RUN_CREATED);
    expect(mapCoastyEventTypeToArise('run_started')).toBe(EventType.RUN_STARTED);
    expect(mapCoastyEventTypeToArise('step_completed')).toBe(EventType.STEP_COMPLETED);
    expect(mapCoastyEventTypeToArise('awaiting_human')).toBe(EventType.APPROVAL_REQUIRED);
    expect(mapCoastyEventTypeToArise('run_completed')).toBe(EventType.RUN_COMPLETED);
  });

  it('4. should build safety-bounded investigation task prompts', () => {
    const task = buildInvestigationTask({
      id: 'case-123',
      caseNumber: 'EXC-9901',
      customerName: 'Acme Corp',
      accountNumber: 'ACC-8821',
      exceptionType: 'UNAPPLIED_CASH',
      amount: 14850,
      currency: 'USD',
      sourceSystem: 'Stripe',
      description: 'Payment wire unapplied in ERP',
      suggestedAction: 'Match with invoice #INV-402'
    });

    expect(task).toContain('EXC-9901');
    expect(task).toContain('Acme Corp');
    expect(task).toContain('SAFETY DIRECTIVES:');
    expect(task).toContain('NEVER fabricate invoice numbers');
  });

  it('5. should test connection state honestly', async () => {
    const testResult = await coastyClient.testConnection();
    expect(testResult.message).toBeDefined();
    if (coastyClient.isConfigured()) {
      expect(testResult.success).toBe(true);
      expect(testResult.message).toContain('CONNECTED');
    } else {
      expect(testResult.success).toBe(false);
      expect(testResult.message).toContain('Connection not configured');
    }
  });

  it('6. should generate deterministic event deduplication keys', () => {
    const key1 = coastyEventSync.generateDeduplicationKey('coasty-run-123', {
      id: 'evt-456',
      run_id: 'coasty-run-123',
      event_type: 'step_completed',
      timestamp: '2026-08-06T10:00:00Z'
    });

    expect(key1).toBe('coasty-run-123:evt-456');

    const key2 = coastyEventSync.generateDeduplicationKey('coasty-run-123', {
      run_id: 'coasty-run-123',
      event_type: 'step_completed',
      sequence: 2,
      timestamp: '2026-08-06T10:00:00Z'
    });

    expect(key2).toBe('coasty-run-123:step_completed:2:2026-08-06T10:00:00Z');
  });
});
