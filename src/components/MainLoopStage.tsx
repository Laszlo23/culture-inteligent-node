/**
 * Home Loop Stage — Hear → Spark → Zen → Spread → Return.
 * One composition, one next beat. Facility stays off-stage until open.
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Ear, ArrowRight, Flame, Share2, Sparkles } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  buildLoopRail,
  type LoopStepId,
  type MainLoopFlags,
} from '../lib/main-loop';
import type { WinRail } from '../lib/winning-flows';
import { CinematicBackdrop, EnergyFlow, GlowPulse } from './fx';

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
};

const STEP_HINT: Record<LoopStepId, string> = {
  hear: 'Ears first — then prove.',
  spark: SLOGANS.firstSparkSupport,
  zen: 'Knowledge first. Then decide.',
  spread: 'Pass the invite — love travels.',
  return: 'Claim Impact or prove again.',
};

export default function MainLoopStage({
  flags,
  phase,
  username,
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
}: Props) {
  const reduceMotion = useReducedMotion();
  const rail = buildLoopRail(flags);
  const you = username?.replace(/^@/, '') || null;

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
        className="relative overflow-hidden rounded-2xl border border-cyan-400/35 bg-[#07080c]/90"
      >
        <div className="absolute inset-0">
          <CinematicBackdrop variant={phase === 'ritual' ? 'ritual' : 'duality'} />
        </div>
        <GlowPulse
          energy={Math.max(8, energy)}
          color="cyan"
          className="absolute -right-10 -top-10 w-48 h-48 z-[1]"
        />
        <GlowPulse
          energy={12}
          color="amber"
          className="absolute -left-12 bottom-0 w-40 h-40 z-[1]"
        />

        <div className="relative z-10 px-5 pt-6 pb-5 md:px-8 md:pt-8 md:pb-6">
          <p className="font-display text-3xl md:text-4xl font-extrabold italic text-white tracking-tight leading-none">
            {BRAND.parent}
          </p>
          <p className="mt-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-cyan-300/90">
            {BRAND.passport} · {SLOGANS.zen}
          </p>

          {/* Loop rail */}
          <nav
            aria-label="Main loop"
            className="mt-6 flex items-center justify-between gap-1 sm:gap-2"
          >
            {rail.map((step, i) => {
              const isCurrent = step.state === 'current';
              const isDone = step.state === 'done';
              return (
                <React.Fragment key={step.id}>
                  {i > 0 && (
                    <div
                      className={`h-px flex-1 min-w-[6px] max-w-[28px] ${
                        isDone || isCurrent ? 'bg-cyan-400/50' : 'bg-white/10'
                      }`}
                      aria-hidden
                    />
                  )}
                  <div className="flex flex-col items-center gap-1 min-w-[3.25rem]">
                    <motion.div
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center border text-[10px] font-mono font-black ${
                        isCurrent
                          ? 'border-cyan-300 bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.45)]'
                          : isDone
                            ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                            : 'border-white/15 bg-black/40 text-slate-500'
                      }`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {isDone && !isCurrent ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        i + 1
                      )}
                    </motion.div>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider ${
                        isCurrent
                          ? 'text-cyan-200'
                          : isDone
                            ? 'text-emerald-300/80'
                            : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </nav>

          <p className="mt-3 text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {STEP_HINT[flags.current]}
          </p>

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
                For you · @{you}
              </span>
            )}
            <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight leading-tight mt-1">
              {cta.label}
            </h2>
            <p className="mt-2 text-sm text-slate-400 font-sans leading-relaxed">
              {cta.reason}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 sm:items-center">
            <motion.button
              type="button"
              onClick={cta.onGo}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black font-mono text-xs rounded-xl tracking-wider cursor-pointer shadow-[0_0_28px_rgba(34,211,238,0.35)]"
            >
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            {onHear && (
              <button
                type="button"
                onClick={onHear}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
              >
                <Ear className="w-3.5 h-3.5 text-cyan-300" />
                Hear first
              </button>
            )}
          </div>

          {winRails.length > 0 && onWinRail && (
            <div className="mt-4 flex flex-wrap gap-2">
              {winRails.map((rail) => (
                <button
                  key={rail.id}
                  type="button"
                  title={rail.reason}
                  onClick={() => onWinRail(rail)}
                  className="px-3 py-2 rounded-lg border border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-100 font-mono text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  {rail.label}
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
              ).map((s) => (
                <div
                  key={s.key}
                  className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-2.5 py-2.5 text-center"
                >
                  <p className="font-mono text-[8px] uppercase tracking-widest text-cyan-400/80">
                    {s.label}
                  </p>
                  <p className="mt-0.5 font-display text-xl font-bold italic text-white">{s.value}</p>
                </div>
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

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-black/35 text-[10px] font-mono text-slate-300 uppercase tracking-wider">
      {icon}
      {label}
    </span>
  );
}
