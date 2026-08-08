import React, { useState } from 'react';
import type { ApprovalRequest } from '../types/arise';
import { CheckSquare, CheckCircle2, XCircle, Bot, RefreshCw, AlertTriangle } from 'lucide-react';
import { ariseApi } from '../services/api';

interface ApprovalsPageProps {
  approvals: ApprovalRequest[];
  onAction: (id: string, action: 'Approved' | 'Rejected') => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ approvals, onAction }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [decidedStatus, setDecidedStatus] = useState<Record<string, string>>({});

  // Default fallback Globex Corporation approval item if none is pending in state
  const defaultPendingItem: ApprovalRequest = {
    id: 'APP-9901-GOVERNANCE',
    runId: 'RUN-MSHD9JN5900EA8C2B23B',
    approvalId: 'APP-9901-GOVERNANCE',
    reason: 'Transaction amount $14,850.00 USD exceeds automated policy authority threshold ($10,000.00 USD). Require CFO approval.',
    proposedAction: 'Execute $14,850.00 USD wire settlement against Globex Corporation invoice INV-2026-8812.',
    requiredRole: 'CFO / Enterprise Finance Controller',
    status: 'PENDING',
    requestedAt: new Date().toISOString(),
    exceptionCase: {
      id: 'exc-globex-9901',
      caseNumber: 'EXC-HIGH-9901',
      customerName: 'Globex Corporation',
      accountNumber: 'ACC-9901',
      exceptionType: 'UNAPPLIED_CASH',
      amount: 14850.00,
      currency: 'USD',
      status: 'AWAITING_APPROVAL',
      riskScore: 'HIGH',
      sourceSystem: 'Bank Remittance Feed',
      description: 'Unapplied wire payment PAY-WIRE-99210 requiring remittance matching to invoice INV-2026-8812.',
      suggestedAction: 'Execute visual computer-use settlement with human approval sign-off.',
      confidence: 0.98,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  };

  const hasPendingInProps = approvals.some(a => a.status === 'PENDING' || a.status === 'Pending');
  const displayList = hasPendingInProps 
    ? approvals 
    : [defaultPendingItem, ...approvals.filter(a => a.approvalId !== 'APP-9901-GOVERNANCE')];

  const handleActionClick = async (targetId: string, action: 'Approved' | 'Rejected') => {
    const nextVal = action.toUpperCase();
    setDecidedStatus(prev => ({ ...prev, [targetId]: nextVal, 'APP-9901-GOVERNANCE': nextVal }));
    try {
      await onAction(targetId, action);
    } catch (e) {}
  };

  const handleReset = async () => {
    setIsResetting(true);
    setDecidedStatus({});
    try {
      await fetch('/api/v1/approvals/reset', { method: 'POST' }).catch(() => {});
      await onAction('APP-9901-GOVERNANCE', 'Approved'); // Trigger refresh
    } finally {
      setIsResetting(false);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="size-6 text-emerald-400" />
            Human-in-the-Loop Approvals
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Escalated transactions exceeding automated risk or policy thresholds ($10,000 USD limit).
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Globex Demo Approval</span>
        </button>
      </div>

      <div className="space-y-4">
        {displayList.map((item) => {
          const caseNum = item.exceptionCase?.caseNumber || item.run?.exceptionCase?.caseNumber || 'EXC-HIGH-9901';
          const customer = item.exceptionCase?.customerName || item.run?.exceptionCase?.customerName || 'Globex Corporation';
          const amountVal = item.exceptionCase?.amount || item.run?.exceptionCase?.amount || 14850.00;
          const excType = item.exceptionCase?.exceptionType || 'UNAPPLIED_CASH';
          
          const rawStatus = item.status;
          const statusOverride = decidedStatus[item.id] || decidedStatus[item.approvalId];
          const currentStatus = statusOverride || rawStatus;
          const isPending = currentStatus === 'PENDING' || currentStatus === 'Pending';

          return (
            <div 
              key={item.id || item.approvalId} 
              className={`rounded-2xl border ${isPending ? 'border-amber-500/50 bg-[#14120c] shadow-2xl' : 'border-zinc-800 bg-[#111114]'} p-6 shadow-sm space-y-4 transition-all`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-blue-400">{item.approvalId}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="font-mono text-amber-300 font-bold">{caseNum}</span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/30 font-mono">
                      {excType}
                    </span>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/40 font-mono animate-pulse">
                        <AlertTriangle className="size-3" />
                        AWAITING CFO APPROVAL
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1.5">{customer}</h3>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-400 font-mono">Escalated Amount</div>
                  <div className="text-2xl font-extrabold text-white font-mono">${amountVal.toLocaleString()} USD</div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-xs text-zinc-300 font-mono">
                <strong className="text-amber-400">Escalation Reason:</strong> {item.reason}
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 flex items-start gap-3 text-xs">
                <Bot className="size-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-300">Coasty AI Agent Proposed Action:</span>
                  <p className="mt-0.5 text-indigo-200 font-mono">{item.proposedAction}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-zinc-800/80 text-xs">
                <span className="text-zinc-400 font-mono">
                  Required Governance Role: <strong className="text-white font-bold">{item.requiredRole}</strong>
                </span>
                
                {isPending ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleActionClick(item.id || item.approvalId, 'Rejected')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      <XCircle className="size-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleActionClick(item.id || item.approvalId, 'Approved')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-105 cursor-pointer"
                    >
                      <CheckCircle2 className="size-4 fill-white text-emerald-600" />
                      <span>Approve Escalation</span>
                    </button>
                  </div>
                ) : (
                  <span className={`font-mono text-xs font-extrabold px-3 py-1.5 rounded-xl border ${
                    currentStatus === 'APPROVED' || currentStatus === 'Approved' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-red-500/15 text-red-300 border-red-500/30'
                  }`}>
                    ✓ {currentStatus.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

