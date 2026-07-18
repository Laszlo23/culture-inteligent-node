/**
 * Personalized facility home — greets the operator by name and mirrors their loop.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Battery,
  Flame,
  Images,
  Sparkles,
  User,
} from 'lucide-react';
import type { GameState } from '../types';
import { EnergyFlow, GlowPulse } from './fx';
import type { NavDestination } from './NavMenu';

export type PersonalNextStep = {
  id: NavDestination;
  label: string;
  reason: string;
};

type Props = {
  username: string;
  avatarUrl?: string;
  aboutMe?: string;
  state: GameState;
  firstRitualPending: boolean;
  academyCompletedCount: number;
  coreSessionTotal: number;
  streak: number;
  nextStep: PersonalNextStep;
  onNavigate: (room: NavDestination) => void;
};

function timeGreeting(hour: number): string {
  if (hour < 5) return 'Still awake';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Late signal';
}

function personalLine(opts: {
  firstRitualPending: boolean;
  energy: number;
  academyCompletedCount: number;
  streak: number;
  username: string;
}): string {
  if (opts.firstRitualPending) {
    return `${opts.username}, your node is dark on purpose — one short spark and it becomes yours.`;
  }
  if (opts.energy < 35) {
    return `Your fuel is low, ${opts.username}. A few focused minutes bring the reactor back.`;
  }
  if (opts.streak >= 3) {
    return `Streak ×${opts.streak} — you’re building a real attention habit. Keep the loop warm.`;
  }
  if (opts.academyCompletedCount === 0) {
    return `Welcome in, ${opts.username}. The facility opens as you prove attention.`;
  }
  if (opts.academyCompletedCount === 1) {
    return `First Spark is yours. Hook Mirror is the next mirror — if you’re ready.`;
  }
  if (opts.energy >= 70) {
    return `Node charged, ${opts.username}. Mining feeds can wake — or keep learning.`;
  }
  return `You’re in the loop, ${opts.username}. Knowledge first — then decide.`;
}

export default function PersonalHomeHero({
  username,
  avatarUrl,
  aboutMe,
  state,
  firstRitualPending,
  academyCompletedCount,
  coreSessionTotal,
  streak,
  nextStep,
  onNavigate,
}: Props) {
  const hour = useMemo(() => new Date().getHours(), []);
  const greet = timeGreeting(hour);
  const handle = username.replace(/^@/, '') || 'operator';
  const line = personalLine({
    firstRitualPending,
    energy: state.energy,
    academyCompletedCount,
    streak,
    username: handle,
  });
  const coreDone = Math.min(academyCompletedCount, coreSessionTotal);
  const ownedRigs = (state.minerNFTs || []).length;
  const shortBio = aboutMe?.trim().slice(0, 72);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#08090e]/90 p-5 md:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -left-12 bottom-0 w-56 h-56 rounded-full bg-amber-500/8 blur-3xl" />
      </div>
      <GlowPulse
        energy={Math.max(12, state.energy)}
        color={state.energy < 40 ? 'orange' : 'cyan'}
        className="absolute right-4 top-4 w-28 h-28 opacity-60"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-stretch gap-6">
        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3.5">
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden border border-cyan-400/35 bg-cyan-500/10 cursor-pointer group"
              title="Open your profile"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  draggable={false}
                />
              ) : (
                <span className="h-full w-full flex items-center justify-center text-cyan-300">
                  <User className="w-6 h-6" />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-400 to-amber-400" />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] font-mono tracking-[0.22em] uppercase text-cyan-400/90">
                {greet} · your node
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight mt-0.5 truncate">
                @{handle}
              </h2>
              {shortBio ? (
                <p className="mt-1 text-[11px] text-slate-400 font-sans leading-snug line-clamp-2">
                  {shortBio}
                  {(aboutMe?.trim().length ?? 0) > 72 ? '…' : ''}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500 font-sans leading-snug">
                  {line}
                </p>
              )}
              {shortBio && (
                <p className="mt-1.5 text-[11px] text-slate-400 font-sans leading-snug">{line}</p>
              )}
            </div>
          </div>

          {/* Personal vitals */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Vital
              label="Your fuel"
              value={`${Math.round(state.energy)}%`}
              accent={state.energy < 40 ? 'text-orange-300' : 'text-cyan-300'}
              icon={<Battery className="w-3 h-3" />}
            />
            <Vital
              label="Streak"
              value={streak > 0 ? `×${streak}` : '—'}
              accent="text-amber-300"
              icon={<Flame className="w-3 h-3" />}
            />
            <Vital
              label="Sessions"
              value={`${coreDone}/${coreSessionTotal}`}
              accent="text-fuchsia-300"
              icon={<Sparkles className="w-3 h-3" />}
            />
            <Vital
              label="Rigs"
              value={String(ownedRigs)}
              accent="text-emerald-300"
              icon={<Images className="w-3 h-3" />}
            />
          </div>

          <div className="mt-3 max-w-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                Knowledge fuel
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {Math.round(state.energy)}%
              </span>
            </div>
            <EnergyFlow energy={state.energy} className="h-2" />
          </div>
        </div>

        {/* Personal next move */}
        <div className="lg:w-[min(100%,20rem)] shrink-0 flex flex-col justify-between rounded-2xl border border-cyan-400/25 bg-black/40 backdrop-blur-sm p-4">
          <div>
            <p className="text-[9px] font-mono font-black tracking-[0.24em] uppercase text-amber-400/90">
              For you right now
            </p>
            <h3 className="mt-2 font-display text-lg font-bold text-white leading-snug">
              {nextStep.label}
            </h3>
            <p className="mt-2 text-[12px] text-slate-400 font-sans leading-relaxed">
              {nextStep.reason}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(nextStep.id)}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-[0_0_28px_rgba(34,211,238,0.3)]"
          >
            {firstRitualPending ? 'Start your spark' : 'Continue'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {!firstRitualPending && (
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="mt-2 w-full text-center text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-300 cursor-pointer"
            >
              Edit your card →
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function Vital({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2">
      <span className="flex items-center gap-1 text-[8px] font-mono uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </span>
      <span className={`mt-0.5 block text-sm font-black font-mono ${accent}`}>{value}</span>
    </div>
  );
}
