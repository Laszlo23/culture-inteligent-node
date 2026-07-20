/**
 * Human Passport dashboard — cinematic presentation energy.
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import { resolveDisplayIdentity } from '../lib/display-identity';
import ReputationGraph from './ReputationGraph';
import GrowthLoopPanel from './GrowthLoopPanel';
import PassportShareCard from './PassportShareCard';
import CinematicPanel from './fx/CinematicPanel';
import PlayerLevelChip from './PlayerLevelChip';
import AchievementGallery from './AchievementGallery';
import LivingAmbient from './fx/LivingAmbient';
import FarcasterSocialPulse from './FarcasterSocialPulse';
import {
  readLevelSnapshot,
  subscribePlayerProgress,
  type LevelSnapshot,
} from '../lib/player-progress';

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
  farcasterUsername?: string | null;
  onLinkFarcaster?: (username: string) => void;
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
  farcasterUsername,
  onLinkFarcaster,
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
  const identity = resolveDisplayIdentity({
    username,
    walletAddress,
    progressTitle,
  });
  const handle = identity.handle;
  const [levelSnap, setLevelSnap] = useState<LevelSnapshot>(() => readLevelSnapshot());
  useEffect(() => subscribePlayerProgress(() => setLevelSnap(readLevelSnapshot())), []);
  const passportGlow = Math.min(48, 16 + levelSnap.level * 1.4);

  return (
    <CinematicPanel mood="awakening" compact={compact}>
      <div className={`relative ${compact ? 'p-5 md:p-6' : 'p-5 md:p-8'}`}>
        <LivingAmbient reactive={!compact} intensity="soft" />
        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="passport-level-glow w-14 h-14 rounded-2xl overflow-hidden border border-amber-400/35 bg-black/40 shrink-0"
              style={{
                boxShadow: `0 0 ${passportGlow}px rgba(245,158,11,${0.2 + Math.min(0.4, levelSnap.level * 0.012)})`,
              }}
            >
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
                {identity.isCultureName ? ' · .CULTURE' : ''}
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white truncate drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
                {identity.isCultureName
                  ? identity.handle
                  : progressTitle || identity.atHandle}
              </h2>
              {identity.isCultureName ? (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {progressTitle || SLOGANS.equation}
                  {progressBlurb && progressTitle ? ` · ${progressBlurb}` : ''}
                </p>
              ) : progressTitle ? (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {identity.atHandle}
                  {progressBlurb ? ` · ${progressBlurb}` : ''}
                </p>
              ) : (
                <p className="text-[12px] text-slate-200/85 mt-0.5">{SLOGANS.equation}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PlayerLevelChip />
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-[#1a1408]/80 via-black/55 to-[#061018]/70 px-4 py-3 text-right backdrop-blur-md shadow-[0_0_28px_rgba(251,191,36,0.18)]">
              <div className="pointer-events-none absolute inset-0 holo-sheen opacity-35" />
              <p className="relative font-mono text-[9px] uppercase tracking-widest text-amber-200/80">
                Your Human Value
              </p>
              <p className="relative font-display text-5xl font-bold italic text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-400 leading-none mt-1 value-slam">
                {scores.humanValue}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-[1] mt-7 flex flex-wrap gap-3">
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

        <div className="relative z-[1] mt-5 flex flex-wrap gap-1.5">
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

        <div className="relative z-[1] mt-5">
          <AchievementGallery compact={compact} />
        </div>

        <div className="relative z-[1] mt-5">
          <FarcasterSocialPulse
            walletAddress={walletAddress}
            farcasterUsername={farcasterUsername}
            compact={compact}
            onLinkedUsername={onLinkFarcaster}
          />
        </div>

        {!compact && (
          <div className="relative z-[1] mt-6 rounded-2xl border border-white/12 bg-black/45 p-3 backdrop-blur-md">
            <ReputationGraph days={14} />
          </div>
        )}

        <div className="relative z-[1] mt-6 flex flex-col sm:flex-row gap-2.5">
          <motion.button
            type="button"
            onClick={nextStep.onGo}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cta-breathe flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-mono text-[11px] font-black uppercase tracking-wider cursor-pointer"
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
        <p className="relative z-[1] mt-2.5 text-[12px] text-slate-200/80 leading-relaxed max-w-xl">
          {nextStep.reason}
        </p>

        <div className="relative z-[1] mt-5 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md p-1">
          <PassportShareCard name={handle} scores={scores} compact={compact} />
        </div>

        <div className="relative z-[1] mt-4 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md p-1">
          <GrowthLoopPanel
            walletAddress={walletAddress}
            displayName={handle}
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
