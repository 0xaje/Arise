import React, { useState } from 'react';
import type { ExceptionCase, WorkflowItem, ConnectionSystem } from '../../types/arise';
import { ariseApi } from '../../services/api';
import { X, Play, CheckCircle2, Database, Bot, Zap, RefreshCw, AlertCircle } from 'lucide-react';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (workflow: WorkflowItem) => void;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Accounts Receivable');
  const [triggerEvent, setTriggerEvent] = useState('Incoming Bank Wire / ACH');
  const [threshold, setThreshold] = useState('10000');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const created = await ariseApi.createWorkflow({
        name,
        category,
        triggerEvent,
        autoApprovalThreshold: parseFloat(threshold) || 10000,
        description,
        status: 'Active',
      });
      onCreate(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to communicate with backend API server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <Zap className="size-4" />
            </div>
            <h2 className="text-lg font-semibold text-white">Create New Workflow</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300">Workflow Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Unapplied Cash Settlement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Accounts Receivable">Accounts Receivable</option>
                <option value="Revenue Protection">Revenue Protection</option>
                <option value="Dispute Management">Dispute Management</option>
                <option value="Billing Audit">Billing Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300">Auto-Approval Threshold ($)</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300">Trigger Event</label>
            <input
              type="text"
              placeholder="e.g. Stripe dispute.created webhook"
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300">Description & Rules</label>
            <textarea
              rows={3}
              placeholder="Describe resolution policy and verification criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading && <RefreshCw className="size-3.5 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Create Workflow'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RunWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflows: WorkflowItem[];
  onTriggerRun: (workflowId: string) => void;
}

export const RunWorkflowModal: React.FC<RunWorkflowModalProps> = ({ isOpen, onClose, workflows, onTriggerRun }) => {
  const [selectedWf, setSelectedWf] = useState(workflows[0]?.id || '');
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setExecutionLogs(['Dispatching workflow execution request to API endpoint...']);

    try {
      const runResult = await ariseApi.triggerWorkflowRun(selectedWf);
      setExecutionLogs([
        `[${new Date().toLocaleTimeString()}] Run ${runResult.runId} completed.`,
        `Status: ${runResult.status}`,
        `Summary: ${runResult.logSummary}`
      ]);
      onTriggerRun(selectedWf);
    } catch (err: any) {
      setError(err?.message || 'API Execution call failed');
      setExecutionLogs(prev => [...prev, `[ERROR] Execution failed: ${err?.message || 'API connection error'}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Play className="size-4 fill-current" />
            </div>
            <h2 className="text-lg font-semibold text-white">Execute Workflow</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300">Select Target Workflow</label>
            <select
              value={selectedWf}
              onChange={(e) => setSelectedWf(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {workflows.length === 0 ? (
                <option value="">No active workflows configured</option>
              ) : (
                workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>{wf.name} ({wf.category})</option>
                ))
              )}
            </select>
          </div>

          {executionLogs.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-emerald-400 space-y-1 max-h-40 overflow-y-auto">
              {executionLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Close
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning || workflows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {isRunning ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />}
              <span>{isRunning ? 'Executing...' : 'Trigger Run'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  connections: ConnectionSystem[];
  onToggleConnect: (id: string) => void;
}

export const ConnectionDialog: React.FC<ConnectionDialogProps> = ({ isOpen, onClose, connections, onToggleConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Database className="size-4" />
            </div>
            <h2 className="text-lg font-semibold text-white">Configure Infrastructure Connections</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {connections.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">No connection systems configured.</div>
          ) : (
            connections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                    <Database className="size-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-zinc-200">{conn.name}</div>
                    <div className="text-xs text-zinc-500 font-mono">{conn.endpointUrl}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    conn.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {conn.status}
                  </span>

                  <button
                    onClick={() => onToggleConnect(conn.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      conn.status === 'Connected' 
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    {conn.status === 'Connected' ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center justify-end pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
};

interface CaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exception: ExceptionCase | null;
  onResolve: (id: string) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ isOpen, onClose, exception, onResolve }) => {
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !exception) return null;

  const handleExecute = async () => {
    setResolving(true);
    setError(null);
    try {
      await ariseApi.resolveException(exception.id);
      onResolve(exception.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve case on API server.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400">{exception.caseNumber}</span>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">{exception.exceptionType}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{exception.customerName}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="text-[11px] text-zinc-400">Exception Amount</div>
              <div className="text-lg font-semibold text-white mt-0.5">${exception.amount.toLocaleString()} {exception.currency}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="text-[11px] text-zinc-400">AI Confidence Score</div>
              <div className="text-lg font-semibold text-emerald-400 mt-0.5">{exception.confidence}%</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="text-[11px] text-zinc-400">Risk Assessment</div>
              <div className={`text-sm font-semibold mt-1 ${
                exception.riskScore === 'Critical' ? 'text-red-400' :
                exception.riskScore === 'High' ? 'text-amber-400' : 'text-blue-400'
              }`}>{exception.riskScore} Risk</div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Case Description</h3>
            <p className="text-sm text-zinc-300">{exception.description}</p>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <Bot className="size-4" />
              <span>Recommended Resolution Action</span>
            </div>
            <p className="text-sm text-blue-200">{exception.suggestedAction}</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Close
            </button>
            <button
              onClick={handleExecute}
              disabled={resolving}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {resolving ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              <span>{resolving ? 'Executing...' : 'Execute Resolution Action'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
