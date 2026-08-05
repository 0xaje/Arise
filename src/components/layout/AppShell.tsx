import React, { useState } from 'react';
import type { RouteId } from '../../types/arise';
import { 
  LayoutDashboard, 
  AlertCircle, 
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
  Zap
} from 'lucide-react';

interface AppShellProps {
  currentRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  onOpenCreateWorkflow: () => void;
  onOpenRunWorkflow: () => void;
  onOpenReviewConnections: () => void;
  isBackendConnected: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  onOpenCreateWorkflow,
  onOpenRunWorkflow,
  onOpenReviewConnections,
  isBackendConnected,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navGroups = [
    {
      title: 'Revenue operations',
      items: [
        { id: '/' as RouteId, label: 'Command center', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: '/exceptions' as RouteId, label: 'Exception Queue', icon: AlertCircle, badge: '5' },
        { id: '/workflows' as RouteId, label: 'Workflows', icon: Workflow },
        { id: '/runs' as RouteId, label: 'Runs', icon: PlayCircle },
        { id: '/approvals' as RouteId, label: 'Approvals', icon: CheckSquare, badge: '2' }
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: '/reports' as RouteId, label: 'Reports', icon: BarChart3 },
        { id: '/audit' as RouteId, label: 'Audit Trail', icon: ShieldCheck },
        { id: '/evidence' as RouteId, label: 'Evidence', icon: FileCheck }
      ]
    },
    {
      title: 'Infrastructure',
      items: [
        { id: '/connections' as RouteId, label: 'Connections', icon: Network },
        { id: '/coasty' as RouteId, label: 'Coasty', icon: Bot },
        { id: '/settings' as RouteId, label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 antialiased select-none">
      
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800/80 bg-[#0c0c0e] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800/80 px-5">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { onNavigate('/'); setMobileMenuOpen(false); }}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Zap className="size-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-wider text-white">ARISE</span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">v2.4</span>
              </div>
              <p className="text-[11px] font-medium text-zinc-400">Autonomous Revenue Engine</p>
            </div>
          </div>

          <button 
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Workspace Pill */}
        <div className="px-4 py-3 border-b border-zinc-800/40 bg-zinc-900/40">
          <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-zinc-200 truncate">Production Workspace</span>
            </div>
            <span className="text-[10px] text-zinc-400 uppercase font-mono">AR Ops</span>
          </div>
        </div>

        {/* Nav Link Groups */}
        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h2 className="px-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                {group.title}
              </h2>
              <div className="mt-1 space-y-0.5">
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
                        w-full flex items-center justify-between rounded-md px-2.5 py-2 text-sm font-medium transition-colors text-left
                        ${isActive 
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm' 
                          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'}
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`size-4 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`
                          rounded-full px-2 py-0.5 text-[10px] font-semibold
                          ${isActive ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-300'}
                        `}>
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

        {/* Coasty Agent Footer Widget */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/60">
          <div 
            onClick={() => { onNavigate('/coasty'); setMobileMenuOpen(false); }}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/90 p-2.5 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="flex size-8 items-center justify-center rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                  <Bot className="size-4.5" />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-zinc-900 ${isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-zinc-200">Coasty Agent</div>
                <div className="text-[10px] text-zinc-400">
                  {isBackendConnected ? 'Active • Session #88' : 'Offline • Ready to connect'}
                </div>
              </div>
            </div>
            <ChevronRight className="size-4 text-zinc-500" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-[#09090b]/90 px-4 md:px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="grid size-9 place-items-center rounded-md border border-zinc-800 text-zinc-400 hover:text-white lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div>
              <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Finance Operations Command Center
              </h1>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Autonomous Revenue Intelligence & Settlement Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenCreateWorkflow}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Plus className="size-3.5 text-zinc-400" />
              <span>Create Workflow</span>
            </button>

            <button
              onClick={onOpenRunWorkflow}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 transition-colors"
            >
              <PlayCircle className="size-3.5" />
              <span>Run Workflow</span>
            </button>
          </div>
        </header>

        {/* Backend Connection Alert Banner */}
        {!isBackendConnected && (
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200/90">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-amber-400" />
              <span>
                <strong className="font-semibold text-amber-300">Backend not connected:</strong> ARISE live execution engine endpoint is running in simulation mode.
              </span>
            </div>
            <button
              onClick={onOpenReviewConnections}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 shrink-0 ml-2"
            >
              <span>Configure Connections</span>
              <ExternalLink className="size-3" />
            </button>
          </div>
        )}

        {/* Dynamic Page View */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#09090b]">
          {children}
        </main>
      </div>

    </div>
  );
};
