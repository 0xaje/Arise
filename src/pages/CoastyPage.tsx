import React, { useState } from 'react';
import { Bot, Terminal, Monitor, RefreshCw, Send, AlertCircle } from 'lucide-react';
import { ariseApi } from '../services/api';

export const CoastyPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt;
    setPrompt('');
    setError(null);
    setAgentLogs(prev => [...prev, `[USER_PROMPT] ${userText}`, '[EXECUTING] Dispatching request to Coasty web agent runner...']);
    setIsExecuting(true);

    try {
      const res = await ariseApi.sendCoastyPrompt(userText);
      if (res.logs && res.logs.length > 0) {
        setAgentLogs(prev => [...prev, ...res.logs]);
      } else {
        setAgentLogs(prev => [...prev, `[RESPONSE] ${res.response || 'Agent command processed.'}`]);
      }
    } catch (err: any) {
      const msg = err?.message || 'API connection failed';
      setError(msg);
      setAgentLogs(prev => [...prev, `[ERROR] Action failed: ${msg}`]);
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
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Viewport Sandbox */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <Monitor className="size-4 text-purple-400" />
              <span>Coasty Web Vision Sandbox</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Chromium Headless</span>
          </div>

          <div className="aspect-video w-full rounded-lg border border-zinc-800 bg-black flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="text-center p-6 space-y-3">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/10">
                <Bot className="size-8" />
              </div>
              <h3 className="text-sm font-bold text-white">Coasty Web Navigation Engine</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Enter an instruction below to execute real web navigation actions on target systems.
              </p>
            </div>
          </div>

          {/* Interactive Agent Prompt Box */}
          <form onSubmit={handleSendPrompt} className="flex gap-2">
            <input
              type="text"
              placeholder="Instruct Coasty (e.g. 'Match unapplied payment with open ERP invoice')..."
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
          </div>

          <div className="flex-1 rounded-lg border border-zinc-800 bg-black p-3.5 font-mono text-[11px] text-purple-300 space-y-2 max-h-80 overflow-y-auto min-h-[200px]">
            {agentLogs.length === 0 ? (
              <div className="text-zinc-600 text-xs py-8 text-center font-sans">No console logs emitted yet.</div>
            ) : (
              agentLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
