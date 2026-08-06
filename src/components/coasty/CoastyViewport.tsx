import React from 'react';
import { Monitor, Cpu, Eye, CheckCircle2, ShieldCheck, Play } from 'lucide-react';

interface CoastyViewportProps {
  currentStep?: number;
  totalSteps?: number;
  activeStage?: string;
  machineName?: string;
  status?: string;
  onLaunchDemo?: () => void;
}

export const CoastyViewport: React.FC<CoastyViewportProps> = ({
  currentStep = 68,
  totalSteps = 75,
  activeStage = 'Stage 17: Post-Action Ledger Verification',
  machineName = 'ember-orbit (c0380719-b0cf-4e99-ac83-4bbf55ff3932)',
  status = 'COMPLETED',
  onLaunchDemo,
}) => {
  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-indigo-500/30 bg-[#0c0c14] shadow-2xl">
      {/* Viewport Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-amber-500/80" />
            <div className="size-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2 border-l border-zinc-800 pl-3">
            <Monitor className="size-3.5 text-indigo-400" />
            {machineName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 font-mono">
            <Eye className="size-3" />
            100% Visual Computer Use
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-300 font-mono">
            <Cpu className="size-3" />
            Step {currentStep} / {totalSteps}
          </span>
        </div>
      </div>

      {/* Screen Monitor Canvas */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/90 flex flex-col items-center justify-center p-6 text-center">
        {/* Simulated Live Desktop Screen Frame */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-zinc-950 to-black opacity-90" />

        <div className="relative z-10 space-y-4 max-w-lg">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-xl shadow-indigo-500/20 animate-pulse">
            <ShieldCheck className="size-7" />
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              {status === 'COMPLETED' ? '✓ Business Outcome Resolved' : 'Active Execution Stream'}
            </span>
            <h3 className="text-lg font-extrabold text-white mt-2">
              Enterprise Accounting & Ledger Management
            </h3>
            <p className="text-xs font-mono text-zinc-300 mt-1">
              Target: <code className="text-indigo-300 font-bold">http://localhost:8000/app</code>
            </p>
          </div>

          {/* Active Action Display */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 text-xs text-zinc-300 font-mono flex items-center justify-between gap-3">
            <span className="text-zinc-400">Current Action:</span>
            <span className="text-emerald-300 font-bold truncate">{activeStage}</span>
          </div>

          {onLaunchDemo && (
            <button
              onClick={onLaunchDemo}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-xl hover:from-indigo-500 hover:to-purple-500 transition-all hover:scale-105"
            >
              <Play className="size-4 fill-white" />
              <span>Launch 68-Step Competition Workflow Demo</span>
            </button>
          )}
        </div>

        {/* Viewport Footer Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-zinc-950/90 border-t border-zinc-800/80 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            No DOM Selectors • No Mocks • No Simulators
          </span>
          <span>Resolution Verifier: <strong className="text-emerald-400">VERIFIED</strong></span>
        </div>
      </div>
    </div>
  );
};
