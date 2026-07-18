/**
 * Read-only Human Passport from ?passport= share link — growth land.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Award } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import type { PassportSharePayload } from '../lib/passport-share';
import { CinematicBackdrop } from './fx';

type Props = {
  payload: PassportSharePayload;
  onStartPassport: () => void;
};

export default function PassportPreview({ payload, onStartPassport }: Props) {
  const creativity = payload.scores.creativity ?? payload.scores.builder;
  const achievements = payload.achievements?.length
    ? payload.achievements
    : ['Getting started'];

  return (
    <div className="min-h-screen bg-[#050608] text-slate-300 relative overflow-hidden">
      <div className="absolute inset-0">
        <CinematicBackdrop variant="ritual" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-5 py-16 md:py-24">
        <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-amber-400/90">
          Shared {BRAND.passport}
        </p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-cyan-400/35 bg-[#06080c]/95 p-6 md:p-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border border-cyan-400/40 bg-cyan-500/10 flex items-center justify-center text-cyan-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold italic text-white">
                {payload.name}
              </h1>
              <p className="text-[12px] text-slate-500">{SLOGANS.equation}</p>
            </div>
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Human Value Score
          </p>
          <p className="font-display text-5xl font-bold italic text-white leading-none mt-1">
            {payload.scores.humanValue}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { label: 'Knowledge', v: payload.scores.knowledge },
              { label: 'Creativity', v: creativity },
              { label: 'Contribution', v: payload.scores.contribution },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-black/30 px-2 py-3 text-center"
              >
                <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500">
                  {s.label}
                </p>
                <p className="mt-1 font-display text-xl font-bold italic text-white">{s.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {achievements.map((a) => (
              <span
                key={a}
                className="px-2 py-1 rounded-md border border-white/10 text-[10px] font-mono text-slate-400 uppercase tracking-wider"
              >
                {a}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-500 font-mono">
            Verified on {BRAND.parent}
          </p>
        </motion.div>
        <button
          type="button"
          onClick={onStartPassport}
          className="mt-8 w-full px-6 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer"
        >
          {SLOGANS.ctaPassport}
        </button>
        <p className="mt-3 text-center text-[12px] text-slate-500">
          {SLOGANS.awakeningZero} Own your reputation.
        </p>
      </div>
    </div>
  );
}
