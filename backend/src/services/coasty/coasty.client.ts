import { CoastyRun, CreateCoastyRunPayload } from './coasty.types.js';
import { CoastyError } from './coasty.errors.js';
import { logger } from '../../lib/logger.js';

export class CoastyClient {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor() {
    this.baseUrl = process.env.COASTY_BASE_URL || 'https://coasty.ai/v1';
    this.apiKey = process.env.COASTY_API_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private getHeaders(idempotencyKey?: string): Record<string, string> {
    if (!this.apiKey) {
      throw new CoastyError('NOT_CONFIGURED', 'COASTY_API_KEY environment variable is not configured.', 401, false);
    }
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ARISE-Finance-Engine/2.4',
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return headers;
  }

  // POST /v1/runs (Create Task Run)
  public async createRun(payload: CreateCoastyRunPayload, idempotencyKey?: string): Promise<CoastyRun> {
    const url = `${this.baseUrl}/runs`;
    const headers = this.getHeaders(idempotencyKey);

    logger.info({ machineId: payload.machine_id, idempotencyKey }, 'Dispatching POST /v1/runs to Coasty API');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        logger.error({ status: res.status, errorText }, 'Coasty createRun HTTP error');
        throw new CoastyError(
          'COASTY_API_ERROR',
          `Coasty API returned HTTP ${res.status}: ${errorText || res.statusText}`,
          res.status,
          res.status >= 500
        );
      }

      return res.json() as Promise<CoastyRun>;
    } catch (err: any) {
      if (err instanceof CoastyError) throw err;
      throw new CoastyError('NETWORK_ERROR', `Failed to connect to Coasty API: ${err?.message || 'Network timeout'}`, 503, true);
    }
  }

  // GET /v1/runs/:id
  public async getRun(runId: string): Promise<CoastyRun> {
    const url = `${this.baseUrl}/runs/${runId}`;
    const headers = this.getHeaders();

    try {
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) {
        const errorText = await res.text();
        throw new CoastyError('COASTY_API_ERROR', `Coasty API returned HTTP ${res.status}: ${errorText}`, res.status, res.status >= 500, runId);
      }
      return res.json() as Promise<CoastyRun>;
    } catch (err: any) {
      if (err instanceof CoastyError) throw err;
      throw new CoastyError('NETWORK_ERROR', `Failed to fetch Coasty run '${runId}': ${err?.message}`, 503, true, runId);
    }
  }

  // POST /v1/runs/:id/cancel
  public async cancelRun(runId: string): Promise<CoastyRun> {
    const url = `${this.baseUrl}/runs/${runId}/cancel`;
    const headers = this.getHeaders();

    try {
      const res = await fetch(url, { method: 'POST', headers });
      if (!res.ok) {
        const errorText = await res.text();
        throw new CoastyError('COASTY_API_ERROR', `Failed to cancel Coasty run '${runId}': ${errorText}`, res.status, false, runId);
      }
      return res.json() as Promise<CoastyRun>;
    } catch (err: any) {
      if (err instanceof CoastyError) throw err;
      throw new CoastyError('NETWORK_ERROR', `Failed to cancel Coasty run '${runId}': ${err?.message}`, 503, false, runId);
    }
  }

  // POST /v1/runs/:id/resume
  public async resumeRun(runId: string): Promise<CoastyRun> {
    const url = `${this.baseUrl}/runs/${runId}/resume`;
    const headers = this.getHeaders();

    try {
      const res = await fetch(url, { method: 'POST', headers });
      if (!res.ok) {
        const errorText = await res.text();
        throw new CoastyError('COASTY_API_ERROR', `Failed to resume Coasty run '${runId}': ${errorText}`, res.status, false, runId);
      }
      return res.json() as Promise<CoastyRun>;
    } catch (err: any) {
      if (err instanceof CoastyError) throw err;
      throw new CoastyError('NETWORK_ERROR', `Failed to resume Coasty run '${runId}': ${err?.message}`, 503, false, runId);
    }
  }

  // Connection Test
  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Connection not configured: COASTY_API_KEY environment variable is missing.'
      };
    }

    try {
      const start = Date.now();
      const res = await fetch(`${this.baseUrl}/runs?limit=1`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const latencyMs = Date.now() - start;

      if (res.status === 401 || res.status === 403) {
        return { success: false, message: 'AUTHENTICATION_ERROR: Coasty API key rejected by server.' };
      }

      if (res.ok) {
        return { success: true, message: 'CONNECTED: Coasty API endpoint reachable.', latencyMs };
      }

      return { success: false, message: `UNAVAILABLE: Coasty API returned HTTP ${res.status}` };
    } catch (err: any) {
      return { success: false, message: `UNAVAILABLE: Connection test failed: ${err?.message || 'Network error'}` };
    }
  }
}

export const coastyClient = new CoastyClient();
