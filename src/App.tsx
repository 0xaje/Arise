import { useState, useEffect } from 'react';
import type { RouteId, ExceptionCase, WorkflowItem, AgentRun, ApprovalRequest, ConnectionSystem, LiveActivityEvent, AuditLog, EvidenceItem } from './types/arise';
import { ariseApi } from './services/api';

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

  // Real Database State (Starts 100% empty, loaded exclusively from Backend API)
  const [exceptions, setExceptions] = useState<ExceptionCase[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [connections, setConnections] = useState<ConnectionSystem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveActivityEvent[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Check Real Backend API Health & Load Live Data
  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const health = await ariseApi.checkHealth();
      if (health.status === 'ok') {
        setIsBackendConnected(true);
        const [exc, wf, rn, app, conn, aud, evd, evts] = await Promise.all([
          ariseApi.getExceptions(),
          ariseApi.getWorkflows(),
          ariseApi.getRuns(),
          ariseApi.getApprovals(),
          ariseApi.getConnections(),
          ariseApi.getAuditLogs(),
          ariseApi.getEvidence(),
          ariseApi.getLiveEvents(),
        ]);
        setExceptions(exc || []);
        setWorkflows(wf || []);
        setRuns(rn || []);
        setApprovals(app || []);
        setConnections(conn || []);
        setAuditLogs(aud || []);
        setEvidence(evd || []);
        setLiveEvents(evts || []);
      }
    } catch (e) {
      setIsBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Modals
  const [isCreateWfOpen, setIsCreateWfOpen] = useState(false);
  const [isRunWfOpen, setIsRunWfOpen] = useState(false);
  const [isConnDialogOpen, setIsConnDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ExceptionCase | null>(null);

  // Event handlers
  const handleNavigate = (route: RouteId) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateWorkflow = (created: WorkflowItem) => {
    setWorkflows(prev => [created, ...prev]);
    fetchLiveData();
  };

  const handleTriggerRun = (workflowId: string) => {
    fetchLiveData();
  };

  const handleResolveCase = (caseId: string) => {
    fetchLiveData();
  };

  const handleApprovalAction = async (approvalId: string, action: 'Approved' | 'Rejected') => {
    try {
      await ariseApi.submitApprovalDecision(approvalId, action);
    } catch (e) {}
    fetchLiveData();
  };

  const handleToggleConnection = async (connId: string) => {
    const target = connections.find(c => c.id === connId);
    const nextStatus = target?.status === 'Connected' ? 'Disconnected' : 'Connected';
    try {
      await ariseApi.updateConnection(connId, { status: nextStatus });
    } catch (e) {}
    fetchLiveData();
  };

  const toggleWorkflowStatus = async (id: string) => {
    const target = workflows.find(w => w.id === id);
    const nextStatus = target?.status === 'Active' ? 'Paused' : 'Active';
    try {
      await ariseApi.updateWorkflowStatus(id, nextStatus);
    } catch (e) {}
    fetchLiveData();
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
