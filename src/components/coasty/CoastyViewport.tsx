import React, { useState, useEffect } from 'react';
import { Monitor, Cpu, Eye, CheckCircle2, ShieldCheck, Play, Pause, RefreshCw, AlertTriangle, Sparkles, Terminal } from 'lucide-react';

interface CoastyViewportProps {
  onLaunchDemo?: () => void;
}

const DEMO_STAGES = [
  { step: 1, stage: 'Stage 01: Initializing Coasty Machine ember-orbit', action: 'POST /v1/runs target=http://localhost:8000/app', log: '[00:01] COASTY_MACHINE_INIT: Connected to ember-orbit (c0380719-b0cf-4e99-ac83-4bbf55ff3932)' },
  { step: 5, stage: 'Stage 02: Launching Headless Browser Session', action: 'Browser initialized (Viewport 1920x1080, CUA v3)', log: '[00:03] BROWSER_START: Chromium instance booted on Coasty runner' },
  { step: 10, stage: 'Stage 03: Navigating to Enterprise Accounting Portal', action: 'GET http://localhost:8000/app HTTP/1.1', log: '[00:05] HTTP_NAVIGATE: Loaded Enterprise Accounting & Ledger System' },
  { step: 18, stage: 'Stage 04: Inspecting Unapplied Cash Wire Feed', action: 'Visual OCR Scanning Wire PAY-WIRE-99210 ($14,850.00 USD)', log: '[00:08] VISION_OCR: Extracted PAY-WIRE-99210, customer Globex Corporation' },
  { step: 26, stage: 'Stage 05: Reading Remittance PDF Advice', action: 'Cross-referencing REM-WIRE-8812 against invoice INV-2026-8812', log: '[00:11] REMITTANCE_MATCH: Matched wire reference REM-WIRE-8812 to invoice INV-2026-8812' },
  { step: 35, stage: 'Stage 06: Multi-ERP Ledger Line Item Verification', action: 'Verifying customer ledger account ACC-9901 outstanding balance', log: '[00:14] DUAL_VERIFY: Verified $14,850.00 balance on NetSuite & internal ledger' },
  { step: 45, stage: 'Stage 07: Policy & Governance Risk Scoring', action: 'Calculating risk score: 0.85 (High Confidence Match)', log: '[00:17] RISK_EVALUATOR: Risk score 0.85 calculated. Threshold gate check in progress...' },
  { step: 55, stage: 'Stage 08: Enforcing $10,000 Safety Governance Pause', action: 'HALTED at $14,850.00 USD > $10,000 Threshold. Awaiting CFO Approval.', log: '[00:20] GOVERNANCE_PAUSE: Execution halted at Step 55. Approval request APP-9901 emitted.' },
  { step: 62, stage: 'Stage 09: Executing Ledger Settlement Postings', action: 'CFO Approval Received. Posting $14,850.00 credit to Globex Corp.', log: '[00:23] LEDGER_POST: Wire PAY-WIRE-99210 applied to INV-2026-8812. Balance $0.00.' },
  { step: 68, stage: 'Stage 10: Generating Cryptographic SOX Audit Certificate', action: 'Sealing 68 visual steps with SHA-256 hashes (Bundle e3b0c442...)', log: '[00:26] SOX_SEAL: Immutable Compliance Certificate generated cleanly!' },
];

