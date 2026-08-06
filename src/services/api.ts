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
    const res = await request<any>(`/exceptions${query ? `?${query}` : ''}`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
    return [];
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
    const res = await request<any>('/workflows');
    return Array.isArray(res) ? res : [];
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
    const res = await request<any>('/runs');
    return Array.isArray(res) ? res : [];
  },

  getRunById: async (id: string): Promise<AgentRun> => {
    return request<AgentRun>(`/runs/${id}`);
  },

  // Approvals API
  getApprovals: async (): Promise<ApprovalRequest[]> => {
    const res = await request<any>('/approvals');
    return Array.isArray(res) ? res : [];
  },

  submitApprovalDecision: async (id: string, decision: 'Approved' | 'Rejected', comment?: string): Promise<ApprovalRequest> => {
    return request<ApprovalRequest>(`/approvals/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, comment }),
    });
  },

  // Connections API
  getConnections: async (): Promise<ConnectionSystem[]> => {
    const res = await request<any>('/connections');
    return Array.isArray(res) ? res : [];
  },

  updateConnection: async (id: string, connectionData: Partial<ConnectionSystem>): Promise<ConnectionSystem> => {
    return request<ConnectionSystem>(`/connections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(connectionData),
    });
  },

  testConnection: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/connections/${id}/test`, {
      method: 'POST',
    });
  },

  // Evidence API
  getEvidence: async (): Promise<EvidenceItem[]> => {
    const res = await request<any>('/evidence');
    return Array.isArray(res) ? res : [];
  },

  getEvidenceById: async (id: string): Promise<EvidenceItem> => {
    return request<EvidenceItem>(`/evidence/${id}`);
  },

  // Audit Logs API
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await request<any>('/audit');
    return Array.isArray(res) ? res : [];
  },

  // Intelligence Reports API
  getReportsSummary: async (): Promise<any> => {
    return request<any>('/reports/summary');
  },

  // Live Activity Events API
  getLiveEvents: async (): Promise<LiveActivityEvent[]> => {
    const res = await request<any>('/events/live');
    return Array.isArray(res) ? res : [];
  },

  // Coasty Web Agent API
  sendCoastyPrompt: async (prompt: string): Promise<{ response: string; logs: string[]; success: boolean }> => {
    return request<{ response: string; logs: string[]; success: boolean }>('/coasty/prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },
};
