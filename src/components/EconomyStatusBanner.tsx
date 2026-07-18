/**
 * Plain-language practice vs on-chain mode for first-timers.
 * Operator bootstrap details stay collapsed.
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export interface EconomyStatus {
  ready: boolean;
  configured?: boolean;
  hasAuthority?: boolean;
  programId: string;
  bccMint: string | null;
  cgtMint: string | null;
  reasons?: string[];
  bootstrapHint?: string;
}

interface EconomyStatusBannerProps {
  status: EconomyStatus | null;
  loading?: boolean;
  /** Keep members in the fuel loop while settlement is off */
  onContinueAcademy?: () => void;
}

export default function EconomyStatusBanner({
  status,
  loading,
  onContinueAcademy,
}: EconomyStatusBannerProps) {
  const [showOps, setShowOps] = useState(false);

  if (loading || !status) return null;

  if (status.ready) {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 flex flex-wrap items-center gap-2 text-[11px]">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-mono font-bold uppercase tracking-wider text-emerald-200">
          On-chain mode
        </span>
        <span className="text-slate-400 font-sans text-xs">
          Academy passes and miners settle on Solana Devnet.
        </span>
        <a
          href={`https://solscan.io/account/${status.programId}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 ml-auto font-mono text-[10px]"
        >
          Program <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-200">
                Practice mode
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                Progress stays in this browser until on-chain settlement is enabled. Dashboard /
                wheel / NFT loops are practice — Academy fuel still works here.
              </p>
            </div>
            {onContinueAcademy && (
              <button
                type="button"
                onClick={onContinueAcademy}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer shrink-0"
              >
                Continue Academy →
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowOps((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-amber-300 cursor-pointer"
          >
            Operator details
            {showOps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showOps && (
            <div className="mt-2 space-y-1">
              {(status.reasons || []).length > 0 && (
                <ul className="text-[10px] font-mono text-amber-100/70 space-y-0.5 list-disc list-inside">
                  {status.reasons!.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
              {status.bootstrapHint && (
                <p className="text-[10px] font-mono text-slate-600 break-all">{status.bootstrapHint}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
