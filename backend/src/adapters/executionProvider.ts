import { AgentRun } from '@prisma/client';

export interface ExecutionRunParams {
  runId: string;
  workflowId: string;
  exceptionCaseId?: string;
  parameters?: Record<string, any>;
}

export interface ExecutionStatusResult {
  runId: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  message?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

export interface ExecutionProvider {
  name: string;
  testConnection(): Promise<ConnectionTestResult>;
  startRun(params: ExecutionRunParams): Promise<void>;
  cancelRun(runId: string): Promise<void>;
  pauseRun(runId: string): Promise<void>;
  resumeRun(runId: string): Promise<void>;
  getRunStatus(runId: string): Promise<ExecutionStatusResult>;
}

export class CoastyExecutionProvider implements ExecutionProvider {
  public name = 'Coasty Web Browser Agent';
  private baseUrl: string | undefined;
  private apiKey: string | undefined;

  constructor() {
    this.baseUrl = process.env.COASTY_BASE_URL;
    this.apiKey = process.env.COASTY_API_KEY;
  }

  public async testConnection(): Promise<ConnectionTestResult> {
    if (!this.baseUrl || !this.apiKey) {
      return {
        success: false,
        message: 'Connection not configured: COASTY_BASE_URL or COASTY_API_KEY environment variable missing.'
      };
    }

    try {
      const start = Date.now();
      const res = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });

      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { success: true, message: 'Successfully connected to Coasty API cluster.', latencyMs };
      } else {
        return { success: false, message: `Coasty endpoint returned HTTP ${res.status}: ${res.statusText}` };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to reach Coasty endpoint: ${err?.message || 'Network unreachable'}`
      };
    }
  }

  public async startRun(params: ExecutionRunParams): Promise<void> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Coasty execution engine connection not configured.');
    }
    // Real integration handshake dispatch
    await fetch(`${this.baseUrl}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
  }

  public async cancelRun(runId: string): Promise<void> {
    if (!this.baseUrl || !this.apiKey) return;
    await fetch(`${this.baseUrl}/runs/${runId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }

  public async pauseRun(runId: string): Promise<void> {
    if (!this.baseUrl || !this.apiKey) return;
    await fetch(`${this.baseUrl}/runs/${runId}/pause`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }

  public async resumeRun(runId: string): Promise<void> {
    if (!this.baseUrl || !this.apiKey) return;
    await fetch(`${this.baseUrl}/runs/${runId}/resume`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }

  public async getRunStatus(runId: string): Promise<ExecutionStatusResult> {
    if (!this.baseUrl || !this.apiKey) {
      return {
        runId,
        status: 'QUEUED',
        currentStep: 0,
        totalSteps: 0,
        message: 'Coasty Execution Engine not configured.'
      };
    }

    const res = await fetch(`${this.baseUrl}/runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return res.json() as Promise<ExecutionStatusResult>;
  }
}

export const coastyProvider = new CoastyExecutionProvider();
