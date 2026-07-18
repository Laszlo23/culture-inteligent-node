/**
 * Operator attention metrics — 7d snapshot for angels / partners / self.
 */

import React, { useEffect, useState } from 'react';
import { X, Copy, Download, Activity } from 'lucide-react';
import {
  buildAttentionSnapshot,
  exportAttentionJson,
  formatWeeklySnapshot,
  subscribeAttentionMetrics,
  type AttentionSnapshot,
} from '../lib/attention-metrics';

interface AttentionMetricsPanelProps {
  open: boolean;
  onClose: () => void;
  onCopyLog?: (message: string) => void;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/35 px-3 py-2.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}

export default function AttentionMetricsPanel({
  open,
  onClose,
  onCopyLog,
}: AttentionMetricsPanelProps) {
  const [snap, setSnap] = useState<AttentionSnapshot>(() => buildAttentionSnapshot(7));

  useEffect(() => {
    if (!open) return;
    setSnap(buildAttentionSnapshot(7));
    return subscribeAttentionMetrics(() => setSnap(buildAttentionSnapshot(7)));
  }, [open]);

  if (!open) return null;

  const copyWeekly = async () => {
    const text = formatWeeklySnapshot(snap);
    try {
      await navigator.clipboard?.writeText(text);
      onCopyLog?.('METRICS: Weekly snapshot copied.');
    } catch {
      onCopyLog?.('METRICS: Could not copy snapshot.');
    }
  };

  const exportJson = async () => {
    const json = exportAttentionJson();
    try {
      await navigator.clipboard?.writeText(json);
      onCopyLog?.('METRICS: Full JSON export copied.');
    } catch {
      onCopyLog?.('METRICS: Could not export JSON.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-label="Attention metrics"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-cyan-500/25 bg-[#0a0a0c]/95 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-cyan-400">
                Attention metrics · 7d
              </p>
              <p className="text-xs text-slate-400">Local only — this browser</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white cursor-pointer"
            aria-label="Close metrics"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2">
          <Stat label="Active days" value={snap.uniqueDaysActive} />
          <Stat label="Focus minutes" value={snap.focusMinutesApprox} />
          <Stat label="Hearing opens" value={snap.hearingOpens} />
          <Stat label="Hearing cmds" value={snap.hearingCommands} />
          <Stat label="Academy starts" value={snap.academyStarts} />
          <Stat label="Zen Mind / Machine" value={`${snap.zenMind} / ${snap.zenMachine}`} />
          <Stat label="First Spark" value={snap.firstSparkCompletes} />
          <Stat label="Sessions done" value={snap.sessionCompletes} />
          <Stat label="Snap pass/fail" value={`${snap.neuralSnapPasses}/${snap.neuralSnapFails}`} />
          <Stat label="Hook Mirrors" value={snap.hookMirrors} />
          <Stat label="Field Deck claims" value={snap.fieldCardClaims} />
          <Stat label="Card trade intents" value={snap.fieldCardTradeIntents} />
          <Stat label="Spreads" value={snap.spreads} />
          <Stat label="Broadcast shares" value={snap.broadcastShares} />
          <Stat label="Events (7d)" value={snap.eventsLast7d} />
        </div>

        <div className="px-4 pb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyWeekly()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copy weekly
          </button>
          <button
            type="button"
            onClick={() => void exportJson()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer hover:border-white/30"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}
