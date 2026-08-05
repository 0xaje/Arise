import React, { useState } from 'react';
import { Settings, Shield, Sliders, Bell, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [autoLimit, setAutoLimit] = useState(25000);
  const [confidenceThreshold, setConfidenceThreshold] = useState(90);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="size-6 text-zinc-400" />
            System & Risk Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Configure risk tolerance thresholds, auto-approval financial limits, and alert triggers.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
        >
          {saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
          <span>{saved ? 'Settings Saved!' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sliders className="size-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Autonomous Authority Thresholds</h3>
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 font-medium mb-1.5">
              <span>Maximum Auto-Approval Amount</span>
              <span className="font-bold text-blue-400">${autoLimit.toLocaleString()} USD</span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={autoLimit}
              onChange={(e) => setAutoLimit(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Transactions exceeding ${autoLimit.toLocaleString()} will require explicit human approval.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-300 font-medium mb-1.5">
              <span>Minimum AI Confidence Threshold</span>
              <span className="font-bold text-emerald-400">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="70"
              max="99"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Matches below {confidenceThreshold}% confidence will be routed to the Exception Queue.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Bell className="size-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Notifications & Webhooks</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 cursor-pointer">
              <span className="text-zinc-200 font-medium">Slack Alert on High-Risk Escalations</span>
              <input type="checkbox" defaultChecked className="size-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 cursor-pointer">
              <span className="text-zinc-200 font-medium">Email Summary of Daily Resolved Exceptions</span>
              <input type="checkbox" defaultChecked className="size-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0" />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 cursor-pointer">
              <span className="text-zinc-200 font-medium">Auto-trigger Coasty agent on Webhook Reception</span>
              <input type="checkbox" defaultChecked className="size-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
