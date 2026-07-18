/**
 * Public landing — cinematic story chapters first, then explore (pricing / community).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  JOURNEY_STEPS,
  PASSPORT_DIMENSIONS,
  PRICING_TIERS,
  PROOF_TYPES,
  STORY_CHAPTERS,
  joinWaitlist,
  type PricingTierId,
} from '../lib/human-economy';
import {
  COMMUNITY_LINKS,
  captureInviteFromUrl,
  inviteWelcomeLine,
} from '../lib/community-invite';
import { CinematicBackdrop } from './fx';
import { FarcasterCastDeck } from './FarcasterCastButton';
import MakeItRainDeck from './MakeItRainDeck';

type Props = {
  onBuildPassport: () => void;
  onContinueSecure?: () => void;
};

type LandingMode = 'story' | 'explore';

export default function HumanEconomyLanding({ onBuildPassport, onContinueSecure }: Props) {
  const reduceMotion = useReducedMotion();
  const economyRef = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<LandingMode>('story');
  const [chapter, setChapter] = useState(0);
  const [waitlistMsg, setWaitlistMsg] = useState<string | null>(null);
  const [inviteLine, setInviteLine] = useState<string | null>(null);

  const lastIndex = STORY_CHAPTERS.length - 1;
  const isLast = chapter >= lastIndex;
  const current = STORY_CHAPTERS[chapter] ?? STORY_CHAPTERS[0];

  useEffect(() => {
    const { record } = captureInviteFromUrl();
    setInviteLine(inviteWelcomeLine(record?.code));
  }, []);

  const goExplore = useCallback(() => {
    setMode('explore');
  }, []);

  const nextChapter = useCallback(() => {
    setChapter((c) => Math.min(lastIndex, c + 1));
  }, [lastIndex]);

  const prevChapter = useCallback(() => {
    setChapter((c) => Math.max(0, c - 1));
  }, []);

  useEffect(() => {
    if (mode !== 'explore') return;
    const id = window.requestAnimationFrame(() => {
      economyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'story') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (isLast) onBuildPassport();
        else nextChapter();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevChapter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, isLast, nextChapter, prevChapter, onBuildPassport]);

  const onWaitlist = (tier: PricingTierId) => {
    joinWaitlist(tier);
    setWaitlistMsg(
      tier === 'pro'
        ? "You're on the Human Passport Pro list — we'll reach out."
        : tier === 'company'
          ? 'Company interest recorded — Human Intelligence Platform waitlist.'
          : 'Creator marketplace interest recorded. Thank you.'
    );
  };

  if (mode === 'story') {
    return (
      <div className="relative h-[100dvh] overflow-hidden bg-[#050608] text-slate-300">
        <div className="fixed inset-0 pointer-events-none z-0">
          <CinematicBackdrop variant="duality" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050608]/35 via-[#050608]/80 to-[#050608]" />
        </div>

        <div className="relative z-10 flex h-full flex-col px-5 md:px-10 py-6 md:py-10 max-w-3xl mx-auto">
          <header className="flex items-center justify-between gap-3 shrink-0">
            <p className="font-mono text-[10px] font-black tracking-[0.32em] uppercase text-cyan-400/90">
              {BRAND.parent}
            </p>
            <div className="flex items-center gap-1.5" aria-hidden>
              {STORY_CHAPTERS.map((ch, i) => (
                <span
                  key={ch.id}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === chapter
                      ? 'w-6 bg-cyan-400'
                      : i < chapter
                        ? 'w-3 bg-cyan-400/50'
                        : 'w-3 bg-white/15'
                  }`}
                />
              ))}
            </div>
          </header>

          {inviteLine && chapter === 0 && (
            <p className="mt-4 shrink-0 max-w-xl rounded-xl border border-amber-400/25 bg-amber-950/35 px-4 py-3 text-sm text-amber-50/95 leading-relaxed">
              {inviteLine}
            </p>
          )}

          <div className="flex-1 flex flex-col justify-center min-h-0 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-amber-400/85">
                  {current.eyebrow}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold italic text-white tracking-tight leading-[1.12]">
                  {current.title}
                </h1>
                <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed font-sans">
                  {current.body}
                </p>
                {current.accent && (
                  <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed font-medium">
                    {current.accent}
                  </p>
                )}

                {current.id === 'awakening' && (
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PASSPORT_DIMENSIONS.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
                      >
                        <p className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/80">
                          {d.title}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 leading-snug">{d.line}</p>
                        <p className="mt-2 font-display text-2xl italic text-white/90">0</p>
                      </li>
                    ))}
                  </ul>
                )}

                {current.id === 'evolution' && (
                  <ol className="mt-2 grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {JOURNEY_STEPS.map((step, i) => (
                      <li
                        key={step.id}
                        className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3"
                      >
                        <span className="font-mono text-[9px] text-cyan-400/70 tracking-widest">
                          0{i + 1}
                        </span>
                        <p className="mt-1.5 font-semibold text-white text-sm">{step.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">{step.line}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="shrink-0 flex flex-col gap-3 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {isLast ? (
                <button
                  type="button"
                  onClick={onBuildPassport}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_40px_rgba(34,211,238,0.35)]"
                >
                  <Sparkles className="w-4 h-4" />
                  {SLOGANS.ctaPassport}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextChapter}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_40px_rgba(34,211,238,0.35)]"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {chapter >= 2 && (
                <button
                  type="button"
                  onClick={goExplore}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {SLOGANS.ctaExplore}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={prevChapter}
                disabled={chapter === 0}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-600 hover:text-slate-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label="Previous chapter"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              {chapter >= 2 && !isLast && (
                <button
                  type="button"
                  onClick={onBuildPassport}
                  className="text-[10px] font-mono uppercase tracking-wider text-slate-600 hover:text-cyan-400/80 cursor-pointer"
                >
                  Skip to passport
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-y-auto bg-[#050608] text-slate-300">
      <div className="fixed inset-0 pointer-events-none z-0">
        <CinematicBackdrop variant="duality" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050608]/40 via-[#050608]/85 to-[#050608]" />
      </div>

      <div className="relative z-10">
        <section className="px-5 md:px-10 pt-10 pb-8 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => {
              setMode('story');
              setChapter(0);
            }}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-300 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to story
          </button>
          <p className="mt-6 font-mono text-[10px] font-black tracking-[0.32em] uppercase text-cyan-400/90">
            {BRAND.parent} · {BRAND.product}
          </p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold italic text-white tracking-tight">
            {SLOGANS.hero}
          </h1>
          <p className="mt-4 text-slate-400 max-w-2xl leading-relaxed">{SLOGANS.mission}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBuildPassport}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_40px_rgba(34,211,238,0.35)]"
            >
              <Sparkles className="w-4 h-4" />
              {SLOGANS.ctaPassport}
            </button>
          </div>
          <div className="mt-8 max-w-xl space-y-4">
            <MakeItRainDeck />
            <FarcasterCastDeck />
          </div>
        </section>

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

        <section
          ref={economyRef}
          id="human-economy"
          className="px-5 md:px-10 py-20 border-t border-white/5 max-w-5xl mx-auto scroll-mt-8"
        >
          <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-cyan-400/80">
            The Human Economy
          </p>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold italic text-white">
            How you evolve
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

        <section className="px-5 md:px-10 py-16 border-t border-white/5 max-w-4xl mx-auto">
          <h2 className="font-display text-xl sm:text-2xl font-bold italic text-white">
            Human Passport
          </h2>
          <p className="mt-2 text-sm text-slate-400">{SLOGANS.awakeningZero}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {PASSPORT_DIMENSIONS.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-5 text-center"
              >
                <p className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/80">
                  {s.title}
                </p>
                <p className="mt-2 font-display text-3xl font-bold italic text-white">0</p>
              </div>
            ))}
          </div>
        </section>

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
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-mono text-slate-500">
            <a
              href={COMMUNITY_LINKS.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-300 transition-colors"
            >
              Telegram
            </a>
            <a
              href={COMMUNITY_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-300 transition-colors"
            >
              Discord
            </a>
            <a
              href={COMMUNITY_LINKS.hookLoop}
              className="hover:text-rose-300 transition-colors"
            >
              Hook Loop
            </a>
            <a
              href={COMMUNITY_LINKS.hearing}
              className="hover:text-cyan-300 transition-colors"
            >
              Hearing Mode
            </a>
          </p>
          <button
            type="button"
            onClick={onContinueSecure || onBuildPassport}
            className="mt-6 inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer"
          >
            Continue · create your passport <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </footer>
      </div>
    </div>
  );
}
