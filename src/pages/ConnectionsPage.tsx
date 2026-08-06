import React from 'react';
import { ConnectionSystem } from '../types/arise';
import { Network, Zap, Database, Users, Bot, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConnectionsPageProps {
  connections: ConnectionSystem[];
  onOpenDialog: () => void;
  onToggleConnect: (id: string) => void;
}

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({ connections, onOpenDialog, onToggleConnect }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Network className="size-6 text-indigo-400" />
            Infrastructure Connections
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Connected ERP systems, payment gateways, and autonomous browser agent nodes.
          </p>
        </div>

        <button
          onClick={onOpenDialog}
          className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
        >
          Configure Connections
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {connections.map((conn) => (
          <div key={conn.id} className="rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-blue-400 shadow-inner">
                  {conn.name.includes('Stripe') ? <Zap className="size-6 text-amber-400" /> :
                   conn.name.includes('NetSuite') ? <Database className="size-6 text-blue-400" /> :
                   conn.name.includes('Coasty') ? <Bot className="size-6 text-purple-400" /> : <Users className="size-6 text-emerald-400" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{conn.name}</h3>
                  <span className="text-xs text-zinc-400 font-mono">{conn.type}</span>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                conn.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {conn.status === 'Connected' ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                <span>{conn.status}</span>
              </span>
            </div>

            <div className="rounded-lg bg-zinc-900/60 p-3 border border-zinc-800/60 font-mono text-xs text-zinc-400 truncate">
              {conn.endpointUrl}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-500">Last verified: <strong className="text-zinc-300 font-mono">{conn.lastVerifiedAt ? new Date(conn.lastVerifiedAt).toLocaleString() : 'Not verified yet'}</strong></span>
              <button
                onClick={() => onToggleConnect(conn.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  conn.status === 'Connected' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                {conn.status === 'Connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
