import React from 'react';
import { EvidenceItem } from '../types/arise';
import { FileCheck, Download, ExternalLink, Image, FileText } from 'lucide-react';

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
            Captured DOM screenshots, signed PDF receipts, and verification payloads collected by Coasty.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {evidence.map((item) => (
          <div key={item.id} className="rounded-xl border border-zinc-800 bg-[#111114] p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-blue-400">{item.evidenceCode}</span>
                <h3 className="text-base font-bold text-white mt-1">Case #{item.caseNumber} Evidence</h3>
              </div>
              <span className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 font-mono">{item.type}</span>
            </div>

            <div className="aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 relative group">
              <img 
                src={item.url} 
                alt="Evidence visual" 
                className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5"
                >
                  <span>View Full Artifact</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
              <span>Verified by: <strong className="text-zinc-200">{item.verifiedBy}</strong></span>
              <span className="font-mono">{item.fileSize}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
