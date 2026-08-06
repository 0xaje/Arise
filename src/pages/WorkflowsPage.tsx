import React from 'react';
import type { WorkflowItem } from '../types/arise';
import { GitBranch, Plus, Play, CheckCircle2, Pause } from 'lucide-react';

interface WorkflowsPageProps {
  workflows: WorkflowItem[];
  onOpenCreateWorkflow: () => void;
  onOpenRunWorkflow: () => void;
  onToggleStatus: (id: string) => void;
}

export const WorkflowsPage: React.FC<WorkflowsPageProps> = ({
  workflows,
  onOpenCreateWorkflow,
  onOpenRunWorkflow,
  onToggleStatus
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <GitBranch className="size-6 text-blue-400" />
            Automation Workflows
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Configure settlement threshold rules, trigger events, and autonomous decision policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateWorkflow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            <Plus className="size-4 text-blue-400" />
            <span>Create Workflow</span>
          </button>
          <button
            onClick={onOpenRunWorkflow}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
          >
            <Play className="size-3.5" />
            <span>Trigger Run</span>
          </button>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <GitBranch className="size-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Workflows Configured</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Click 'Create Workflow' above to define your first autonomous revenue settlement rule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {workflows.map((wf) => {
            const lastRunStr = wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString() : 'Active';
            const runsCount = wf._count?.agentRuns || 0;

            return (
              <div key={wf.id} className="rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                        {wf.category}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">Updated: {lastRunStr}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1.5">{wf.name}</h3>
                  </div>

                  <button
                    onClick={() => onToggleStatus(wf.id)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold flex items-center gap-1 ${
                      wf.status === 'ACTIVE' || wf.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {wf.status === 'ACTIVE' || wf.status === 'Active' ? <CheckCircle2 className="size-3" /> : <Pause className="size-3" />}
                    <span>{wf.status}</span>
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {wf.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/80 text-xs">
                  <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/60">
                    <div className="text-[10px] text-zinc-500">Auto-Approval Limit</div>
                    <div className="font-semibold text-white mt-0.5">${wf.autoApprovalThreshold.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/60">
                    <div className="text-[10px] text-zinc-500">Execution Runs</div>
                    <div className="font-semibold text-white mt-0.5">{runsCount.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/60">
                    <div className="text-[10px] text-zinc-500">Max Steps</div>
                    <div className="font-semibold text-emerald-400 mt-0.5">{wf.maxSteps || 20}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
