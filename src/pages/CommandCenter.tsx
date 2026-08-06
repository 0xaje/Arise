import React, { useState } from 'react';
import type { RouteId, LiveActivityEvent, ExceptionCase } from '../types/arise';
import { CoastyViewport } from '../components/coasty/CoastyViewport';
import { DemoLauncherModal } from '../components/modals/DemoLauncherModal';
import { 
  Zap, 
  Activity, 
  Search, 
  Scale, 
  Cpu, 
  CheckCircle2, 
  FileCheck, 
  AlertTriangle, 
  TrendingUp, 
  CheckSquare, 
  ArrowRight,
  RefreshCw,
  Sparkles,
  Bot,
  Layers,
  FileText,
  Play
} from 'lucide-react';

interface CommandCenterProps {
  onNavigate: (route: RouteId) => void;
  onOpenCreateWorkflow: () => void;
  onOpenRunWorkflow: () => void;
  onOpenReviewConnections: () => void;
  liveEvents: LiveActivityEvent[];
  exceptions: ExceptionCase[];
  isBackendConnected: boolean;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigate,
  onOpenCreateWorkflow,
  onOpenRunWorkflow,
  liveEvents,
  exceptions
}) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  // Real dynamic calculations from API state
  const pendingExceptions = exceptions.filter(e => e.status !== 'Resolved');
  const resolvedExceptions = exceptions.filter(e => e.status === 'Resolved');
  const escalatedExceptions = exceptions.filter(e => e.status === 'Escalated');

  const settledRevenueTotal = resolvedExceptions.reduce((acc, curr) => acc + curr.amount, 0);
  const accuracyPercentage = exceptions.length > 0
    ? ((resolvedExceptions.length / exceptions.length) * 100).toFixed(1)
    : '100.0';

  const steps = [
    {
      step: '01',
      title: 'Investigate',
      subtitle: 'DOM Locater',
      description: 'Coasty opens connected applications and locates the target exception case.',
      icon: Search,
      badge: 'Vision Agent',
      accent: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30'
    },
    {
      step: '02',
      title: 'Cross-check',
      subtitle: 'Multi-ERP Verification',
      description: 'Verifies wire remittances against secondary systems of record.',
      icon: Scale,
      badge: 'Dual Verification',
      accent: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30'
    },
    {
      step: '03',
      title: 'Reason',
      subtitle: 'Policy Evaluator',
      description: 'ARISE evaluates transaction context against configured policy rules.',
      icon: Cpu,
      badge: 'AI Reasoner',
      accent: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/30'
    },
    {
      step: '04',
      title: 'Resolve',
      subtitle: 'Autonomous Execution',
      description: 'Executes authorized ledger postings and fee writeoffs instantly.',
      icon: CheckCircle2,
      badge: 'Auto-Settle',
      accent: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      step: '05',
      title: 'Verify',
      subtitle: 'Cryptographic Audit',
      description: 'Captures DOM screenshots and records immutable verification hashes.',
      icon: FileCheck,
      badge: 'Evidence Proof',
      accent: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30'
    },
    {
      step: '06',
      title: 'Escalate',
      subtitle: 'Human Governance',
      description: 'Transactions exceeding authority limits are routed for human approval.',
      icon: AlertTriangle,
      badge: 'Human Guardrail',
      accent: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-[#101018] to-[#0d0d14] p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-10 -top-10 size-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 size-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="size-3.5 text-indigo-400" />
              <span>Autonomous Revenue Engine Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Finance Operations Command Center
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
              Real-time autonomous revenue intelligence, exception queue management, and multi-system settlement automation.
            </p>

            {/* Competition Status Bar */}
            <div className="mt-6 pt-4 border-t border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  🏆 Competition Workflow Complete
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                  68 Coasty Visual Steps
                </span>
              </div>
              <div className="text-zinc-300 text-[11px] font-mono">
                Globex Corp (<code className="text-emerald-400">PAY-WIRE-99210</code> APPLIED → <code className="text-emerald-400">INV-2026-8812</code> PAID $0.00)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-xl shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-105"
            >
              <Play className="size-4 fill-white" />
              <span>Launch 68-Step Demo</span>
            </button>

            <button
              onClick={() => {
                window.open('/api/v1/runs/RUN-MSHD9JN5900EA8C2B23B/certificate', '_blank');
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/25 transition-all"
            >
              <FileText className="size-4" />
              <span>Executive Certificate</span>
            </button>

            <button
              onClick={onOpenCreateWorkflow}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all shadow-md"
            >
              <Zap className="size-4 text-indigo-400" />
              <span>Create Workflow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Coasty Computer-Use Desktop Viewport */}
      <CoastyViewport onLaunchDemo={() => setIsDemoModalOpen(true)} />

      <DemoLauncherModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />

      {/* Dynamic KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div 
          onClick={() => onNavigate('/exceptions')}
          className="glass-card group cursor-pointer rounded-2xl p-5"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Pending Exceptions</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{pendingExceptions.length}</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {pendingExceptions.length > 0 ? 'Action Required' : 'Queue Clear'}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/60 group-hover:text-indigo-300">
            <span>Inspect Queue</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('/workflows')}
          className="glass-card group cursor-pointer rounded-2xl p-5"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Autonomous Accuracy</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{accuracyPercentage}%</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Live Calculation</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/60 group-hover:text-indigo-300">
            <span>View Workflows</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('/approvals')}
          className="glass-card group cursor-pointer rounded-2xl p-5"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Human Escalations</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CheckSquare className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{escalatedExceptions.length}</span>
            <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              {escalatedExceptions.length > 0 ? 'Pending Governance' : 'All Approved'}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/60 group-hover:text-indigo-300">
            <span>Review Approvals</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('/reports')}
          className="glass-card group cursor-pointer rounded-2xl p-5"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Settled Revenue</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              ${settledRevenueTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Live Total</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-zinc-800/60 group-hover:text-indigo-300">
            <span>Open Intelligence</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Live Activity Feed Stream */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2.5">
              <Activity className="size-4.5 text-indigo-400" />
              Operational Event Stream
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time audit log of actions emitted by Coasty agents and policy evaluators.
            </p>
          </div>

          <button 
            onClick={onOpenRunWorkflow}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh Stream</span>
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {liveEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono">No operational events recorded yet.</div>
          ) : (
            liveEvents.map((evt) => (
              <div 
                key={evt.id} 
                className="flex items-start justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700/80 hover:bg-zinc-900/70"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`mt-1 size-2.5 rounded-full shrink-0 ${
                    evt.type === 'success' ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' :
                    evt.type === 'warning' ? 'bg-amber-400 shadow-lg shadow-amber-500/50' : 'bg-indigo-400'
                  }`} />
                  <div>
                    <div className="text-xs text-zinc-200 font-semibold leading-relaxed">{evt.message}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono flex items-center gap-2">
                      <span>Event Type: <strong className="text-zinc-300">{evt.type}</strong></span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">{evt.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* How ARISE Operates Section */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="size-4.5 text-indigo-400" />
              How ARISE Operates
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">The 6-stage autonomous resolution loop.</p>
          </div>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
            Pipeline Status: Optimal
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-all hover:border-indigo-500/40 hover:bg-zinc-900/90"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-400 font-mono tracking-wider">{item.step}</span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-zinc-300 font-mono">
                    {item.badge}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-xl border bg-gradient-to-br ${item.accent} group-hover:scale-110 transition-transform`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">{item.subtitle}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
