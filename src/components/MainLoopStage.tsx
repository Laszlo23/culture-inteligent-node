/**
 * Home Loop Stage — Hear → Spark → Zen → Spread → Return.
 * One composition, one next beat. Facility stays off-stage until open.
 * Steps are clickable → LOOP_DECK explainer + real session actions.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Ear, ArrowRight, Flame, Share2, Sparkles } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  buildLoopRail,
  type LoopStepId,
  type MainLoopFlags,
} from '../lib/main-loop';
import type { WinRail } from '../lib/winning-flows';
import { EnergyFlow } from './fx';
import InteractiveDeck from './fx/InteractiveDeck';
import { MoodArt } from './onboarding/StoryChapterArt';
import { PATH_LOOP_WHISPER, readGrowthPath } from '../lib/growth-path';
import { LOOP_DECK } from '../lib/decks';
import StayLoopStrip, { type StayLoopProps } from './StayLoopStrip';

export type LoopBeatCta = {
  label: string;
  reason: string;
  onGo: () => void;
};

export type LoopPassportScores = {
  knowledge: number;
  builder: number;
  contribution: number;
};

type Props = {
  flags: MainLoopFlags;
  phase: 'ritual' | 'guided';
  username?: string | null;
  /** Progress title — preferred greeting identity */
  progressTitle?: string | null;
  energy: number;
  streak: number;
  connections?: number | null;
  fuelWin?: { from: number; to: number } | null;
  zenNote?: string | null;
  returnGreeting?: string | null;
  /** Human Passport axes — potential becoming visible */
  passportScores?: LoopPassportScores | null;
  cta: LoopBeatCta;
  /** Post-loop conversion rails (partner / toll / discord) */
  winRails?: WinRail[];
  onWinRail?: (rail: WinRail) => void;
  onHear?: () => void;
  onDismissFuel?: () => void;
  onOpenFacility?: () => void;
  showOpenFacility?: boolean;
  /** Replay cinematic Awareness Story */
  onOpenStory?: () => void;
  /** Enter the real session / action for a loop step */
  onStepAction?: (step: LoopStepId) => void;
  /** Come-back / stickiness strip */
  stay?: StayLoopProps | null;
};

const STEP_HINT: Record<LoopStepId, string> = {
  hear: 'Ears first — then prove.',
  spark: SLOGANS.firstSparkSupport,
  zen: 'Knowledge first. Then decide.',
  spread: 'Pass the invite — love travels.',
  return: 'Claim Impact or prove again.',
};

const STEP_ORDER: LoopStepId[] = ['hear', 'spark', 'zen', 'spread', 'return'];

