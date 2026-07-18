/**
 * Field Deck claim room — physical QR/?card=CODE → story unlock + set progress.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Compass,
  Copy,
  Layers,
  Share2,
  Sparkles,
} from 'lucide-react';
import {
  HOOK_CYCLE,
  cardClaimUrl,
  claimFieldCard,
  claimedHookCycleIds,
  getFieldCard,
  hasClaimed,
  hookCycleProgress,
  missingHookCycle,
  normalizeCardCode,
  recordTradeIntent,
  type FieldCardId,
} from '../lib/field-deck';
import { track } from '../lib/attention-metrics';
import { markSpreadLove, hasSpreadLove } from '../lib/club-oath';
import { CinematicBackdrop } from './fx';

type Props = {
  initialCode?: string | null;
  username?: string;
  walletAddress?: string;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenAcademy: () => void;
  onOpenMap: () => void;
  /** Soft BCC/energy crumb for first claim of a card */
  onClaimReward?: (opts: { cardId: FieldCardId; setComplete: boolean }) => void;
};

const ART: Record<string, string> = {
  amber: 'from-amber-500/25 via-[#0a0a0c] to-transparent border-amber-400/35',
  cyan: 'from-cyan-500/25 via-[#0a0a0c] to-transparent border-cyan-400/35',
  rose: 'from-rose-500/25 via-[#0a0a0c] to-transparent border-rose-400/35',
};

