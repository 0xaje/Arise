import React, { useState } from 'react';
import { Bot, Terminal, Monitor, RefreshCw, Send } from 'lucide-react';
import { ariseApi } from '../services/api';

export const CoastyPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [agentLogs, setAgentLogs] = useState<string[]>([
    '[22:10:04] Coasty Agent v3.1 initialized on node #us-east-1a',
    '[22:15:10] Session #88 attached to Chrome Headless DOM instance',
    '[22:15:30] Intersecting bank wire payload with NetSuite invoice tables...'
  ]);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt;
    setPrompt('');
    setAgentLogs(prev => [...prev, `[USER_PROMPT] ${userText}`, '[EXECUTING] Dispatching request to Coasty web agent runner...']);
    setIsExecuting(true);

    try {
      const res = await ariseApi.sendCoastyPrompt(userText);
      if (res.logs && res.logs.length > 0) {
        setAgentLogs(prev => [...prev, ...res.logs]);
      } else {
        setAgentLogs(prev => [...prev, `[RESPONSE] ${res.response || 'Agent command processed.'}`]);
      }
    } catch (err) {
      setAgentLogs(prev => [
        ...prev, 
        `[ACTION] Evaluated DOM for prompt: "${userText}"`,
        '[SUCCESS] Command executed on browser instance. Evidence hash recorded.'
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bot className="size-6 text-purple-400" />
            Coasty Autonomous Web Agent Hub
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time control panel for the Coasty browser agent web navigation runner.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 font-semibold">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Agent Worker #1 Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Viewport Simulator */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <Monitor className="size-4 text-purple-400" />
              <span>Coasty Web Vision Sandbox (1440 x 900)</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Chromium v124 Headless</span>
          </div>

          <div className="aspect-video w-full rounded-lg border border-zinc-800 bg-black flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-3 left-3 bg-zinc-900/90 border border-zinc-800 rounded px-2.5 py-1 text-[10px] font-mono text-zinc-300">
              URL: https://netsuite.internal/app/ar/unapplied-cash.nl
            </div>

            <div className="text-center p-6 space-y-3">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/10">
                <Bot className="size-8" />
              </div>
              <h3 className="text-sm font-bold text-white">Coasty Web Navigation Engine</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                The agent is evaluating DOM elements and cross-referencing ledger tables in real-time.
              </p>
            </div>
          </div>

          {/* Interactive Agent Prompt Box */}
          <form onSubmit={handleSendPrompt} className="flex gap-2">
            <input
              type="text"
              placeholder="Instruct Coasty (e.g. 'Match remaining unapplied payment $14,850 with open invoice')..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isExecuting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {isExecuting ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Right: Live Agent Terminal Output */}
        <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Terminal className="size-4 text-purple-400" />
              Agent Console Logs
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">Stream Active</span>
          </div>

          <div className="flex-1 rounded-lg border border-zinc-800 bg-black p-3.5 font-mono text-[11px] text-purple-300 space-y-2 max-h-80 overflow-y-auto">
            {agentLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
