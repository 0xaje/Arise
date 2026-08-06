import React, { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { ariseApi } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const data = await ariseApi.getReportsSummary();
        setSummary(data);
      } catch (e) {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="size-6 text-blue-400" />
            Intelligence & Financial Analytics
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Revenue recovery velocity, exception resolution rates, and autonomous efficiency metrics.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-zinc-500 gap-2">
          <RefreshCw className="size-5 animate-spin text-blue-400" />
          <span className="text-xs">Fetching report summary from API...</span>
        </div>
      ) : !summary ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-xs text-zinc-400">
          No financial analytics available. Connect backend API server to view analytics.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5">
              <div className="text-xs text-zinc-400 font-medium">Monthly Recovered Revenue</div>
              <div className="text-2xl font-bold text-white mt-1">
                ${(summary.monthlyRecoveredValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-400 font-medium mt-1">API Live Calculation</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5">
              <div className="text-xs text-zinc-400 font-medium">Mean Time to Resolution (MTTR)</div>
              <div className="text-2xl font-bold text-white mt-1">{summary.mttrSeconds !== undefined ? summary.mttrSeconds : 0} Seconds</div>
              <div className="text-xs text-blue-400 font-medium mt-1">Real-time resolution speed</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5">
              <div className="text-xs text-zinc-400 font-medium">FTE Hours Saved</div>
              <div className="text-2xl font-bold text-white mt-1">{summary.fteHoursSaved || 0} Hours</div>
              <div className="text-xs text-purple-400 font-medium mt-1">Operational velocity</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#111114] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Resolution Velocity by Exception Type</h3>
            <div className="space-y-3 text-xs">
              {(summary.resolutionVelocity || []).map((item: any, idx: number) => (
                <div key={idx}>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>{item.category}</span>
                    <span className="font-bold text-white">{item.automationRate}% automated ({item.count} cases)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${item.automationRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
