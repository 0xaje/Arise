import React, { useState } from 'react';
import { ExceptionCase } from '../types/arise';
import { Search, Filter, AlertTriangle, CheckCircle2, ShieldAlert, Clock, ArrowUpDown, Eye } from 'lucide-react';

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

        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
          <span>Active Exceptions:</span>
          <span className="font-bold text-white">{exceptions.length}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by case #, customer name, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1 text-xs">
          {['All', 'Pending', 'Investigating', 'Resolved', 'Escalated'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                statusFilter === status 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#111114] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3.5">Case Number</th>
                <th className="px-4 py-3.5">Customer & Account</th>
                <th className="px-4 py-3.5">Exception Type</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Risk Score</th>
                <th className="px-4 py-3.5">AI Confidence</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredExceptions.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-4 font-mono font-medium text-blue-400">
                    {item.caseNumber}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-white">{item.customerName}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{item.accountNumber}</div>
                  </td>
                  <td className="px-4 py-4 font-medium text-zinc-300">
                    {item.exceptionType}
                  </td>
                  <td className="px-4 py-4 font-bold text-white">
                    ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      item.riskScore === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      item.riskScore === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      item.riskScore === 'Medium' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {item.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-emerald-400">
                    {item.confidence}%
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                      item.status === 'Resolved' ? 'bg-emerald-500/15 text-emerald-400' :
                      item.status === 'Investigating' ? 'bg-blue-500/15 text-blue-400' :
                      item.status === 'Escalated' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => onSelectCase(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white"
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