export default function MainLoopStage({
  flags,
  phase,
  username,
  progressTitle,
  energy,
  streak,
  connections,
  fuelWin,
  zenNote,
  returnGreeting,
  passportScores,
  cta,
  winRails = [],
  onWinRail,
  onHear,
  onDismissFuel,
  onOpenFacility,
  showOpenFacility,
  onOpenStory,
  onStepAction,
  stay = null,
}: Props) {
  const reduceMotion = useReducedMotion();
  const rail = buildLoopRail(flags);
  const handle = username?.replace(/^@/, '') || null;
  const you = progressTitle?.trim() || handle;
  const pathWhisper = PATH_LOOP_WHISPER[readGrowthPath() ?? 'balanced'];
  const [selectedStep, setSelectedStep] = useState<LoopStepId | null>(null);
  const [sparkBurst, setSparkBurst] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const tick = () => setSparkBurst((n) => n + 1);
    const id = window.setInterval(tick, 4200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const selectedIndex = selectedStep ? STEP_ORDER.indexOf(selectedStep) : -1;

  const openStep = (id: LoopStepId) => {
    setSelectedStep(id);
  };

  return (
    <div className="space-y-4">
      {returnGreeting && (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[12px] text-amber-200/90 font-sans"
        >
          {returnGreeting}
        </motion.p>
      )}

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#07080c] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <MoodArt
          wash={
            phase === 'ritual'
              ? 'from-[#060a10]/25 via-[#050608]/65 to-[#050608]/95'
              : 'from-[#050608]/20 via-[#050608]/65 to-[#050608]/95'
          }
          accent={phase === 'ritual' ? 'cyan' : 'amber'}
          form={phase === 'ritual' ? 'spark' : 'orbit'}
          compact
          plate="signal"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050608]/75 via-[#050608]/30 to-transparent" />

        <div className="relative z-10 px-5 pt-6 pb-5 md:px-8 md:pt-8 md:pb-6">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            {phase === 'ritual' ? 'Opening · First Spark' : 'Main loop · live'}
          </p>
          <p className="mt-2 font-display text-3xl md:text-4xl font-extrabold italic text-white tracking-tight leading-none drop-shadow-[0_4px_28px_rgba(0,0,0,0.75)]">
            {BRAND.parent}
          </p>
          <p className="mt-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-amber-200/90">
            {BRAND.passport} · {SLOGANS.zen}
          </p>

          {/* Loop rail — clickable */}
          <nav
            aria-label="Main loop"
            className="mt-6 flex items-center justify-between gap-1 sm:gap-2"
          >
            {rail.map((step, i) => {
              const isCurrent = step.state === 'current';
              const isDone = step.state === 'done';
              const isSelected = selectedStep === step.id;
              const showSparks =
                !reduceMotion &&
                (isCurrent || (isDone && sparkBurst % 5 === (i + 1) % 5));

              return (
                <React.Fragment key={step.id}>
                  {i > 0 && (
                    <motion.div
                      className={`h-px flex-1 min-w-[6px] max-w-[28px] origin-left ${
                        isDone || isCurrent ? 'bg-cyan-400/50' : 'bg-white/10'
                      }`}
                      aria-hidden
                      initial={reduceMotion ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.08 * i, duration: 0.4 }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => openStep(step.id)}
                    title={`${step.label} — ${STEP_HINT[step.id]}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-pressed={isSelected}
                    className="group relative flex flex-col items-center gap-1 min-w-[3.25rem] cursor-pointer border-0 bg-transparent p-0"
                  >
                    <motion.div
                      whileHover={reduceMotion ? undefined : { scale: 1.08 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                      animate={
                        isCurrent && !reduceMotion
                          ? { scale: [1, 1.06, 1] }
                          : { scale: 1 }
                      }
                      transition={
                        isCurrent && !reduceMotion
                          ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }
                          : undefined
                      }
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center border text-[10px] font-mono font-black transition-shadow ${
                        isSelected
                          ? 'border-amber-300 bg-amber-400 text-black shadow-[0_0_24px_rgba(251,191,36,0.55)]'
                          : isCurrent
                            ? 'border-cyan-300 bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.45)]'
                            : isDone
                              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200 group-hover:shadow-[0_0_16px_rgba(52,211,153,0.35)]'
                              : 'border-white/15 bg-black/40 text-slate-500 group-hover:border-white/30 group-hover:text-slate-300'
                      }`}
                    >
                      {isDone && !isCurrent && !isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        i + 1
                      )}
                      {showSparks && <StepSparks burstKey={sparkBurst} />}
                      {isCurrent && !reduceMotion && (
                        <motion.span
                          className="pointer-events-none absolute inset-0 rounded-full border border-cyan-300/60"
                          animate={{ scale: [1, 1.55], opacity: [0.55, 0] }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                      )}
                    </motion.div>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider ${
                        isSelected
                          ? 'text-amber-200'
                          : isCurrent
                            ? 'text-cyan-200'
                            : isDone
                              ? 'text-emerald-300/80'
                              : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          <p className="mt-3 text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {selectedStep
              ? STEP_HINT[selectedStep]
              : STEP_HINT[flags.current]}
          </p>
          <p className="mt-1.5 text-center text-[11px] text-slate-400 font-sans leading-snug">
            {pathWhisper}
          </p>
          <p className="mt-1 text-center text-[10px] font-mono text-slate-600 uppercase tracking-wider">
            Tap a step · explainer + session
          </p>

          <AnimatePresence mode="wait">
            {selectedStep && selectedIndex >= 0 && (
              <motion.div
                key={selectedStep}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-5"
              >
                <InteractiveDeck
                  slides={LOOP_DECK}
                  mood="spark"
                  compact
                  initialIndex={selectedIndex}
                  onCta={(slideId) => {
                    onStepAction?.(slideId as LoopStepId);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSelectedStep(null)}
                  className="mt-2 w-full text-center text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Hide explainer
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fuel celebration */}
          {fuelWin && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3"
            >
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Proof accepted — Impact live
              </span>
              <div className="mt-2 flex items-end gap-3 font-mono">
                <span className="text-xl font-black text-slate-500">{fuelWin.from}%</span>
                <span className="text-emerald-400/80 text-xs pb-1">→</span>
                <span className="text-2xl font-black text-emerald-300">{fuelWin.to}%</span>
              </div>
              <EnergyFlow energy={fuelWin.to} className="mt-2 h-2 max-w-xs" />
              {onDismissFuel && (
                <button
                  type="button"
                  onClick={onDismissFuel}
                  className="mt-2 text-[10px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider cursor-pointer"
                >
                  Continue
                </button>
              )}
            </motion.div>
          )}

          {zenNote && !fuelWin && (
            <p className="mt-4 text-sm text-amber-100/90 font-sans leading-relaxed border border-amber-400/25 bg-amber-500/10 rounded-xl px-4 py-3">
              {zenNote}
            </p>
          )}

          {/* One beat */}
          <div className="mt-6 max-w-xl">
            {you && (
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                For you · {progressTitle ? you : `@${you}`}
                {progressTitle && handle ? (
                  <span className="text-slate-600 normal-case tracking-normal"> · @{handle}</span>
                ) : null}
              </span>
            )}
            <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight leading-tight mt-1 drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
              {cta.label}
            </h2>
            <p className="mt-2 text-sm text-slate-100/85 font-sans leading-relaxed max-w-lg">
              {cta.reason}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:items-center">
            <motion.button
              type="button"
              onClick={cta.onGo}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-cyan-100 text-black font-black font-mono text-xs rounded-2xl tracking-wider cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            {onHear && (
              <button
                type="button"
                onClick={onHear}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-white/20 bg-black/40 hover:bg-black/55 text-slate-100 font-mono text-[10px] font-bold uppercase tracking-wider rounded-2xl cursor-pointer backdrop-blur-md"
              >
                <Ear className="w-3.5 h-3.5 text-cyan-300" />
                Hear first
              </button>
            )}
            {onOpenStory && (
              <button
                type="button"
                onClick={onOpenStory}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-100 font-mono text-[10px] font-bold uppercase tracking-wider rounded-2xl cursor-pointer backdrop-blur-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Why learn
              </button>
            )}
          </div>

          {winRails.length > 0 && onWinRail && (
            <div className="mt-4 flex flex-wrap gap-2">
              {winRails.map((railItem) => (
                <button
                  key={railItem.id}
                  type="button"
                  title={railItem.reason}
                  onClick={() => onWinRail(railItem)}
                  className="px-3 py-2 rounded-lg border border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-100 font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  {railItem.label}
                </button>
              ))}
            </div>
          )}

          {passportScores && flags.firstSparkDone && (
            <div className="mt-6 grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'knowledge', label: 'Knowledge', value: passportScores.knowledge },
                  { key: 'builder', label: 'Builder', value: passportScores.builder },
                  {
                    key: 'contribution',
                    label: 'Contribution',
                    value: passportScores.contribution,
                  },
                ] as const
              ).map((s, i) => (
                <motion.div
                  key={s.key}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-2.5 py-2.5 text-center"
                >
                  <p className="font-mono text-[8px] uppercase tracking-widest text-cyan-400/80">
                    {s.label}
                  </p>
                  <p className="mt-0.5 font-display text-xl font-bold italic text-white">{s.value}</p>
                  <div className="mt-1.5 h-0.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-cyan-400/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, s.value)}%` }}
                      transition={{ duration: 0.8, delay: 0.15 * i }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Compact reward chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip
              icon={<Flame className="w-3 h-3 text-amber-300" />}
              label={`Impact ${Math.round(energy)}`}
            />
            {streak > 0 && (
              <Chip
                icon={<Sparkles className="w-3 h-3 text-cyan-300" />}
                label={`Day ${streak}`}
              />
            )}
            {connections != null && connections > 0 && (
              <Chip
                icon={<Share2 className="w-3 h-3 text-rose-300" />}
                label={`${connections} connection${connections === 1 ? '' : 's'}`}
              />
            )}
          </div>

          {stay && (
            <div className="mt-5">
              <StayLoopStrip {...stay} />
            </div>
          )}

          {showOpenFacility && onOpenFacility && (
            <button
              type="button"
              onClick={onOpenFacility}
              className="mt-5 text-[10px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider cursor-pointer"
            >
              Open facility →
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StepSparks({ burstKey }: { burstKey: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={`${burstKey}-${i}`}
          className="absolute h-1 w-1 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.9)]"
          style={{ left: `${28 + i * 18}%`, top: '8%' }}
          initial={{ opacity: 0, y: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], y: [-2, -14 - i * 2], scale: [0.4, 1.1, 0.2] }}
          transition={{ duration: 1.1, delay: i * 0.12, ease: 'easeOut' }}
        />
      ))}
    </span>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-black/35 text-[10px] font-mono text-slate-300 uppercase tracking-wider">
      {icon}
      {label}
    </span>
  );
}

