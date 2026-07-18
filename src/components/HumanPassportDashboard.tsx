/**
 * Human Passport dashboard — Your Human Value.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Award } from 'lucide-react';
import type { GameState } from '../types';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  computeHumanScores,
  skillChipsFromScores,
} from '../lib/human-economy';
import { buildAttentionSnapshot } from '../lib/attention-metrics';
import ReputationGraph from './ReputationGraph';
import GrowthLoopPanel from './GrowthLoopPanel';
import { GlowPulse } from './fx';

export type PassportNextStep = {
  label: string;
  reason: string;
  onGo: () => void;
};

type Props = {
  username: string;
  avatarUrl?: string;
  walletAddress?: string | null;
  state: GameState;
  academyCompletedCount: number;
  coreSessionTotal: number;
  firstRitualPending: boolean;
  compact?: boolean;
  nextStep: PassportNextStep;
  onOpenFull?: () => void;
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
    <div className={`flex-1 min-w-[96px] rounded-2xl border px-3 py-3 text-center ${accentClass}`}>
      <p className="font-mono text-[9px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold italic text-white">{value}</p>
      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-current opacity-80"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function HumanPassportDashboard({
  username,
  avatarUrl,
  walletAddress,
  state,
  academyCompletedCount,
  coreSessionTotal,
  firstRitualPending,
  compact = false,
  nextStep,
  onOpenFull,
}: Props) {
  const missionsCompleted = state.dailyMissions.filter((m) => m.completed).length;
  const scores = useMemo(
    () =>
      computeHumanScores({
        academyCompletedCount,
        coreSessionTotal,
        missionsCompleted,
        missionsTotal: state.dailyMissions.length,
        snapshot: buildAttentionSnapshot(30),
      }),
    [
      academyCompletedCount,
      coreSessionTotal,
      missionsCompleted,
      state.dailyMissions.length,
    ]
  );
  const skills = skillChipsFromScores(scores);
  const handle = username.replace(/^@/, '');

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#07080c]/85 ${
        compact ? 'p-5' : 'p-5 md:p-7'
      }`}
    >
      <GlowPulse energy={10} color="cyan" className="absolute -right-10 -top-10 w-44 h-44 z-0" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/15 bg-white/5 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-300">
                  <Award className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-black tracking-[0.24em] uppercase text-cyan-400/90">
                {BRAND.passport}
              </p>
              <h2 className="font-display text-xl md:text-2xl font-extrabold italic text-white truncate">
                @{handle}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">{SLOGANS.equation}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
              Your Human Value
            </p>
            <p className="font-display text-4xl font-bold italic text-white leading-none mt-1">
              {scores.humanValue}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ScoreCard
            label="Knowledge"
            value={scores.knowledge}
            accentClass="border-cyan-500/25 bg-cyan-500/5 text-cyan-400"
          />
          <ScoreCard
            label="Builder"
            value={scores.builder}
            accentClass="border-amber-500/25 bg-amber-500/5 text-amber-400"
          />
          <ScoreCard
            label="Contribution"
            value={scores.contribution}
            accentClass="border-rose-500/25 bg-rose-500/5 text-rose-300"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s}
              className="px-2 py-1 rounded-md border border-white/10 bg-white/[0.03] text-[10px] font-mono text-slate-400 uppercase tracking-wider"
            >
              {s}
            </span>
          ))}
          <span className="px-2 py-1 rounded-md border border-white/10 bg-white/[0.03] text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            {missionsCompleted} quests done
          </span>
          <span className="px-2 py-1 rounded-md border border-white/10 bg-white/[0.03] text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            {academyCompletedCount} proofs
          </span>
        </div>

        {!compact && (
          <div className="mt-6 rounded-xl border border-white/8 bg-black/30 p-3">
            <ReputationGraph days={14} />
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={nextStep.onGo}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            {firstRitualPending ? 'Start Proof of Attention' : nextStep.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {onOpenFull && compact && (
            <button
              type="button"
              onClick={onOpenFull}
              className="px-4 py-3 rounded-xl border border-white/12 text-slate-300 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              Full passport
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">{nextStep.reason}</p>

        <div className="mt-5">
          <GrowthLoopPanel
            walletAddress={walletAddress}
            displayName={username}
            compact={compact}
          />
        </div>
      </div>
    </motion.section>
  );
}
