import React, { useState } from 'react';
import type { ExceptionCase } from '../types/arise';
import { Search, AlertTriangle, Eye, ShieldAlert, DollarSign, Activity } from 'lucide-react';

interface ExceptionsPageProps {
  exceptions: ExceptionCase[];
  onSelectCase: (caseItem: ExceptionCase) => void;
}

export const ExceptionsPage: React.FC<ExceptionsPageProps> = ({ exceptions, onSelectCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredExceptions = exceptions.filter((item) => {
    const matchesSearch = 
      item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.exceptionType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAtRisk = exceptions.reduce((acc, curr) => curr.status !== 'Resolved' ? acc + curr.amount : acc, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="size-6 text-amber-400" />
            Exception Queue
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time financial exceptions detected across Stripe, NetSuite, and bank remittance feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs">
            <DollarSign className="size-4 text-emerald-400" />
            <span className="text-zinc-400">Unresolved Value:</span>
            <strong className="text-white font-mono">${totalAtRisk.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-2.5 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter by case #, customer name, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 text-xs">
          {['All', 'Pending', 'Investigating', 'Resolved', 'Escalated'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
                statusFilter === status 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800/80 font-mono">
              <tr>
                <th className="px-5 py-4">Case ID</th>
                <th className="px-5 py-4">Customer & Ledger</th>
                <th className="px-5 py-4">Exception Type</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Risk Rating</th>
                <th className="px-5 py-4">AI Confidence</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredExceptions.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-5 py-4 font-mono font-bold text-indigo-400">
                    {item.caseNumber}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 font-bold text-zinc-300 text-xs">
                        {item.customerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">{item.customerName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{item.accountNumber} • {item.sourceSystem}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-zinc-300">
                    <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 border border-zinc-700/60 text-[11px]">
                      {item.exceptionType}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-extrabold text-white text-sm">
                    ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold ${
                      item.riskScore === 'Critical' ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-500/10' :
                      item.riskScore === 'High' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10' :
                      item.riskScore === 'Medium' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.riskScore}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" 
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-[11px]">{item.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                      item.status === 'Resolved' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                      item.status === 'Investigating' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' :
                      item.status === 'Escalated' ? 'bg-red-500/15 text-red-300 border border-red-500/20' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onSelectCase(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all shadow-sm"
                    >
                      <Eye className="size-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
