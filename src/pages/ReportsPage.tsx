import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock, ShieldCheck } from 'lucide-react';

export const ReportsPage: React.FC = () => {
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5">
          <div className="text-xs text-zinc-400 font-medium">Monthly Recovered Revenue</div>
          <div className="text-2xl font-bold text-white mt-1">$1,482,900</div>
          <div className="text-xs text-emerald-400 font-medium mt-1">↑ 14.8% vs last month</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5">
          <div className="text-xs text-zinc-400 font-medium">Mean Time to Resolution (MTTR)</div>
          <div className="text-2xl font-bold text-white mt-1">1.4 Seconds</div>
          <div className="text-xs text-blue-400 font-medium mt-1">99.2% faster than manual AR</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5">
          <div className="text-xs text-zinc-400 font-medium">FTE Hours Saved</div>
          <div className="text-2xl font-bold text-white mt-1">320 Hours</div>
          <div className="text-xs text-purple-400 font-medium mt-1">Equivalent to 2 full-time staff</div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111114] p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Resolution Velocity by Exception Type</h3>
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>Unapplied Cash Settlement</span>
              <span className="font-bold text-white">98.4% automated (1,420 cases)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: '98.4%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>Short-Pay Underpayment Writeoff</span>
              <span className="font-bold text-white">99.8% automated (890 cases)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: '99.8%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>Dispute Evidence Compilation</span>
              <span className="font-bold text-white">84.2% automated (215 cases)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800">
              <div className="h-2 rounded-full bg-purple-500" style={{ width: '84.2%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
