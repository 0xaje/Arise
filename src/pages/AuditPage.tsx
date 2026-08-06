import React from 'react';
import type { AuditLog } from '../types/arise';
import { ShieldCheck } from 'lucide-react';

interface AuditPageProps {
  logs: AuditLog[];
}

export const AuditPage: React.FC<AuditPageProps> = ({ logs }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="size-6 text-emerald-400" />
            Immutable Audit Trail
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            SOX & SOC2 compliant record of all autonomous system actions and cryptographic verification hashes.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#111114] overflow-hidden shadow-sm">
        {logs.length === 0 ? (
          <div className="glass-panel p-12 text-center text-xs text-zinc-500 font-mono">
            No audit logs emitted yet. Actions performed by ARISE policy engine or Coasty agents will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Actor</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target Resource</th>
                  <th className="px-4 py-3.5">Details</th>
                  <th className="px-4 py-3.5">Verification Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-4 text-zinc-400">{log.timestamp}</td>
                    <td className="px-4 py-4 text-blue-400 font-semibold">{log.actor}</td>
                    <td className="px-4 py-4">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-200">{log.action}</span>
                    </td>
                    <td className="px-4 py-4 text-zinc-300">{log.targetResource}</td>
                    <td className="px-4 py-4 font-sans text-zinc-300 text-xs">{log.details}</td>
                    <td className="px-4 py-4 text-emerald-400">{log.verificationHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
