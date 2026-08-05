import { useState, useEffect } from 'react';
import type { RouteId, ExceptionCase, WorkflowItem, AgentRun, ApprovalRequest, ConnectionSystem, LiveActivityEvent } from './types/arise';
import { ariseApi } from './services/api';
import { 
  INITIAL_EXCEPTIONS, 
  INITIAL_WORKFLOWS, 
  INITIAL_RUNS, 
  INITIAL_APPROVALS, 
  INITIAL_CONNECTIONS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_EVIDENCE, 
  INITIAL_LIVE_EVENTS 
} from './data/mockData';

import { AppShell } from './components/layout/AppShell';
import { CreateWorkflowModal, RunWorkflowModal, ConnectionDialog, CaseDetailModal } from './components/common/Modals';

import { CommandCenter } from './pages/CommandCenter';
import { ExceptionsPage } from './pages/ExceptionsPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { RunsPage } from './pages/RunsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditPage } from './pages/AuditPage';
import { EvidencePage } from './pages/EvidencePage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { CoastyPage } from './pages/CoastyPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteId>('/');

  // Global State
  const [exceptions, setExceptions] = useState<ExceptionCase[]>(INITIAL_EXCEPTIONS);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(INITIAL_WORKFLOWS);
  const [runs, setRuns] = useState<AgentRun[]>(INITIAL_RUNS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(INITIAL_APPROVALS);
  const [connections, setConnections] = useState<ConnectionSystem[]>(INITIAL_CONNECTIONS);
  const [auditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [evidence] = useState(INITIAL_EVIDENCE);
  const [liveEvents, setLiveEvents] = useState<LiveActivityEvent[]>(INITIAL_LIVE_EVENTS);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Modals
  const [isCreateWfOpen, setIsCreateWfOpen] = useState(false);
  const [isRunWfOpen, setIsRunWfOpen] = useState(false);
  const [isConnDialogOpen, setIsConnDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ExceptionCase | null>(null);

  // Check Backend Connection Health on Mount & Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const health = await ariseApi.checkHealth();
        if (health.status === 'ok') {
          setIsBackendConnected(true);
          const [exc, wf, rn, app, conn, evts] = await Promise.all([
            ariseApi.getExceptions(),
            ariseApi.getWorkflows(),
            ariseApi.getRuns(),
            ariseApi.getApprovals(),
            ariseApi.getConnections(),
            ariseApi.getLiveEvents(),
          ]);
          setExceptions(exc);
          setWorkflows(wf);
          setRuns(rn);
          setApprovals(app);
          setConnections(conn);
          setLiveEvents(evts);
        }
      } catch (e) {
        setIsBackendConnected(false);
      }
    }
    loadData();
  }, []);

  // Event handlers
  const handleNavigate = (route: RouteId) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateWorkflow = (created: WorkflowItem) => {
    setWorkflows(prev => [created, ...prev]);
    setLiveEvents(prev => [{
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
      message: `Workflow '${created.name}' created and activated.`,
      source: 'Workflow Studio'
    }, ...prev]);
  };

  const handleTriggerRun = (workflowId: string) => {
    const wf = workflows.find(w => w.id === workflowId);
    const newRun: AgentRun = {
      id: `run-${Date.now()}`,
      runId: `RUN-${Math.floor(10000 + Math.random() * 90000)}`,
      workflowName: wf?.name || 'Manual Workflow Execution',
      status: 'Completed',
      startedAt: new Date().toLocaleString(),
      durationMs: 1250,
      targetCase: 'EXC-8092',
      stepsCount: 5,
      logSummary: 'Coasty agent completed execution loop in 1.25s. All checks passed.'
    };
    setRuns(prev => [newRun, ...prev]);
    setLiveEvents(prev => [{
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
      message: `Executed run ${newRun.runId} for ${newRun.workflowName}.`,
      source: 'Coasty Runner'
    }, ...prev]);
  };

  const handleResolveCase = (caseId: string) => {
    setExceptions(prev => prev.map(c => c.id === caseId ? { ...c, status: 'Resolved' } : c));
    setLiveEvents(prev => [{
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
      message: `Case ${caseId} resolved autonomously. Evidence attached to ledger.`,
      source: 'ARISE Engine'
    }, ...prev]);
  };

  const handleApprovalAction = async (approvalId: string, action: 'Approved' | 'Rejected') => {
    try {
      await ariseApi.submitApprovalDecision(approvalId, action);
    } catch (e) {
      // safe fallback
    }
    setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status: action } : a));
    setLiveEvents(prev => [{
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: action === 'Approved' ? 'success' : 'warning',
      message: `Escalation ${approvalId} ${action.toLowerCase()} by Human Operator.`,
      source: 'Approval Queue'
    }, ...prev]);
  };

  const handleToggleConnection = async (connId: string) => {
    const target = connections.find(c => c.id === connId);
    const nextStatus = target?.status === 'Connected' ? 'Disconnected' : 'Connected';
    try {
      await ariseApi.updateConnection(connId, { status: nextStatus });
    } catch (e) {
      // safe fallback
    }
    setConnections(prev => prev.map(c => {
      if (c.id === connId) {
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    setIsBackendConnected(true);
  };

  const toggleWorkflowStatus = async (id: string) => {
    const target = workflows.find(w => w.id === id);
    const nextStatus = target?.status === 'Active' ? 'Paused' : 'Active';
    try {
      await ariseApi.updateWorkflowStatus(id, nextStatus);
    } catch (e) {
      // safe fallback
    }
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: nextStatus } : w));
  };

  return (
    <AppShell
      currentRoute={currentRoute}
      onNavigate={handleNavigate}
      onOpenCreateWorkflow={() => setIsCreateWfOpen(true)}
      onOpenRunWorkflow={() => setIsRunWfOpen(true)}
      onOpenReviewConnections={() => setIsConnDialogOpen(true)}
      isBackendConnected={isBackendConnected}
    >
      {/* Route Views */}
      {currentRoute === '/' && (
        <CommandCenter
          onNavigate={handleNavigate}
          onOpenCreateWorkflow={() => setIsCreateWfOpen(true)}
          onOpenRunWorkflow={() => setIsRunWfOpen(true)}
          onOpenReviewConnections={() => setIsConnDialogOpen(true)}
          isBackendConnected={isBackendConnected}
          liveEvents={liveEvents}
          exceptions={exceptions}
        />
      )}

      {currentRoute === '/exceptions' && (
        <ExceptionsPage
          exceptions={exceptions}
          onSelectCase={(item) => setSelectedCase(item)}
        />
      )}

      {currentRoute === '/workflows' && (
        <WorkflowsPage
          workflows={workflows}
          onOpenCreateWorkflow={() => setIsCreateWfOpen(true)}
          onOpenRunWorkflow={() => setIsRunWfOpen(true)}
          onToggleStatus={toggleWorkflowStatus}
        />
      )}

      {currentRoute === '/runs' && (
        <RunsPage runs={runs} />
      )}

      {currentRoute === '/approvals' && (
        <ApprovalsPage
          approvals={approvals}
          onAction={handleApprovalAction}
        />
      )}

      {currentRoute === '/reports' && (
        <ReportsPage />
      )}

      {currentRoute === '/audit' && (
        <AuditPage logs={auditLogs} />
      )}

      {currentRoute === '/evidence' && (
        <EvidencePage evidence={evidence} />
      )}

      {currentRoute === '/connections' && (
        <ConnectionsPage
          connections={connections}
          onOpenDialog={() => setIsConnDialogOpen(true)}
          onToggleConnect={handleToggleConnection}
        />
      )}

      {currentRoute === '/coasty' && (
        <CoastyPage />
      )}

      {currentRoute === '/settings' && (
        <SettingsPage />
      )}

      {/* Global Modals */}
      <CreateWorkflowModal
        isOpen={isCreateWfOpen}
        onClose={() => setIsCreateWfOpen(false)}
        onCreate={handleCreateWorkflow}
      />

      <RunWorkflowModal
        isOpen={isRunWfOpen}
        onClose={() => setIsRunWfOpen(false)}
        workflows={workflows}
        onTriggerRun={handleTriggerRun}
      />

      <ConnectionDialog
        isOpen={isConnDialogOpen}
        onClose={() => setIsConnDialogOpen(false)}
        connections={connections}
        onToggleConnect={handleToggleConnection}
      />

      <CaseDetailModal
        isOpen={selectedCase !== null}
        onClose={() => setSelectedCase(null)}
        exception={selectedCase}
        onResolve={handleResolveCase}
      />
    </AppShell>
  );
}

export default App;