export default function FieldDeckClaim({
  initialCode,
  username,
  walletAddress,
  addLog,
  onOpenAcademy,
  onOpenMap,
  onClaimReward,
}: Props) {
  const [codeInput, setCodeInput] = useState(initialCode?.toUpperCase() ?? '');
  const [activeId, setActiveId] = useState<FieldCardId | null>(
    () => normalizeCardCode(initialCode)
  );
  const [flash, setFlash] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const bootClaimed = useRef(false);

  const progress = useMemo(() => hookCycleProgress(), [tick]);
  const claimed = useMemo(() => new Set(claimedHookCycleIds()), [tick]);
  const missing = useMemo(() => missingHookCycle(), [tick]);
  const active = activeId ? getFieldCard(activeId) : null;

  useEffect(() => {
    const id = normalizeCardCode(initialCode);
    if (id) {
      setActiveId(id);
      setCodeInput(id);
    }
  }, [initialCode]);

  const doClaim = (raw: string, channel: 'qr' | 'manual' = 'manual') => {
    const by = walletAddress || username || 'operator';
    const result = claimFieldCard(raw, by, channel);
    if (result.ok === false) {
      if (result.reason === 'already') {
        const id = normalizeCardCode(raw);
        if (id) setActiveId(id);
        setFlash('Already in your Field Deck — story stays yours.');
        addLog('FIELD DECK: Card already claimed on this node.', 'info');
      } else {
        setFlash('Unknown code. Check the back of the card (e.g. HOOK-BAIT).');
        addLog('FIELD DECK: Unknown card code.', 'warn');
      }
      setTick((t) => t + 1);
      return;
    }

    setActiveId(result.card.id);
    setFlash(`Claimed · ${result.card.chapter} ${result.card.title}`);
    track('field_card_claim', {
      cardId: result.card.id,
      setId: result.card.setId,
      channel,
      setComplete: result.setComplete,
    });
    addLog(
      `FIELD DECK: Claimed ${result.card.id} — ${result.card.hook}`,
      'success'
    );

    if (walletAddress && !hasSpreadLove(walletAddress)) {
      markSpreadLove(walletAddress);
      track('spread_copy', { channel: 'field_deck', first: true, cardId: result.card.id });
      addLog('SPREAD: First Field Deck claim counts as passing culture on.', 'success');
    }

    onClaimReward?.({ cardId: result.card.id, setComplete: result.setComplete });
    setTick((t) => t + 1);
  };

  useEffect(() => {
    if (bootClaimed.current) return;
    const id = normalizeCardCode(initialCode);
    if (!id) return;
    bootClaimed.current = true;
    if (hasClaimed(id)) {
      setActiveId(id);
      return;
    }
    doClaim(id, 'qr');
  }, [initialCode]);

  const copyLink = async (id: FieldCardId) => {
    const url = cardClaimUrl(id);
    try {
      await navigator.clipboard?.writeText(url);
      addLog(`FIELD DECK: Claim link copied — ${id}`, 'success');
      track('spread_copy', { channel: 'field_deck_link', cardId: id });
      if (walletAddress) markSpreadLove(walletAddress);
    } catch {
      addLog('FIELD DECK: Could not copy link.', 'warn');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-[#08060a] p-5 md:p-7">
        <div className="absolute inset-0 opacity-70 pointer-events-none">
          <CinematicBackdrop variant="ritual" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-mono font-black tracking-[0.28em] uppercase text-amber-400">
            Field Deck · Hook Cycle
          </p>
          <h2 className="mt-1 font-display text-2xl md:text-3xl font-extrabold italic text-white">
            Hunt the story. Pass it on.
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl leading-relaxed">
            Physical cards unlock chapters here — knowledge first, never a paywall for First Spark.
            Trade the missing beat with a human.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs text-slate-300">
                {progress.have}/{progress.total} Hook Cycle
              </span>
            </div>
            {progress.complete && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300 border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <Check className="w-3 h-3" /> Set complete
              </span>
            )}
          </div>
        </div>
      </div>

      {flash && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-mono text-cyan-200/90 border border-cyan-400/25 bg-cyan-500/10 rounded-xl px-3 py-2"
        >
          {flash}
        </motion.p>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#0a0a0c] p-4 md:p-5">
        <label className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block mb-2">
          Card code (from the back)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="HOOK-BAIT"
            className="flex-1 rounded-xl bg-black/50 border border-white/10 px-3 py-2.5 font-mono text-sm text-white uppercase tracking-wider"
          />
          <button
            type="button"
            onClick={() => doClaim(codeInput, 'manual')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            Claim chapter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {HOOK_CYCLE.map((card) => {
          const mine = claimed.has(card.id);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveId(card.id)}
              className={`text-left rounded-2xl border p-3.5 transition-all cursor-pointer ${
                activeId === card.id
                  ? 'border-cyan-400/45 bg-cyan-500/10'
                  : mine
                    ? 'border-emerald-500/25 bg-emerald-500/5'
                    : 'border-white/8 bg-white/[0.02] opacity-80'
              }`}
            >
              <span className="text-[9px] font-mono text-slate-500 tracking-wider">
                CH {card.chapter}
              </span>
              <p className="text-sm font-bold text-white mt-0.5">{card.title}</p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{card.hook}</p>
              <span
                className={`mt-2 inline-block text-[9px] font-mono uppercase tracking-wider ${
                  mine ? 'text-emerald-400' : 'text-slate-600'
                }`}
              >
                {mine ? 'Claimed' : 'Missing'}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <motion.article
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 md:p-6 ${ART[active.artHint]}`}
        >
          <p className="text-[10px] font-mono tracking-[0.22em] uppercase text-slate-400">
            Chapter {active.chapter} · {active.id}
          </p>
          <h3 className="mt-1 font-display text-xl font-extrabold italic text-white">
            {active.title}
          </h3>
          <p className="mt-1 text-sm font-semibold text-amber-100/90">{active.hook}</p>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed font-sans">{active.story}</p>
          <p className="mt-3 text-[12px] text-cyan-200/90 border-l-2 border-cyan-400/40 pl-3">
            Next: {active.nextAsk}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {!claimed.has(active.id) && (
              <button
                type="button"
                onClick={() => doClaim(active.id, 'manual')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Claim this chapter
              </button>
            )}
            <button
              type="button"
              onClick={() => void copyLink(active.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 text-slate-300 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy claim link
            </button>
            {claimed.has(active.id) && (
              <button
                type="button"
                onClick={() => {
                  recordTradeIntent(active.id, 'irl');
                  track('field_card_trade_intent', { cardId: active.id });
                  addLog(
                    'FIELD DECK: Trade intent logged — pass the physical card, both scan when ready (Phase 2).',
                    'info'
                  );
                  setFlash('Trade mode: pass the physical card. Both win when they claim missing chapters.');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-400/35 bg-rose-500/10 text-rose-100 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Mark for trade
              </button>
            )}
          </div>
        </motion.article>
      )}

      {progress.complete ? (
        <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
              Hook Cycle complete
            </p>
            <p className="text-sm text-emerald-50 mt-1 font-semibold">
              You hold Bait · Notice · Why you stay. Bring it into Hook Mirror.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAcademy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            Open Academy
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        missing.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0c] p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
              Still hunting
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Missing:{' '}
              <span className="text-amber-200 font-mono">
                {missing.map((m) => m.id).join(' · ')}
              </span>
              . Trade IRL or find the next plant — both of you win when the set fills.
            </p>
            <button
              type="button"
              onClick={onOpenMap}
              className="mt-3 text-[10px] font-mono uppercase tracking-wider text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              Back to your node →
            </button>
          </div>
        )
      )}
    </div>
  );
}
