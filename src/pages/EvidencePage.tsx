import React from 'react';
import type { EvidenceItem } from '../types/arise';
import { FileCheck, ExternalLink, ShieldCheck, HardDrive } from 'lucide-react';

interface EvidencePageProps {
  evidence: EvidenceItem[];
}

export const EvidencePage: React.FC<EvidencePageProps> = ({ evidence }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileCheck className="size-6 text-cyan-400" />
            Evidence Store
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real DOM screenshots, signed receipts, and verification artifacts stored securely in the ARISE evidence vault.
          </p>
        </div>
      </div>

      {evidence.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-zinc-500 font-mono rounded-2xl">
          No evidence artifacts in PostgreSQL database yet. DOM screenshots and audit proof files will be stored automatically when Coasty computer-use runs execute.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {evidence.map((item) => {
            const isImage = item.mimeType?.startsWith('image/') || item.storageUrl.match(/\.(png|jpg|jpeg|webp)$/i);
            const fileSize = item.sizeBytes ? `${(item.sizeBytes / 1024).toFixed(1)} KB` : 'Real Artifact';

            return (
              <div key={item.id} className="rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-cyan-400 font-semibold">
                      ID: {item.externalEvidenceId || item.id.substring(0, 13)}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">Run #{item.runId}</h3>
                  </div>
                  <span className="rounded bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 font-mono font-semibold">
                    {item.type}
                  </span>
                </div>

                <div className="aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 relative group flex items-center justify-center">
                  {isImage ? (
                    <img 
                      src={item.storageUrl} 
                      alt="Evidence visual artifact" 
                      className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <HardDrive className="size-10 text-cyan-400 mx-auto opacity-70" />
                      <p className="text-xs text-zinc-400 font-mono">{item.mimeType || 'Verification Artifact'}</p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={item.storageUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="rounded-md bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                    >
                      <span>Inspect Artifact</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="size-3.5" />
                      SHA-256 Validated
                    </span>
                    <span>{fileSize}</span>
                  </div>
                  <div className="text-zinc-500 truncate">
                    Hash: {item.sha256}
                  </div>
                  <div className="text-zinc-500 text-[10px]">
                    Captured: {new Date(item.capturedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
