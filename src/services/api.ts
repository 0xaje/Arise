import type { 
  ExceptionCase, 
  WorkflowItem, 
  AgentRun, 
  ApprovalRequest, 
  ConnectionSystem, 
  AuditLog, 
  EvidenceItem, 
  LiveActivityEvent 
} from '../types/arise';

const API_BASE_URL = import.meta.env.VITE_ARISE_API_URL || '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json();
}

export const ariseApi = {
  // Backend Health Check
  checkHealth: async (): Promise<{ status: string; version: string }> => {
    return request<{ status: string; version: string }>('/health');
  },

  // Exceptions API
  getExceptions: async (params?: { status?: string; search?: string }): Promise<ExceptionCase[]> => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<ExceptionCase[]>(`/exceptions${query ? `?${query}` : ''}`);
  },

  getExceptionById: async (id: string): Promise<ExceptionCase> => {
    return request<ExceptionCase>(`/exceptions/${id}`);
  },

  resolveException: async (id: string, resolutionDetails?: Record<string, unknown>): Promise<ExceptionCase> => {
    return request<ExceptionCase>(`/exceptions/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolutionDetails || {}),
    });
  },

  // Workflows API
  getWorkflows: async (): Promise<WorkflowItem[]> => {
    return request<WorkflowItem[]>('/workflows');
  },

  createWorkflow: async (workflowData: Partial<WorkflowItem>): Promise<WorkflowItem> => {
    return request<WorkflowItem>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  },

  updateWorkflowStatus: async (id: string, status: 'Active' | 'Paused' | 'Draft'): Promise<WorkflowItem> => {
    return request<WorkflowItem>(`/workflows/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  triggerWorkflowRun: async (workflowId: string, parameters?: Record<string, unknown>): Promise<AgentRun> => {
    return request<AgentRun>(`/workflows/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify(parameters || {}),
    });
  },

  // Runs API
  getRuns: async (): Promise<AgentRun[]> => {
    return request<AgentRun[]>('/runs');
  },

  getRunById: async (id: string): Promise<AgentRun> => {
    return request<AgentRun>(`/runs/${id}`);
  },

  // Approvals API
  getApprovals: async (): Promise<ApprovalRequest[]> => {
    return request<ApprovalRequest[]>('/approvals');
  },

  submitApprovalDecision: async (id: string, decision: 'Approved' | 'Rejected', comment?: string): Promise<ApprovalRequest> => {
    return request<ApprovalRequest>(`/approvals/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, comment }),
    });
  },

  // Connections API
  getConnections: async (): Promise<ConnectionSystem[]> => {
    return request<ConnectionSystem[]>('/connections');
  },

  updateConnection: async (id: string, data: Partial<ConnectionSystem>): Promise<ConnectionSystem> => {
    return request<ConnectionSystem>(`/connections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  testConnection: async (id: string): Promise<{ success: boolean; latencyMs: number; message: string }> => {
    return request<{ success: boolean; latencyMs: number; message: string }>(`/connections/${id}/test`, {
      method: 'POST',
    });
  },

  // Intelligence Reports API
  getReportsSummary: async (): Promise<{
    monthlyRecoveredValue: number;
    mttrSeconds: number;
    fteHoursSaved: number;
    resolutionVelocity: Array<{ category: string; count: number; automationRate: number }>;
  }> => {
    return request('/reports/summary');
  },

  // Audit Logs API
  getAuditLogs: async (): Promise<AuditLog[]> => {
    return request<AuditLog[]>('/audit');
  },

  // Evidence API
  getEvidence: async (): Promise<EvidenceItem[]> => {
    return request<EvidenceItem[]>('/evidence');
  },

  // Live Activity Events API
  getLiveEvents: async (): Promise<LiveActivityEvent[]> => {
    return request<LiveActivityEvent[]>('/events/live');
  },

  // Coasty Browser Agent API
  sendCoastyPrompt: async (prompt: string): Promise<{ response: string; logs: string[]; success: boolean }> => {
    return request<{ response: string; logs: string[]; success: boolean }>('/coasty/prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },
};
