/**
 * Scroll Trap ID — 3 taps → named trap → share / challenge a friend.
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Copy, RefreshCw, Share2, Sparkles } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import { copyTextFallback, shareCultureText } from '../lib/culture-broadcast';
import { rewardAction } from '../lib/reward-bus';
import { track } from '../lib/attention-metrics';
import {
  TRAP_QUESTIONS,
  artUrl,
  clearTrapAnswersForRetake,
  getTrapById,
  markTrapShared,
  readTrapIdState,
  saveTrapResult,
  type TrapArchetype,
  type TrapArchetypeId,
} from '../lib/trap-id';
import {
  TRAP_CARD_STYLES,
  buildTrapCardCast,
  buildTrapCardPost,
  pickTrapCardStyle,
  trapIdCardImageUrl,
  trapIdShareLandingUrl,
  type TrapCardStyle,
} from '../lib/trap-id-card';
import FarcasterCastButton from './FarcasterCastButton';

type Props = {
  /** Friend's trap from deep link — show tease before quiz */
  challengedTrapId?: string | null;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenHookLoop?: () => void;
  onOpenAcademy?: () => void;
  onOpenMap?: () => void;
};

type Phase = 'tease' | 'quiz' | 'reveal';

function initialPhase(challenged: TrapArchetype | null, saved: TrapArchetype | null): Phase {
  if (challenged && !saved) return 'tease';
  if (saved) return 'reveal';
  return 'quiz';
}

