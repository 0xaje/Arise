import React, { useState } from 'react';
import type { RouteId } from '../../types/arise';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Workflow, 
  PlayCircle, 
  CheckSquare, 
  BarChart3, 
  ShieldCheck, 
  FileCheck, 
  Network, 
  Bot, 
  Settings, 
  Plus, 
  Menu, 
  X, 
  ChevronRight, 
  ExternalLink,
  Zap,
  Search,
  Bell,
  Sparkles,
  Shield,
  Activity
} from 'lucide-react';

interface AppShellProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  onOpenCreateWorkflow: () => void;
  onOpenRunWorkflow: () => void;
  onOpenReviewConnections: () => void;
  isBackendConnected: boolean;
  pendingExceptionsCount?: number;
  pendingApprovalsCount?: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  onOpenCreateWorkflow,
  onOpenRunWorkflow,
  onOpenReviewConnections,
  isBackendConnected,
  pendingExceptionsCount = 0,
  pendingApprovalsCount = 0,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const navGroups = [
    {
      title: 'Revenue Operations',
      items: [
        { id: '/' as RouteId, label: 'Command Center', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Operations Loop',
      items: [
        { 
          id: '/exceptions' as RouteId, 
          label: 'Exception Queue', 
          icon: AlertTriangle, 
          badge: pendingExceptionsCount > 0 ? String(pendingExceptionsCount) : undefined, 
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
        },
        { id: '/workflows' as RouteId, label: 'Workflows', icon: Workflow },
        { id: '/runs' as RouteId, label: 'Execution Runs', icon: PlayCircle },
        { 
          id: '/approvals' as RouteId, 
          label: 'Human Approvals', 
          icon: CheckSquare, 
          badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined, 
          badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
        }
      ]
    },
    {
      title: 'Revenue Intelligence',
      items: [
        { id: '/reports' as RouteId, label: 'Intelligence Reports', icon: BarChart3 },
        { id: '/audit' as RouteId, label: 'Audit Trail', icon: ShieldCheck },
        { id: '/evidence' as RouteId, label: 'Evidence Store', icon: FileCheck }
      ]
    },
    {
      title: 'Infrastructure & Control',
      items: [
        { id: '/connections' as RouteId, label: 'Connections', icon: Network },
        { id: '/coasty' as RouteId, label: 'Coasty Agent', icon: Bot },
        { id: '/settings' as RouteId, label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070709] text-zinc-100 antialiased select-none bg-ambient-glow">
      
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-zinc-800/60 bg-[#0b0b0e]/95 backdrop-blur-xl transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) lg:static lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800/60 px-5">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { onNavigate('/'); setMobileMenuOpen(false); }}
          >
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-500 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <Zap className="size-5 text-white" />
              <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-[#0b0b0e] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white font-mono">ARISE</span>
                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/30">
                  PRO v2.4
                </span>
              </div>
              <p className="text-[11px] font-medium text-zinc-400">Revenue Settlement Engine</p>
            </div>
          </div>

          <button 
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Workspace Pill Card */}
        <div className="px-4 py-3.5 border-b border-zinc-800/40 bg-zinc-900/30">
          <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-[#121217] px-3 py-2 text-xs shadow-inner">
            <div className="flex items-center gap-2 truncate">
              <div className="flex size-6 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
                <Shield className="size-3.5" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-zinc-200 truncate text-[11px]">Production Workspace</div>
                <div className="text-[9px] text-zinc-400 font-mono">AR Ops • Tier 1</div>
              </div>
            </div>
            <Sparkles className="size-3.5 text-indigo-400 shrink-0" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <h2 className="px-2.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono">
                {group.title}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentRoute === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 text-left relative group
                        ${isActive 
                          ? 'bg-gradient-to-r from-indigo-600/20 to-blue-600/10 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-500/10' 
                          : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`size-4 transition-colors ${isActive ? 'text-indigo-400 scale-110' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Coasty Agent Footer */}
        <div className="p-3.5 border-t border-zinc-800/60 bg-[#0d0d11]">
          <div 
            onClick={() => { onNavigate('/coasty'); setMobileMenuOpen(false); }}
            className="group flex items-center justify-between rounded-xl border border-zinc-800/90 bg-[#121217] p-3 cursor-pointer hover:border-indigo-500/50 hover:bg-[#16161d] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 group-hover:scale-105 transition-transform">
                  <Bot className="size-5" />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#121217] ${isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">Coasty Web Agent</div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {isBackendConnected ? 'Session Active' : 'Backend Disconnected'}
                </div>
              </div>
            </div>
            <ChevronRight className="size-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Header Navigation */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/60 bg-[#070709]/90 px-4 md:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="grid size-9 place-items-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            {/* Global Quick Search Bar */}
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-2.5 size-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Quick search cases, runs, workflows..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-800/90 bg-zinc-900/60 pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Environment Tag */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">LIVE CLUSTER</span>
            </div>

            {/* Notifications Bell */}
            <button 
              onClick={() => onNavigate('/approvals')}
              className="relative grid size-9 place-items-center rounded-lg border border-zinc-800/90 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-purple-500" />
            </button>

            {/* Action Triggers */}
            <button
              onClick={onOpenCreateWorkflow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Plus className="size-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Create Workflow</span>
            </button>

            <button
              onClick={onOpenRunWorkflow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              <PlayCircle className="size-3.5" />
              <span>Run Engine</span>
            </button>
          </div>
        </header>

        {/* Backend Connection Status Banner */}
        {!isBackendConnected && (
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent px-4 md:px-6 py-2.5 text-xs text-amber-200/90">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-amber-400" />
              <span>
                <strong className="font-semibold text-amber-300">Backend Status:</strong> ARISE execution engine is running in standalone local environment.
              </span>
            </div>
            <button
              onClick={onOpenReviewConnections}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 shrink-0 ml-2"
            >
              <span>Configure Connections</span>
              <ExternalLink className="size-3" />
            </button>
          </div>
        )}

        {/* Main Workspace */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
};
