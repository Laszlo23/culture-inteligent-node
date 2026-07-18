/**
 * Public landing — Human Economy mission, loop, pricing.
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  JOURNEY_STEPS,
  PRICING_TIERS,
  PROOF_TYPES,
  joinWaitlist,
  type PricingTierId,
} from '../lib/human-economy';
import { CinematicBackdrop } from './fx';

type Props = {
  onBuildPassport: () => void;
  onContinueSecure?: () => void;
};

export default function HumanEconomyLanding({ onBuildPassport, onContinueSecure }: Props) {
  const economyRef = useRef<HTMLElement | null>(null);
  const [waitlistMsg, setWaitlistMsg] = useState<string | null>(null);

  const scrollExplore = () => {
    economyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onWaitlist = (tier: PricingTierId) => {
    joinWaitlist(tier);
    setWaitlistMsg(
      tier === 'pro'
        ? 'You\'re on the Human Passport Pro list — we\'ll reach out.'
        : tier === 'company'
          ? 'Company interest recorded — Human Intelligence Platform waitlist.'
          : 'Creator marketplace interest recorded. Thank you.'
    );
  };

  return (
    <div className="relative min-h-[100dvh] overflow-y-auto bg-[#050608] text-slate-300">
      <div className="fixed inset-0 pointer-events-none z-0">
        <CinematicBackdrop variant="duality" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050608]/40 via-[#050608]/85 to-[#050608]" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="min-h-[100dvh] flex flex-col justify-center px-5 md:px-10 py-16 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[10px] font-black tracking-[0.32em] uppercase text-cyan-400/90"
          >
            {BRAND.parent} · {BRAND.product}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 font-display text-4xl sm:text-5xl md:text-6xl font-extrabold italic text-white tracking-tight leading-[1.05]"
          >
            {SLOGANS.hero}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-sans"
          >
            For centuries we measured people by the hours they worked.
            <br className="hidden sm:block" />
            <span className="text-slate-300"> The AI era requires a new measurement:</span>
            <br />
            <span className="text-white font-medium">
              What you learn. What you create. What you contribute.
            </span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-3"
          >
            <button
              type="button"
              onClick={onBuildPassport}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_40px_rgba(34,211,238,0.35)]"
            >
              <Sparkles className="w-4 h-4" />
              {SLOGANS.ctaPassport}
            </button>
            <button
              type="button"
              onClick={scrollExplore}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 hover:border-white/30 text-slate-200 font-mono text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              {SLOGANS.ctaExplore}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
          <p className="mt-6 text-[11px] text-slate-500 font-mono tracking-wide">
            {SLOGANS.equation} · You own your digital reputation.
          </p>
        </section>

        {/* Problem */}
        <section className="px-5 md:px-10 py-20 border-t border-white/5 max-w-4xl mx-auto">
          <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-amber-400/80">
            The problem
          </p>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold italic text-white">
            Why does my attention have value?
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed max-w-2xl">
            {SLOGANS.timeMoney} AI can create content, code, and knowledge at scale — so human
            worth can no longer be measured by hours spent. The future economy measures learning,
            creativity, problem solving, curiosity, collaboration, and contribution.
          </p>
        </section>

        {/* Loop */}
        <section
          ref={economyRef}
          id="human-economy"
          className="px-5 md:px-10 py-20 border-t border-white/5 max-w-5xl mx-auto scroll-mt-8"
        >
          <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-cyan-400/80">
            The Human Economy
          </p>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold italic text-white">
            How reputation is built
          </h2>
          <ol className="mt-8 grid sm:grid-cols-5 gap-3">
            {JOURNEY_STEPS.map((step, i) => (
              <li
                key={step.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
              >
                <span className="font-mono text-[9px] text-cyan-400/70 tracking-widest">
                  0{i + 1}
                </span>
                <p className="mt-2 font-semibold text-white text-sm">{step.title}</p>
                <p className="mt-1 text-[11px] text-slate-500 leading-snug">{step.line}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Proof types */}
        <section className="px-5 md:px-10 py-16 border-t border-white/5 max-w-4xl mx-auto">
          <h2 className="font-display text-xl sm:text-2xl font-bold italic text-white">
            Proof of Attention
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Short challenges — not empty scrolling. Knowledge, creativity, problem solving,
            reflection.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROOF_TYPES.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/8 bg-[#0a0a0e]/80 px-3 py-3"
              >
                <p className="text-sm font-semibold text-white">{t.label}</p>
                <p className="text-[11px] text-slate-500 mt-1">{t.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Passport preview */}
        <section className="px-5 md:px-10 py-16 border-t border-white/5 max-w-4xl mx-auto">
          <h2 className="font-display text-xl sm:text-2xl font-bold italic text-white">
            Human Passport
          </h2>
          <p className="mt-2 text-sm text-slate-400">Your human value — measurable and ownable.</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Knowledge', v: 42 },
              { label: 'Builder', v: 28 },
              { label: 'Contribution', v: 35 },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-5 text-center"
              >
                <p className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/80">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-3xl font-bold italic text-white">{s.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="px-5 md:px-10 py-20 border-t border-white/5 max-w-5xl mx-auto">
          <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-amber-400/80">
            How we grow
          </p>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold italic text-white">
            Clear business model
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Individuals. Companies. Creators. Join the waitlist — billing ships next.
          </p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className="rounded-2xl border border-white/10 bg-[#0a0a0e]/90 p-5 flex flex-col"
              >
                <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                  {tier.audience}
                </p>
                <h3 className="mt-2 font-semibold text-white text-lg">{tier.name}</h3>
                <p className="mt-1 font-display text-xl italic text-cyan-300">{tier.price}</p>
                <ul className="mt-4 space-y-1.5 text-[12px] text-slate-400 flex-1">
                  {tier.includes.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onWaitlist(tier.id)}
                  className="mt-5 w-full py-2.5 rounded-xl border border-white/15 hover:border-cyan-400/40 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Join waitlist
                </button>
              </div>
            ))}
          </div>
          {waitlistMsg && (
            <p className="mt-4 text-sm text-emerald-300/90">{waitlistMsg}</p>
          )}
        </section>

        <footer className="px-5 md:px-10 py-12 border-t border-white/5 max-w-4xl mx-auto text-center">
          <p className="font-display text-lg italic text-white">{BRAND.parent}</p>
          <p className="mt-2 text-sm text-slate-500">{SLOGANS.ownership}</p>
          <button
            type="button"
            onClick={onContinueSecure || onBuildPassport}
            className="mt-6 inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer"
          >
            Continue · secure your passport <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </footer>
      </div>
    </div>
  );
}
