/**
 * Growth loop — Discover → Spark → Build → Share → Reputation + live connections.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Network, RefreshCw, Share2, Sparkles, Users } from 'lucide-react';
import {
  buildLocalLoopProgress,
  fetchGrowthPulse,
  fetchMyGrowthStats,
  inviteCodeFromWallet,
  type GrowthMemberStats,
  type GrowthPulse,
  type LocalLoopProgress,
} from '../lib/growth-loop';
import { buildCommunityInviteCast } from '../lib/community-invite';
import FarcasterCastButton from './FarcasterCastButton';
import MakeItRainDeck from './MakeItRainDeck';
import InteractiveDeck from './fx/InteractiveDeck';
import { JOURNEY_DECK } from '../lib/decks';
import { subscribeAttentionMetrics } from '../lib/attention-metrics';

type Props = {
  walletAddress?: string | null;
  displayName?: string;
  compact?: boolean;
  onOpenPartners?: () => void;
  onOpenHearing?: () => void;
  /** Enter Spark / Academy session */
  onOpenSpark?: () => void;
  /** Claim / return beat */
  onOpenReturn?: () => void;
  /** Copy / trigger spread invite */
  onSpread?: () => void;
};

const STEPS: Array<{
  id: keyof LocalLoopProgress;
  label: string;
  hint: string;
  /** Index into JOURNEY_DECK */
  deckIndex: number;
}> = [
  { id: 'discovered', label: 'Hear', hint: 'Open ears-first — or just begin.', deckIndex: 0 },
  { id: 'claimed', label: 'Passport', hint: 'Own your Human Passport.', deckIndex: 0 },
  { id: 'sparked', label: 'Spark', hint: 'Prove attention once.', deckIndex: 1 },
  { id: 'spread', label: 'Spread', hint: 'Pass an invite — love travels.', deckIndex: 3 },
  { id: 'returned', label: 'Return', hint: 'Claim daily Impact · grow scores.', deckIndex: 4 },
];

