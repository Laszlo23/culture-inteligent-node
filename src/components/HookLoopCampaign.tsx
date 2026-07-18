/**
 * Hook Loop campaign room — meme card + share unlocks the next hooking truth.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Copy, Share2, Sparkles, Repeat } from 'lucide-react';
import {
  HOOKING_TRUTHS,
  advanceHookLoopAfterShare,
  artUrl,
  buildHookSharePost,
  getTruthAt,
  getTruthById,
  hookLoopDeepLink,
  phaseLabel,
  readHookLoopState,
  setHookLoopIndex,
  type HookingTruth,
  type HookLoopState,
} from '../lib/hook-loop-campaign';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import { copyTextFallback, shareCultureText } from '../lib/culture-broadcast';
import { track } from '../lib/attention-metrics';
import { useSound } from '../lib/sound/SoundContext';

type Props = {
  initialTruthId?: string | null;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenAcademy?: () => void;
  onOpenMap?: () => void;
};

export default function HookLoopCampaign({
  initialTruthId,
  addLog,
  onOpenAcademy,
  onOpenMap,
}: Props) {
  const { play } = useSound();
  const [state, setState] = useState<HookLoopState>(() => readHookLoopState());
  const [sharing, setSharing] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<HookingTruth | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const fromLink = getTruthById(initialTruthId);
    if (fromLink) {
      const idx = HOOKING_TRUTHS.findIndex((t) => t.id === fromLink.id);
      if (idx >= 0) {
        setState(setHookLoopIndex(idx));
      }
    }
    track('hook_loop_view', { truth: fromLink?.id ?? getTruthAt(readHookLoopState().index).id });
  }, [initialTruthId]);

  const truth = useMemo(() => getTruthAt(state.index), [state.index]);
  const progress = Math.min(100, Math.round((state.unlockedIds.length / HOOKING_TRUTHS.length) * 100));

  const runShare = async () => {
    if (sharing) return;
    setSharing(true);
    const post = buildHookSharePost(truth);
    const url = hookLoopDeepLink(truth.id);
    try {
      const how = await shareCultureText(post, `${BRAND.product} · Hooking Truth #${truth.n}`, url);
      const { next, state: nextState, completedLap } = advanceHookLoopAfterShare(truth);
      setState(nextState);
      setJustUnlocked(next);
      setFlash(true);
      play('success');
      track('hook_loop_share', {
        truth: truth.id,
        next: next.id,
        how,
        shares: nextState.shares,
        lap: completedLap,
      });
      addLog(
        completedLap
          ? `HOOK LOOP: Full deck shared ×${nextState.shares}. New lap — truth #${next.n} live.`
          : `HOOK LOOP: Shared #${truth.n} — unlocked Hooking Truth #${next.n}.`,
        'success'
      );
      window.setTimeout(() => setFlash(false), 900);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        addLog('HOOK LOOP: Share cancelled — truth still waiting.', 'info');
      } else {
        try {
          await copyTextFallback(post);
          const { next, state: nextState } = advanceHookLoopAfterShare(truth);
          setState(nextState);
          setJustUnlocked(next);
          play('success');
          track('hook_loop_share', {
            truth: truth.id,
            next: next.id,
            how: 'clipboard',
            shares: nextState.shares,
          });
          addLog(`HOOK LOOP: Copied #${truth.n} — unlocked #${next.n}. Paste anywhere.`, 'success');
        } catch {
          addLog('HOOK LOOP: Could not share or copy — try again.', 'warn');
        }
      }
    } finally {
      setSharing(false);
    }
  };

  const copyOnly = async () => {
    try {
      await copyTextFallback(buildHookSharePost(truth));
      play('soft');
      track('hook_loop_copy', { truth: truth.id });
      addLog(`HOOK LOOP: Truth #${truth.n} copied — share to unlock the next one.`, 'info');
    } catch {
      addLog('HOOK LOOP: Clipboard blocked.', 'warn');
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <header className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-[#14080c]/95 via-[#08060a] to-cyan-950/40 p-5 md:p-6">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <img
            src={artUrl(truth.art)}
            alt=""
            className="w-full h-full object-cover blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08060a] via-[#08060a]/85 to-[#08060a]/40" />
        </div>
        <div className="relative z-10">
          <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-rose-300/90">
            Social campaign · Hook Loop
          </p>
          <h2 className="mt-2 font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
            How they hook you into doomscrolling
          </h2>
          <p className="mt-2 text-sm text-slate-300/90 max-w-xl leading-relaxed">
            Fun memes. Real mechanics. Every share hands someone a packed truth — and unlocks your next one.
            Perfect loop. Honest this time.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
            <span className="px-2 py-1 rounded-md border border-rose-400/30 bg-rose-500/10 text-rose-100">
              {state.unlockedIds.length}/{HOOKING_TRUTHS.length} unlocked
            </span>
            <span className="px-2 py-1 rounded-md border border-amber-400/25 bg-amber-500/10 text-amber-100">
              {state.shares} shares
            </span>
            <span className="text-slate-500">{progress}% of the deck</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.article
          key={truth.id}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative"
        >
          {/* Meme plate */}
          <div
            className={`relative aspect-[4/5] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.55)] ${
              flash ? 'ring-2 ring-amber-400/70' : ''
            }`}
          >
            <img
              src={artUrl(truth.art)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
              <span className="font-mono text-[10px] font-black tracking-[0.2em] text-amber-300 bg-black/50 px-2 py-1 rounded-md border border-amber-400/30">
                TRUTH #{truth.n}
              </span>
              <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-rose-200 bg-rose-950/50 px-2 py-1 rounded-md border border-rose-400/30">
                {phaseLabel(truth.phase)}
              </span>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-between px-4 py-14 sm:py-16 text-center z-10">
              <p
                className="font-display text-2xl sm:text-4xl md:text-5xl font-black italic uppercase text-white tracking-tight drop-shadow-[0_2px_0_#000] leading-[1.05] max-w-[18ch]"
                style={{ WebkitTextStroke: '1px rgba(0,0,0,0.45)' }}
              >
                {truth.memeTop}
              </p>
              <p
                className="font-display text-xl sm:text-3xl md:text-4xl font-black italic uppercase text-amber-200 tracking-tight drop-shadow-[0_2px_0_#000] leading-[1.05] max-w-[20ch]"
                style={{ WebkitTextStroke: '1px rgba(0,0,0,0.4)' }}
              >
                {truth.memeBottom}
              </p>
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center font-mono text-[8px] tracking-[0.25em] uppercase text-white/50 z-10">
              {BRAND.product} · Hook Loop
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/8 bg-[#0a0a0e]/90 p-5 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/80">
              Packed truth
            </p>
            <p className="font-display text-lg sm:text-xl font-bold italic text-white leading-snug">
              “{truth.truth}”
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{truth.howTheyHook}</p>
            <p className="text-sm text-amber-100/85 leading-relaxed border-l-2 border-amber-400/40 pl-3">
              {truth.flip}
            </p>
          </div>
        </motion.article>
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          disabled={sharing}
          onClick={() => void runShare()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-60 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_28px_rgba(251,113,133,0.35)]"
        >
          <Share2 className="w-4 h-4" />
          {sharing ? 'Opening share…' : 'Share · unlock next truth'}
        </button>
        <button
          type="button"
          onClick={() => void copyOnly()}
          className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-white/15 hover:border-white/30 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy pack
        </button>
      </div>

      <p className="text-[11px] text-slate-500 text-center leading-relaxed">
        Share advances the loop. Copy alone does not unlock — pass it to someone who needs the hook.
        {SLOGANS.thumbBait ? ` ${SLOGANS.thumbBait}` : ''}
      </p>

      <AnimatePresence>
        {justUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-amber-400/35 bg-amber-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-50">
                  Unlocked Hooking Truth #{justUnlocked.n}
                </p>
                <p className="text-[11px] text-amber-100/70 mt-0.5 line-clamp-2">
                  {justUnlocked.truth}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setJustUnlocked(null);
                play('soft');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              See it <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="rounded-2xl border border-white/8 bg-[#08080c]/80 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Repeat className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            The perfect loop
          </h3>
        </div>
        <ol className="grid sm:grid-cols-4 gap-2 text-[11px]">
          {[
            { t: 'Hook', d: 'Meme lands the bait' },
            { t: 'Truth', d: 'Pack names the trick' },
            { t: 'Share', d: 'Hand off the loop' },
            { t: 'Unlock', d: 'Next truth for you' },
          ].map((step) => (
            <li
              key={step.t}
              className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
            >
              <span className="font-mono text-[9px] font-black text-cyan-400/90 uppercase tracking-wider">
                {step.t}
              </span>
              <p className="mt-1 text-slate-400 leading-snug">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        {onOpenAcademy && (
          <button
            type="button"
            onClick={onOpenAcademy}
            className="px-3 py-2 rounded-lg border border-cyan-500/35 bg-cyan-500/10 text-cyan-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            Prove it in Academy
          </button>
        )}
        {onOpenMap && (
          <button
            type="button"
            onClick={onOpenMap}
            className="px-3 py-2 rounded-lg border border-white/12 text-slate-300 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            Back to home
          </button>
        )}
      </div>
    </div>
  );
}
