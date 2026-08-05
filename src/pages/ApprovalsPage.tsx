import React from 'react';
import type { ApprovalRequest } from '../types/arise';
import { CheckSquare, CheckCircle2, XCircle, Bot } from 'lucide-react';

interface ApprovalsPageProps {
  approvals: ApprovalRequest[];
  onAction: (id: string, action: 'Approved' | 'Rejected') => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ approvals, onAction }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="size-6 text-emerald-400" />
            Human-in-the-Loop Approvals
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Escalated transactions exceeding automated risk or policy thresholds.
          </p>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <CheckSquare className="size-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Pending Approvals</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            All transaction exceptions are within autonomous auto-resolution authority thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-blue-400">{item.approvalId}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="font-mono text-zinc-400">{item.caseNumber}</span>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                      {item.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{item.customerName}</h3>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-400">Escalated Amount</div>
                  <div className="text-xl font-bold text-white">${item.amount.toLocaleString()} USD</div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300">
                <strong className="text-zinc-400">Escalation Reason:</strong> {item.reasonForEscalation}
              </div>

              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3.5 flex items-start gap-2.5 text-xs">
                <Bot className="size-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-300">Agent Recommendation:</span>
                  <p className="mt-0.5 text-indigo-200">{item.agentRecommendation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-xs">
                <span className="text-zinc-500">Required Role: <strong className="text-zinc-300">{item.requiredRole}</strong></span>
                
                {item.status === 'Pending' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAction(item.id, 'Rejected')}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-medium text-red-400 hover:bg-zinc-800"
                    >
                      <XCircle className="size-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => onAction(item.id, 'Approved')}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3.5 py-1.5 font-semibold text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Approve Escalation</span>
                    </button>
                  </div>
                ) : (
                  <span className={`font-semibold px-2.5 py-1 rounded ${
                    item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
