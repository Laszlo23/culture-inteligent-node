/**
 * Human Passport dashboard — cinematic presentation energy.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Award, Sparkles } from 'lucide-react';
import type { GameState } from '../types';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  computeHumanScores,
  skillChipsFromScores,
} from '../lib/human-economy';
import { buildAttentionSnapshot } from '../lib/attention-metrics';
import { readFirstContribution } from '../lib/first-contribution';
import ReputationGraph from './ReputationGraph';
import GrowthLoopPanel from './GrowthLoopPanel';
import PassportShareCard from './PassportShareCard';
import CinematicPanel from './fx/CinematicPanel';

export type PassportNextStep = {
  label: string;
  reason: string;
  onGo: () => void;
};

type Props = {
  username: string;
  /** Progress title — visible identity above the handle */
  progressTitle?: string | null;
  progressBlurb?: string | null;
  avatarUrl?: string;
  walletAddress?: string | null;
  state: GameState;
  academyCompletedCount: number;
  coreSessionTotal: number;
  firstRitualPending: boolean;
  compact?: boolean;
  nextStep: PassportNextStep;
  onOpenFull?: () => void;
  onOpenPartners?: () => void;
  onOpenHearing?: () => void;
  /** Replay cinematic Awareness Story */
  onOpenStory?: () => void;
  onOpenSpark?: () => void;
  onOpenReturn?: () => void;
  onSpread?: () => void;
};

function ScoreCard({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: number;
  accentClass: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex-1 min-w-[96px] rounded-2xl border px-3 py-3.5 text-center backdrop-blur-md ${accentClass}`}
    >
      <p className="font-mono text-[9px] uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold italic text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
        {value}
      </p>
      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-current opacity-90"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export default function HumanPassportDashboard({
  username,
  progressTitle,
  progressBlurb,
  avatarUrl,
  walletAddress,
  state,
  academyCompletedCount,
  coreSessionTotal,
  firstRitualPending,
  compact = false,
  nextStep,
  onOpenFull,
  onOpenPartners,
  onOpenHearing,
  onOpenStory,
  onOpenSpark,
  onOpenReturn,
  onSpread,
}: Props) {
  const missionsCompleted = state.dailyMissions.filter((m) => m.completed).length;
  const scores = useMemo(() => {
    const seed = readFirstContribution()?.scores ?? null;
    return computeHumanScores({
      academyCompletedCount,
      coreSessionTotal,
      missionsCompleted,
      missionsTotal: state.dailyMissions.length,
      snapshot: buildAttentionSnapshot(30),
      seed,
    });
  }, [
    academyCompletedCount,
    coreSessionTotal,
    missionsCompleted,
    state.dailyMissions.length,
  ]);
  const skills = skillChipsFromScores(scores);
  const handle = username.replace(/^@/, '');

  return (
    <CinematicPanel mood="awakening" compact={compact}>
      <div className={compact ? 'p-5 md:p-6' : 'p-5 md:p-8'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-amber-400/35 bg-black/40 shrink-0 shadow-[0_0_28px_rgba(245,158,11,0.25)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-amber-200">
                  <Award className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-black tracking-[0.28em] uppercase text-amber-300">
                Chapter · {BRAND.passport}
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white truncate drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
                {progressTitle || `@${handle}`}
              </h2>
              {progressTitle ? (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  @{handle}
                  {progressBlurb ? ` · ${progressBlurb}` : ''}
                </p>
              ) : (
                <p className="text-[12px] text-slate-200/85 mt-0.5">{SLOGANS.equation}</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/12 bg-black/45 px-4 py-3 text-right backdrop-blur-md">
            <p className="font-mono text-[9px] uppercase tracking-widest text-amber-200/80">
              Your Human Value
            </p>
            <p className="font-display text-5xl font-bold italic text-white leading-none mt-1">
              {scores.humanValue}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <ScoreCard
            label="Knowledge"
            value={scores.knowledge}
            accentClass="border-cyan-400/35 bg-cyan-500/15 text-cyan-300"
          />
          <ScoreCard
            label="Creativity"
            value={scores.creativity ?? scores.builder}
            accentClass="border-amber-400/35 bg-amber-500/15 text-amber-300"
          />
          <ScoreCard
            label="Contribution"
            value={scores.contribution}
            accentClass="border-rose-400/35 bg-rose-500/15 text-rose-200"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 rounded-lg border border-white/15 bg-black/40 text-[10px] font-mono text-slate-200 uppercase tracking-wider backdrop-blur-sm"
            >
              {s}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-lg border border-white/10 bg-black/35 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {missionsCompleted} quests
          </span>
          <span className="px-2.5 py-1 rounded-lg border border-white/10 bg-black/35 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {academyCompletedCount} proofs
          </span>
        </div>

        {!compact && (
          <div className="mt-6 rounded-2xl border border-white/12 bg-black/45 p-3 backdrop-blur-md">
            <ReputationGraph days={14} />
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <motion.button
            type="button"
            onClick={nextStep.onGo}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-cyan-100 text-black font-mono text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.18)]"
          >
            {firstRitualPending ? 'Start Proof of Attention' : nextStep.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
          {onOpenStory && (
            <button
              type="button"
              onClick={onOpenStory}
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-100 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Why learn
            </button>
          )}
          {onOpenFull && compact && (
            <button
              type="button"
              onClick={onOpenFull}
              className="px-4 py-3.5 rounded-2xl border border-white/20 bg-black/40 text-slate-100 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer backdrop-blur-md"
            >
              Full passport
            </button>
          )}
        </div>
        <p className="mt-2.5 text-[12px] text-slate-200/80 leading-relaxed max-w-xl">
          {nextStep.reason}
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md p-1">
          <PassportShareCard name={handle} scores={scores} compact={compact} />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md p-1">
          <GrowthLoopPanel
            walletAddress={walletAddress}
            displayName={username}
            compact={compact}
            onOpenPartners={onOpenPartners}
            onOpenHearing={onOpenHearing}
            onOpenSpark={onOpenSpark}
            onOpenReturn={onOpenReturn}
            onSpread={onSpread}
          />
        </div>
      </div>
    </CinematicPanel>
  );
}
