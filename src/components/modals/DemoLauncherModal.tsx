import React, { useState } from 'react';
import { X, Play, ShieldCheck, Cpu, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { ariseApi } from '../../services/api';

interface DemoLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCreated?: (runId: string) => void;
}

export const DemoLauncherModal: React.FC<DemoLauncherModalProps> = ({
  isOpen,
  onClose,
  onRunCreated,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [launchedRunId, setLaunchedRunId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLaunchDemo = async () => {
    setIsLaunching(true);
    setLogs(['[ARISE] Initializing Competition Demo Run...', '[ARISE] Connecting to Coasty machine ember-orbit...']);

    try {
      const wfs = await ariseApi.getWorkflows();
      const compWf = wfs.find(w => w.category === 'Competition Workflow') || wfs[0];

      if (!compWf) {
        throw new Error('No competition workflow found');
      }

      setLogs(prev => [...prev, `[ARISE] Target Workflow: ${compWf.name}`]);
      setLogs(prev => [...prev, '[ARISE] Target Case: Globex Corporation (EXC-HIGH-9901)']);
      setLogs(prev => [...prev, '[ARISE] Amount: $14,850.00 USD (> $10,000 Threshold)']);

      const run = await ariseApi.triggerWorkflowRun(compWf.id, {
        caseNumber: 'EXC-HIGH-9901',
        customerName: 'Globex Corporation',
        amount: 14850.00
      });

      setLogs(prev => [...prev, `[ARISE] Run Created: ${run.runId} (${run.id})`]);
      setLogs(prev => [...prev, '[ARISE] 18 Business Stages Initialized. Executing visual computer-use...']);

      setLaunchedRunId(run.runId);
      if (onRunCreated) onRunCreated(run.runId);
    } catch (e: any) {
      setLogs(prev => [...prev, `[ERROR] Failed to launch demo: ${e.message}`]);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-indigo-500/30 bg-[#0d0d16] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <Cpu className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Competition Workflow Demo Launcher</h2>
              <p className="text-xs text-zinc-400">Launch the 68-Step Globex Cash Application Workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {/* Case Context Details */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <span className="text-zinc-500 block text-[10px]">TARGET EXCEPTION:</span>
            <span className="text-white font-bold">EXC-HIGH-9901</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <span className="text-zinc-500 block text-[10px]">CUSTOMER ACCOUNT:</span>
            <span className="text-white font-bold">Globex Corporation (ACC-9901)</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <span className="text-zinc-500 block text-[10px]">PAYMENT AMOUNT:</span>
            <span className="text-emerald-400 font-bold">$14,850.00 USD</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <span className="text-zinc-500 block text-[10px]">HUMAN GATE THRESHOLD:</span>
            <span className="text-amber-400 font-bold">$10,000.00 USD</span>
          </div>
        </div>

        {/* Logs Console Box */}
        {logs.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-black/90 p-4 font-mono text-[11px] space-y-1.5 max-h-40 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className={log.includes('ERROR') ? 'text-red-400' : 'text-emerald-400'}>
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Pure Visual Computer Use • 0 Mocks</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white">
              Cancel
            </button>

            <button
              onClick={handleLaunchDemo}
              disabled={isLaunching}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-5 py-2.5 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Play className="size-4 fill-white" />
              <span>{isLaunching ? 'Launching Run...' : 'Launch Live Demo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
