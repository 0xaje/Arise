import React from 'react';
import { RouteId, LiveActivityEvent, ExceptionCase } from '../types/arise';
import { 
  Zap, 
  Activity, 
  Search, 
  Scale, 
  Cpu, 
  CheckCircle2, 
  FileCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  CheckSquare, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw,
  ExternalLink
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
  onOpenReviewConnections,
  liveEvents,
  exceptions,
  isBackendConnected
}) => {
  const steps = [
    {
      step: '01',
      title: 'Investigate',
      description: 'Coasty opens the connected application and locates the case.',
      icon: Search,
      color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30'
    },
    {
      step: '02',
      title: 'Cross-check',
      description: 'The agent verifies against a second real system of record.',
      icon: Scale,
      color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30'
    },
    {
      step: '03',
      title: 'Reason',
      description: 'ARISE evaluates the exception against workflow policy.',
      icon: Cpu,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30'
    },
    {
      step: '04',
      title: 'Resolve',
      description: 'The agent performs the authorized action in the real application.',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30'
    },
    {
      step: '05',
      title: 'Verify',
      description: 'The business outcome is confirmed and evidence is captured.',
      icon: FileCheck,
      color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30'
    },
    {
      step: '06',
      title: 'Escalate',
      description: 'Anything beyond configured authority goes to human approval.',
      icon: AlertTriangle,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Finance Operations Command Center
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Monitor autonomous exception resolution, approvals, failures, and business outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateWorkflow}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Create Workflow
          </button>
          <button
            onClick={onOpenRunWorkflow}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 transition-colors"
          >
            Run Workflow
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div 
          onClick={() => onNavigate('/exceptions')}
          className="group cursor-pointer rounded-xl border border-zinc-800 bg-[#111114] p-5 transition-all hover:border-zinc-700 hover:bg-[#151519]"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Exceptions</span>
            <AlertTriangle className="size-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{exceptions.filter(e => e.status !== 'Resolved').length}</span>
            <span className="text-xs text-amber-400 font-medium">Requires action</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-zinc-400 group-hover:text-blue-400">
            <span>View Exception Queue</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('/workflows')}
          className="group cursor-pointer rounded-xl border border-zinc-800 bg-[#111114] p-5 transition-all hover:border-zinc-700 hover:bg-[#151519]"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Autonomous Accuracy</span>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">98.4%</span>
            <span className="text-xs text-emerald-400 font-medium">+1.2% this week</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-zinc-400 group-hover:text-blue-400">
            <span>Inspect Active Workflows</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('/approvals')}
          className="group cursor-pointer rounded-xl border border-zinc-800 bg-[#111114] p-5 transition-all hover:border-zinc-700 hover:bg-[#151519]"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Human Escalations</span>
            <CheckSquare className="size-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">2</span>
            <span className="text-xs text-purple-400 font-medium">Pending Review</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-zinc-400 group-hover:text-blue-400">
            <span>Open Approvals</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('/reports')}
          className="group cursor-pointer rounded-xl border border-zinc-800 bg-[#111114] p-5 transition-all hover:border-zinc-700 hover:bg-[#151519]"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Value Settled</span>
            <Zap className="size-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">$1.42M</span>
            <span className="text-xs text-blue-400 font-medium">This month</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-zinc-400 group-hover:text-blue-400">
            <span>View Intelligence Reports</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Live Activity Stream Section */}
      <div className="rounded-xl border border-zinc-800 bg-[#111114] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="size-4 text-blue-400" />
              Live Activity Feed
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Operational events emitted by ARISE and Coasty execution loops.
            </p>
          </div>

          <button 
            onClick={onOpenRunWorkflow}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            <RefreshCw className="size-3" />
            <span>Refresh Feed</span>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {liveEvents.map((evt) => (
            <div 
              key={evt.id} 
              className="flex items-start justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-3.5 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 size-2 rounded-full shrink-0 ${
                  evt.type === 'success' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' :
                  evt.type === 'warning' ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-blue-500'
                }`} />
                <div>
                  <div className="text-xs text-zinc-200 font-medium">{evt.message}</div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">Emitter: {evt.source}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{evt.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How ARISE Operates Section */}
      <div className="rounded-xl border border-zinc-800 bg-[#111114] p-6 shadow-sm">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-base font-semibold text-white">How ARISE operates</h2>
          <p className="text-xs text-zinc-400 mt-0.5">The autonomous resolution loop.</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/80"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 font-mono tracking-wider">{item.step}</span>
                  <div className={`flex size-9 items-center justify-center rounded-lg border bg-gradient-to-br ${item.color}`}>
                    <Icon className="size-4.5" />
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
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