export default function GrowthLoopPanel({
  walletAddress,
  displayName,
  compact = false,
  onOpenPartners,
  onOpenHearing,
  onOpenSpark,
  onOpenReturn,
  onSpread,
}: Props) {
  const myCode = inviteCodeFromWallet(walletAddress);
  const [local, setLocal] = useState<LocalLoopProgress>(() => buildLocalLoopProgress());
  const [pulse, setPulse] = useState<GrowthPulse | null>(null);
  const [mine, setMine] = useState<GrowthMemberStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [deckIndex, setDeckIndex] = useState(0);
  const [activeStepId, setActiveStepId] = useState<keyof LocalLoopProgress | null>(null);
  const [showDeck, setShowDeck] = useState(!compact);
  const [sparkTick, setSparkTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSparkTick((n) => n + 1), 4800);
    return () => window.clearInterval(id);
  }, []);

  const runStep = (step: (typeof STEPS)[number]) => {
    setDeckIndex(step.deckIndex);
    setActiveStepId(step.id);
    setShowDeck(true);
    if (step.id === 'discovered') onOpenHearing?.();
    else if (step.id === 'sparked') onOpenSpark?.();
    else if (step.id === 'spread') onSpread?.();
    else if (step.id === 'returned') onOpenReturn?.();
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setLocal(buildLocalLoopProgress());
    const [p, m] = await Promise.all([
      fetchGrowthPulse(),
      myCode ? fetchMyGrowthStats(myCode) : Promise.resolve(null),
    ]);
    if (p) setPulse(p);
    if (m) setMine(m);
    setLoading(false);
  }, [myCode]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 20_000);
    const unsub = subscribeAttentionMetrics(() => setLocal(buildLocalLoopProgress()));
    return () => {
      window.clearInterval(t);
      unsub();
    };
  }, [refresh]);

  const cast = myCode
    ? buildCommunityInviteCast({
        displayName,
        walletAddress: walletAddress || myCode,
      })
    : null;

  const connections = mine?.connections ?? 0;
  const networkConnections = pulse?.connections ?? 0;
  const networkNodes = pulse?.nodes ?? 0;

  const stepDone = (id: keyof LocalLoopProgress): boolean => {
    if (id === 'returned') return connections > 0 || local.returned;
    if (id === 'spread') return local.spread || (mine?.spreads ?? 0) > 0;
    if (id === 'sparked') return local.sparked || (mine?.sparks ?? 0) > 0;
    if (id === 'claimed') return Boolean(walletAddress) || local.claimed;
    if (id === 'discovered') return local.discovered || Boolean(walletAddress);
    return Boolean(local[id]);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/30 via-[#07080c]/95 to-cyan-950/20 ${
        compact ? 'p-4' : 'p-5 md:p-6'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-emerald-400/90">
            Your path
          </p>
          <h3 className="mt-1 font-display text-lg md:text-xl font-bold italic text-white">
            Hear → Spark → Spread → Return
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
          title="Refresh growth stats"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {showDeck && (
        <div className="mt-4">
          <InteractiveDeck
            key={`journey-${deckIndex}`}
            slides={JOURNEY_DECK}
            mood="evolution"
            compact
            initialIndex={deckIndex}
            onCta={(slideId) => {
              if (slideId === 'discover') onOpenHearing?.();
              else if (slideId === 'spark' || slideId === 'build') onOpenSpark?.();
              else if (slideId === 'share') onSpread?.();
              else if (slideId === 'reputation') onOpenReturn?.();
            }}
          />
          {compact && (
            <button
              type="button"
              onClick={() => setShowDeck(false)}
              className="mt-2 w-full text-center text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Hide explainer
            </button>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat
          icon={<Users className="w-3.5 h-3.5" />}
          label="Your connections"
          value={connections}
          accent="text-emerald-300"
        />
        <Stat
          icon={<Network className="w-3.5 h-3.5" />}
          label="Network links"
          value={networkConnections}
          accent="text-cyan-300"
        />
        <Stat
          icon={<Share2 className="w-3.5 h-3.5" />}
          label="Your spreads"
          value={mine?.spreads ?? local.spreads}
          accent="text-amber-200"
        />
        <Stat
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Builders"
          value={networkNodes}
          accent="text-rose-200"
        />
      </div>

      <ol className="mt-5 flex flex-wrap gap-2">
        {STEPS.map((step, i) => {
          const done = stepDone(step.id);
          const selected = showDeck && activeStepId === step.id;
          const glow = done && sparkTick % 5 === i % 5;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => runStep(step)}
                title={step.hint}
                className={`relative flex items-center gap-2 rounded-xl border px-3 py-2 min-w-[7.5rem] cursor-pointer transition ${
                  selected
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                    : done
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:shadow-[0_0_16px_rgba(52,211,153,0.3)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-slate-200'
                }`}
              >
                <span
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                    done ? 'bg-emerald-400 text-black' : 'bg-white/10 text-slate-500'
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                  {glow && (
                    <motion.span
                      className="pointer-events-none absolute -inset-1 rounded-full border border-amber-300/50"
                      initial={{ opacity: 0.6, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.6 }}
                      transition={{ duration: 1.2 }}
                    />
                  )}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-slate-600">
        Tap a step · explainer + session
      </p>

      {!compact && pulse && pulse.recent.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/8 bg-black/25 px-3 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">
            Live network
          </p>
          <ul className="space-y-1 max-h-28 overflow-y-auto">
            {pulse.recent.slice(0, 8).map((e, idx) => (
              <li
                key={`${e.at}-${e.from}-${e.to}-${idx}`}
                className="text-[11px] text-slate-400 font-mono flex flex-wrap gap-x-2"
              >
                <span className="text-emerald-300/90">{e.from}</span>
                <span className="text-slate-600">→</span>
                <span className="text-cyan-300/90">{e.to}</span>
                <span className="text-slate-600">{e.kind}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cast && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <FarcasterCastButton
            text={cast.text}
            embedUrl={cast.embedUrl}
            label="Cast invite · grow loop"
            variant="primary"
            className="flex-1"
          />
          {myCode && (
            <p className="sm:self-center text-[10px] font-mono text-slate-500 tracking-wide">
              Your code · {myCode}
            </p>
          )}
        </div>
      )}

      {!compact && (
        <div className="mt-5">
          {/* Rain deck stays available on full passport after first share path */}
          <MakeItRainDeck
            compact
            onOpenPartners={onOpenPartners}
            onOpenHearing={onOpenHearing}
          />
        </div>
      )}
    </motion.section>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/30 px-3 py-2.5">
      <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl font-bold italic tabular-nums ${accent}`}>
        {value}
      </p>
    </div>
  );
}