export default function TrapIdRitual({
  challengedTrapId,
  addLog,
  onOpenHookLoop,
  onOpenAcademy,
  onOpenMap,
}: Props) {
  const challenged = getTrapById(challengedTrapId);
  const [state, setState] = useState(() => readTrapIdState());
  const [answers, setAnswers] = useState<TrapArchetypeId[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [trap, setTrap] = useState<TrapArchetype | null>(
    () => getTrapById(readTrapIdState().resultId) ?? challenged
  );
  const [phase, setPhase] = useState<Phase>(() =>
    initialPhase(challenged, getTrapById(readTrapIdState().resultId))
  );
  const [sharing, setSharing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [cardStyle, setCardStyle] = useState<TrapCardStyle>(() =>
    pickTrapCardStyle(readTrapIdState().resultId || challengedTrapId || 'TID01')
  );

  const question = TRAP_QUESTIONS[qIndex];
  const cardImageUrl = useMemo(() => {
    if (!trap) return null;
    return trapIdCardImageUrl(trap.id, cardStyle);
  }, [trap, cardStyle]);
  const cardLandingUrl = useMemo(() => {
    if (!trap) return null;
    return trapIdShareLandingUrl(trap.id, cardStyle);
  }, [trap, cardStyle]);

  const beginQuiz = (retake = false) => {
    if (retake) {
      setState(clearTrapAnswersForRetake());
    }
    setAnswers([]);
    setQIndex(0);
    setTrap(null);
    setPhase('quiz');
    track('trap_id_start', { retake, fromChallenge: Boolean(challenged) });
  };

  const pickOption = (trapId: TrapArchetypeId) => {
    const nextAnswers = [...answers, trapId];
    setAnswers(nextAnswers);
    track('trap_id_answer', { q: question.id, trap: trapId, n: nextAnswers.length });

    if (nextAnswers.length >= TRAP_QUESTIONS.length) {
      const { trap: result, state: nextState } = saveTrapResult(nextAnswers);
      setTrap(result);
      setCardStyle(pickTrapCardStyle(result.id));
      setState(nextState);
      setPhase('reveal');
      setFlash(true);
      window.setTimeout(() => setFlash(false), 900);
      track('trap_id_reveal', { trap: result.id });
      rewardAction('trap_id', { label: `You're a ${result.handle}` });
      addLog(`TRAP ID: You’re a ${result.handle}.`, 'success');
      return;
    }
    setQIndex((i) => i + 1);
  };

  const afterShare = (how: 'share' | 'clipboard' | 'farcaster') => {
    if (!trap) return;
    const nextState = markTrapShared(trap.id);
    setState(nextState);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
    track('trap_id_share', { trap: trap.id, how, shares: nextState.shares });
    addLog(
      how === 'farcaster'
        ? `TRAP ID: Cast as ${trap.handle} — challenge is live.`
        : `TRAP ID: Shared as ${trap.handle}. Challenge a friend.`,
      'success'
    );
  };

  const runShare = async () => {
    if (!trap || sharing || !cardImageUrl || !cardLandingUrl) return;
    setSharing(true);
    const post = buildTrapCardPost(trap, cardStyle, {
      imageUrl: cardImageUrl,
      landingUrl: cardLandingUrl,
    });
    try {
      const how = await shareCultureText(
        post,
        `${BRAND.product} · I'm a ${trap.handle}`,
        cardLandingUrl,
        {
          imageUrl: cardImageUrl,
          fileName: `${trap.handle.replace(/\s+/g, '-').toLowerCase()}.jpg`,
        }
      );
      afterShare(how);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // user cancelled
      } else {
        try {
          await copyTextFallback(post);
          afterShare('clipboard');
        } catch {
          addLog('TRAP ID: Could not share or copy — try again.', 'warn');
        }
      }
    } finally {
      setSharing(false);
    }
  };

  const copyOnly = async () => {
    if (!trap || !cardImageUrl || !cardLandingUrl) return;
    try {
      await copyTextFallback(
        buildTrapCardPost(trap, cardStyle, {
          imageUrl: cardImageUrl,
          landingUrl: cardLandingUrl,
        })
      );
      afterShare('clipboard');
      addLog('TRAP ID: Pack copied — card image link included.', 'info');
    } catch {
      addLog('TRAP ID: Copy failed — try Share instead.', 'warn');
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <header className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-[#141008]/95 via-[#08060a] to-rose-950/40 p-5 md:p-6">
        <div className="relative z-10">
          <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-amber-300/90">
            Viral · Scroll Trap ID
          </p>
          <h2 className="mt-2 font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
            What’s your bait?
          </h2>
          <p className="mt-2 text-sm text-slate-300/90 max-w-xl leading-relaxed">
            Three taps. One named trap. Share it so a friend has to find theirs — the honest loop.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
            <span className="px-2 py-1 rounded-md border border-amber-400/30 bg-amber-500/10 text-amber-100">
              ~30 sec
            </span>
            {state.shares > 0 ? (
              <span className="px-2 py-1 rounded-md border border-rose-400/30 bg-rose-500/10 text-rose-100">
                {state.shares} shares
              </span>
            ) : null}
            {state.resultId ? (
              <span className="text-slate-500">Saved · {getTrapById(state.resultId)?.handle}</span>
            ) : (
              <span className="text-slate-500">{SLOGANS.thumbBait}</span>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {phase === 'tease' && challenged ? (
          <motion.div
            key="tease"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <TrapCard trap={challenged} flash={false} badge="A friend sent this" />
            <p className="text-center text-sm text-slate-300 leading-relaxed">
              They think you might be this. Or worse. Find your real Trap ID.
            </p>
            <button
              type="button"
              onClick={() => beginQuiz(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Find mine · 3 taps
            </button>
          </motion.div>
        ) : null}

        {phase === 'quiz' && question ? (
          <motion.div
            key={`q-${question.id}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-white/10 bg-[#0a0a0e]/95 p-5 md:p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/85">
                Question {qIndex + 1} / {TRAP_QUESTIONS.length}
              </p>
              <div className="flex gap-1">
                {TRAP_QUESTIONS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full ${
                      i < qIndex
                        ? 'bg-amber-400'
                        : i === qIndex
                          ? 'bg-amber-400/70'
                          : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
            <h3 className="font-display text-xl md:text-2xl font-bold italic text-white leading-snug">
              {question.prompt}
            </h3>
            <div className="grid gap-2.5">
              {question.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => pickOption(opt.trap)}
                  className="text-left px-4 py-3.5 rounded-xl border border-white/12 bg-white/[0.03] hover:border-amber-400/45 hover:bg-amber-500/10 text-slate-100 text-sm leading-snug cursor-pointer transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

        {phase === 'reveal' && trap ? (
          <motion.div
            key={`reveal-${trap.id}`}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <TrapCard trap={trap} flash={flash} badge={`TRAP ID · ${trap.id}`} mine />
            <div className="rounded-2xl border border-white/8 bg-[#0a0a0e]/90 p-5 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/80">
                Packed truth
              </p>
              <p className="font-display text-lg sm:text-xl font-bold italic text-white leading-snug">
                “{trap.truth}”
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">{trap.howTheyHook}</p>
              <p className="text-sm text-amber-100/85 leading-relaxed border-l-2 border-amber-400/40 pl-3">
                {trap.flip}
              </p>
              <p className="text-sm text-rose-100/80 italic leading-relaxed">“{trap.roast}”</p>
            </div>

            {cardImageUrl ? (
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/90">
                  Hook card · drop this · bait them in
                </p>
                <div className="relative overflow-hidden rounded-xl border border-white/12 aspect-[1200/630] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                  <img
                    key={cardImageUrl}
                    src={cardImageUrl}
                    alt={`${trap.handle} share card`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRAP_CARD_STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCardStyle(s.id)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                        cardStyle === s.id
                          ? 'border-amber-400/60 bg-amber-500/20 text-amber-100'
                          : 'border-white/12 text-slate-400 hover:border-white/30'
                      }`}
                      title={s.vibe}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  {TRAP_CARD_STYLES.find((s) => s.id === cardStyle)?.vibe}
                </p>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={sharing}
                onClick={() => void runShare()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_28px_rgba(251,191,36,0.35)]"
              >
                <Share2 className="w-4 h-4" />
                {sharing ? 'Opening share…' : 'Share card + text'}
              </button>
              <FarcasterCastButton
                text={buildTrapCardCast(trap, cardStyle).text}
                embedUrl={buildTrapCardCast(trap, cardStyle).embedUrl}
                imageUrl={buildTrapCardCast(trap, cardStyle).imageUrl}
                variant="primary"
                label="Cast card"
                onCast={() => afterShare('farcaster')}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => void copyOnly()}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-white/15 hover:border-white/30 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => beginQuiz(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Retake
              </button>
              {onOpenHookLoop ? (
                <button
                  type="button"
                  onClick={onOpenHookLoop}
                  className="px-3 py-2 rounded-lg border border-rose-400/25 text-rose-200/90 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  More hooking truths
                </button>
              ) : null}
              {onOpenAcademy ? (
                <button
                  type="button"
                  onClick={onOpenAcademy}
                  className="px-3 py-2 rounded-lg border border-cyan-400/25 text-cyan-200/90 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Open Hook Mirror
                </button>
              ) : null}
              {onOpenMap ? (
                <button
                  type="button"
                  onClick={onOpenMap}
                  className="px-3 py-2 rounded-lg border border-white/10 text-slate-500 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Back
                </button>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Virality here is recognition — not a giveaway. Pass the trap. Lift a mind.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TrapCard({
  trap,
  flash,
  badge,
  mine = false,
}: {
  trap: TrapArchetype;
  flash: boolean;
  badge: string;
  mine?: boolean;
}) {
  return (
    <div
      className={`relative aspect-[4/5] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.55)] ${
        flash ? 'ring-2 ring-amber-400/70' : ''
      }`}
    >
      <img src={artUrl(trap.art)} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75" />
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
        <span className="font-mono text-[10px] font-black tracking-[0.2em] text-amber-300 bg-black/50 px-2 py-1 rounded-md border border-amber-400/30">
          {badge}
        </span>
        {mine ? (
          <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-rose-200 bg-rose-950/50 px-2 py-1 rounded-md border border-rose-400/30">
            {trap.handle}
          </span>
        ) : null}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-4 py-14 sm:py-16 text-center z-10">
        <p
          className="font-display text-2xl sm:text-4xl md:text-5xl font-black italic uppercase text-white tracking-tight drop-shadow-[0_2px_0_#000] leading-[1.05] max-w-[18ch]"
          style={{ WebkitTextStroke: '1px rgba(0,0,0,0.45)' }}
        >
          {trap.memeTop}
        </p>
        <div className="space-y-2">
          <p className="font-mono text-[11px] sm:text-sm font-black tracking-[0.28em] text-amber-300">
            {trap.handle}
          </p>
          <p
            className="font-display text-xl sm:text-3xl md:text-4xl font-black italic uppercase text-amber-200 tracking-tight drop-shadow-[0_2px_0_#000] leading-[1.05] max-w-[20ch]"
            style={{ WebkitTextStroke: '1px rgba(0,0,0,0.4)' }}
          >
            {trap.memeBottom}
          </p>
        </div>
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center font-mono text-[8px] tracking-[0.25em] uppercase text-white/50 z-10">
        {BRAND.product} · Trap ID
      </p>
    </div>
  );
}