export const CoastyViewport: React.FC<CoastyViewportProps> = ({ onLaunchDemo }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(68);
  const [activeStageIdx, setActiveStageIdx] = useState(DEMO_STAGES.length - 1);
  const [logs, setLogs] = useState<string[]>([
    '[00:01] COASTY_MACHINE_INIT: Connected to ember-orbit (c0380719-b0cf-4e99-ac83-4bbf55ff3932)',
    '[00:08] VISION_OCR: Extracted PAY-WIRE-99210, customer Globex Corporation',
    '[00:20] GOVERNANCE_PAUSE: Execution halted at Step 55. Approval request APP-9901 emitted.',
    '[00:26] SOX_SEAL: 68 Visual Steps Completed & Cryptographically Verified!'
  ]);

  // Live Step Execution Engine
  useEffect(() => {
    let timer: any = null;

    if (isRunning) {
      setCurrentStep(1);
      setActiveStageIdx(0);
      setLogs(['[00:00] ARISE_DEMO: Starting 68-Step Live Visual Computer-Use Demo...']);

      let stageIndex = 0;
      let stepCount = 1;

      timer = setInterval(() => {
        stepCount += 3;
        if (stepCount > 68) stepCount = 68;
        setCurrentStep(stepCount);

        // Advance stage
        const nextStageIdx = DEMO_STAGES.findIndex(s => s.step >= stepCount);
        if (nextStageIdx !== -1 && nextStageIdx !== stageIndex) {
          stageIndex = nextStageIdx;
          setActiveStageIdx(nextStageIdx);
          const stageLog = DEMO_STAGES[nextStageIdx].log;
          setLogs(prev => [...prev.slice(-3), stageLog]);
        }

        if (stepCount >= 68) {
          setIsRunning(false);
          clearInterval(timer);
        }
      }, 700);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning]);

  const currentStageObj = DEMO_STAGES[activeStageIdx] || DEMO_STAGES[DEMO_STAGES.length - 1];

  const handleStartRun = () => {
    setIsRunning(true);
    if (onLaunchDemo) onLaunchDemo();
  };

  const handleResetRun = () => {
    setIsRunning(false);
    setCurrentStep(68);
    setActiveStageIdx(DEMO_STAGES.length - 1);
  };

  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-indigo-500/40 bg-[#0a0a12] shadow-2xl space-y-0">
      {/* Viewport Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-amber-500/80" />
            <div className="size-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2 border-l border-zinc-800 pl-3">
            <Monitor className="size-4 text-indigo-400" />
            Coasty Node: <code className="text-indigo-300">ember-orbit (c0380719)</code>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[10px] font-extrabold text-emerald-400 font-mono">
            <Eye className="size-3" />
            100% Visual Computer Use
          </span>

          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold font-mono border ${
            isRunning 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          }`}>
            <Cpu className="size-3" />
            Step {currentStep} / 75
          </span>
        </div>
      </div>

      {/* Screen Monitor Canvas */}
      <div className="relative aspect-video w-full overflow-hidden bg-black flex flex-col items-center justify-center p-6 text-center group">
        {/* Target Embedded Accounting Portal Frame */}
        <iframe
          src="/app"
          title="Enterprise Accounting Target App"
          className="absolute inset-0 size-full border-none opacity-40 pointer-events-none scale-105"
        />

        {/* Live Visual Computer Use Overlay Frame */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/80 to-indigo-950/40 pointer-events-none" />

        {/* Simulated Coasty Vision Cursor Reticle */}
        <div className={`absolute z-20 transition-all duration-500 ${
          isRunning 
            ? 'top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-110' 
            : 'top-1/4 left-1/3'
        }`}>
          <div className="relative flex items-center justify-center">
            <div className="size-16 rounded-xl border-2 border-indigo-400/80 bg-indigo-500/20 backdrop-blur-xs shadow-lg shadow-indigo-500/40 animate-pulse flex items-center justify-center">
              <Sparkles className="size-6 text-indigo-300" />
            </div>
            <span className="absolute -bottom-6 whitespace-nowrap text-[10px] font-mono font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded shadow">
              [COASTY VISION TARGETING]
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-xl shadow-indigo-500/20">
            <ShieldCheck className="size-7" />
          </div>

          <div>
            <span className={`text-[11px] font-mono uppercase tracking-wider font-extrabold px-3.5 py-1 rounded-full border ${
              isRunning 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              {isRunning ? '▶ Live Visual Computer-Use Running' : '✓ 68-Step Business Outcome Resolved'}
            </span>
            <h3 className="text-xl font-extrabold text-white mt-2.5">
              Enterprise Accounting & Ledger Management
            </h3>
            <p className="text-xs font-mono text-zinc-300 mt-1">
              Target System: <code className="text-indigo-300 font-bold">http://localhost:8000/app</code>
            </p>
          </div>

          {/* Active Action Display */}
          <div className="rounded-xl border border-indigo-500/30 bg-zinc-900/90 p-3.5 text-xs text-zinc-300 font-mono space-y-1 text-left shadow-lg">
            <div className="flex items-center justify-between text-zinc-400 text-[10px] border-b border-zinc-800 pb-1.5">
              <span>ACTIVE STAGE EXECUTION</span>
              <span className="text-indigo-400 font-bold">Step {currentStep} of 75</span>
            </div>
            <div className="text-emerald-300 font-bold truncate pt-0.5">{currentStageObj.stage}</div>
            <div className="text-zinc-400 text-[11px] truncate">{currentStageObj.action}</div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {!isRunning ? (
              <button
                onClick={handleStartRun}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-xl shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-105 cursor-pointer"
              >
                <Play className="size-4 fill-white" />
                <span>Launch 68-Step Live Demo Execution</span>
              </button>
            ) : (
              <button
                onClick={handleResetRun}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="size-3.5 animate-spin" />
                <span>Reset Viewport</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Terminal Log Ticker at Viewport Bottom */}
        <div className="absolute bottom-0 inset-x-0 bg-zinc-950/95 border-t border-zinc-800 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-300">
          <div className="flex items-center gap-2 truncate max-w-xl">
            <Terminal className="size-3.5 text-indigo-400 shrink-0" />
            <span className="text-emerald-400 font-bold truncate">
              {logs[logs.length - 1] || '[00:00] ARISE_SYSTEM: Ready'}
            </span>
          </div>
          <span className="shrink-0 text-zinc-400 text-[10px] hidden sm:inline">
            Verification: <strong className="text-emerald-400">100% VERIFIED</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
