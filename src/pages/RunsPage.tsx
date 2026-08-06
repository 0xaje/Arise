import React from 'react';
import type { AgentRun } from '../types/arise';
import { PlayCircle } from 'lucide-react';

interface RunsPageProps {
  runs: AgentRun[];
}

export const RunsPage: React.FC<RunsPageProps> = ({ runs }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <PlayCircle className="size-6 text-purple-400" />
            Execution Runs Log
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time execution traces of Coasty computer-use agents and ARISE rule evaluations.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111114] overflow-hidden shadow-sm">
        {runs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <PlayCircle className="size-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Execution Runs Recorded</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Execution traces will populate automatically when workflow rules are triggered against PostgreSQL.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5">Run ID</th>
                  <th className="px-4 py-3.5">Workflow</th>
                  <th className="px-4 py-3.5">Target Case</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Steps</th>
                  <th className="px-4 py-3.5">Execution Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {runs.map((run) => {
                  const wfName = run.workflow?.name || 'AR Settlement Workflow';
                  const caseNum = run.exceptionCase?.caseNumber || 'N/A';
                  const durationStr = run.durationMs ? `${run.durationMs} ms` : 'Active';
                  const stepsStr = `${run.currentStep || 0} / ${run.totalSteps || 0}`;
                  const summaryStr = run.outcome || run.errorMessage || (run.externalRunId ? `Coasty Run ID: ${run.externalRunId}` : 'Queued for execution');

                  return (
                    <tr key={run.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-4 font-mono font-medium text-purple-400">
                        {run.runId}
                        {run.externalRunId && (
                          <div className="text-[10px] text-zinc-500">Ext: {run.externalRunId}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-semibold text-white">{wfName}</td>
                      <td className="px-4 py-4 font-mono text-zinc-400">{caseNum}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                          run.status === 'COMPLETED' || run.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400' :
                          run.status === 'APPROVAL_REQUIRED' || run.status === 'WAITING' ? 'bg-amber-500/15 text-amber-400' :
                          run.status === 'QUEUED' || run.status === 'STARTING' || run.status === 'RUNNING' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-zinc-400">{durationStr}</td>
                      <td className="px-4 py-4 font-mono text-zinc-300">{stepsStr}</td>
                      <td className="px-4 py-4 text-zinc-300 font-mono text-[11px] max-w-xs truncate">{summaryStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
