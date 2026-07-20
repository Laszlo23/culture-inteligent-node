/**
 * Public landing — scroll-snap cinematic onboarding, then explore.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  JOURNEY_STEPS,
  PASSPORT_DIMENSIONS,
  PRICING_TIERS,
  PROOF_TYPES,
  STORY_CHAPTERS,
  joinWaitlist,
  type PricingTierId,
  type StoryChapterId,
} from '../lib/human-economy';
import { pickQuote } from '../lib/motivating-quotes';
import {
  COMMUNITY_LINKS,
  captureInviteFromUrl,
  inviteWelcomeLine,
} from '../lib/community-invite';
import { CinematicBackdrop } from './fx';
import { FarcasterCastDeck, OgShareDeck } from './FarcasterCastButton';
import MakeItRainDeck from './MakeItRainDeck';
import StoryChapterArt, { CHAPTER_VISUALS } from './onboarding/StoryChapterArt';

type Props = {
  onBuildPassport: () => void;
  onContinueSecure?: () => void;
};

type LandingMode = 'story' | 'explore';

const ACCENT_DOT: Record<(typeof CHAPTER_VISUALS)[StoryChapterId]['accent'], string> = {
  cyan: 'bg-cyan-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  emerald: 'bg-emerald-400',
};

export default function HumanEconomyLanding({ onBuildPassport, onContinueSecure }: Props) {
  const reduceMotion = useReducedMotion();
  const economyRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<LandingMode>('story');
  const [activeChapter, setActiveChapter] = useState(0);
  const [waitlistMsg, setWaitlistMsg] = useState<string | null>(null);
  const [inviteLine, setInviteLine] = useState<string | null>(null);

  const lastIndex = STORY_CHAPTERS.length - 1;
  const chapterQuote = pickQuote(`landing:${activeChapter}`);

  const { scrollYProgress } = useScroll({ container: scrollerRef });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  useEffect(() => {
    const { record } = captureInviteFromUrl();
    setInviteLine(inviteWelcomeLine(record?.code));
  }, []);

  const goExplore = useCallback(() => {
    setMode('explore');
  }, []);

  const scrollToChapter = useCallback(
    (index: number) => {
      const root = scrollerRef.current;
      const el = root?.querySelector<HTMLElement>(`[data-chapter="${index}"]`);
      if (!root || !el) return;
      root.scrollTo({
        top: el.offsetTop,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    },
    [reduceMotion]
  );

  useEffect(() => {
    if (mode !== 'explore') return;
    const id = window.requestAnimationFrame(() => {
      economyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'story' || !scrollerRef.current) return;
    const root = scrollerRef.current;
    const panels = [...root.querySelectorAll<HTMLElement>('[data-chapter]')];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Number((visible.target as HTMLElement).dataset.chapter);
        if (!Number.isNaN(idx)) setActiveChapter(idx);
      },
      { root, threshold: [0.45, 0.6] }
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [mode]);

  useEffect(() => {
    if (mode !== 'story') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (activeChapter >= lastIndex) onBuildPassport();
        else scrollToChapter(activeChapter + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToChapter(Math.max(0, activeChapter - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, activeChapter, lastIndex, scrollToChapter, onBuildPassport]);

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
      <div className="relative h-[100dvh] overflow-hidden bg-[#050608] text-slate-200">
        {/* Scroll progress */}
        <motion.div
          className="fixed left-0 top-0 z-40 h-[2px] origin-left bg-gradient-to-r from-cyan-400 via-amber-300 to-emerald-400"
          style={{ scaleX: progress }}
        />

        <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] md:px-10">
          <div className="pointer-events-auto">
            <p className="font-mono text-[10px] font-black tracking-[0.32em] uppercase text-cyan-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {BRAND.parent}
            </p>
            <p className="mt-1 font-display text-sm italic text-white/90">{BRAND.product}</p>
          </div>
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1.5 backdrop-blur-md">
            {STORY_CHAPTERS.map((ch, i) => {
              const accent = CHAPTER_VISUALS[ch.id].accent;
              return (
                <button
                  key={ch.id}
                  type="button"
                  aria-label={`Go to ${ch.eyebrow}`}
                  onClick={() => scrollToChapter(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeChapter
                      ? `w-7 ${ACCENT_DOT[accent]}`
                      : i < activeChapter
                        ? `w-3 ${ACCENT_DOT[accent]} opacity-55`
                        : 'w-3 bg-white/25'
                  }`}
                />
              );
            })}
          </div>
        </header>

        <div
          ref={scrollerRef}
          className="h-full overflow-y-auto overscroll-y-contain snap-y snap-mandatory scroll-smooth"
        >
          {STORY_CHAPTERS.map((ch, i) => {
            const isLast = i === lastIndex;
            const visual = CHAPTER_VISUALS[ch.id];
            return (
              <section
                key={ch.id}
                data-chapter={i}
                className="relative flex min-h-[100dvh] snap-start snap-always flex-col justify-end overflow-hidden px-5 pb-28 pt-28 md:px-10 md:pb-32"
              >
                <StoryChapterArt chapterId={ch.id} />

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.45 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 mx-auto w-full max-w-2xl"
                >
                  {inviteLine && i === 0 && (
                    <p className="mb-5 max-w-xl rounded-2xl border border-amber-400/30 bg-amber-950/50 px-4 py-3 text-sm leading-relaxed text-amber-50 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
                      {inviteLine}
                    </p>
                  )}

                  {i === activeChapter && (
                    <p className="mb-4 max-w-xl text-sm italic leading-relaxed text-white/75 drop-shadow-[0_2px_16px_rgba(0,0,0,0.65)]">
                      {chapterQuote}
                    </p>
                  )}

                  <p
                    className={`font-mono text-[10px] font-black uppercase tracking-[0.28em] ${
                      visual.accent === 'amber'
                        ? 'text-amber-300'
                        : visual.accent === 'rose'
                          ? 'text-rose-300'
                          : visual.accent === 'emerald'
                            ? 'text-emerald-300'
                            : 'text-cyan-300'
                    }`}
                  >
                    {ch.eyebrow}
                  </p>
                  <h1 className="mt-3 font-display text-4xl font-bold italic leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.75)] sm:text-5xl md:text-6xl">
                    {ch.title}
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-100/95 sm:text-lg">
                    {ch.body}
                  </p>
                  {ch.accent && (
                    <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-cyan-100/90 sm:text-base">
                      {ch.accent}
                    </p>
                  )}

                  {ch.id === 'awakening' && (
                    <ul className="mt-6 grid grid-cols-3 gap-2">
                      {PASSPORT_DIMENSIONS.map((d) => (
                        <li
                          key={d.id}
                          className="rounded-2xl border border-white/15 bg-black/45 px-3 py-3 backdrop-blur-md"
                        >
                          <p className="font-mono text-[9px] uppercase tracking-widest text-amber-300/90">
                            {d.title}
                          </p>
                          <p className="mt-2 font-display text-3xl italic text-white">0</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {ch.id === 'evolution' && (
                    <ol className="mt-6 flex gap-2 overflow-x-auto pb-1">
                      {JOURNEY_STEPS.map((step, si) => (
                        <li
                          key={step.id}
                          className="min-w-[7.5rem] shrink-0 rounded-2xl border border-white/12 bg-black/45 px-3 py-3 backdrop-blur-md"
                        >
                          <span className="font-mono text-[9px] tracking-widest text-emerald-300/80">
                            0{si + 1}
                          </span>
                          <p className="mt-1.5 text-sm font-semibold text-white">{step.title}</p>
                        </li>
                      ))}
                    </ol>
                  )}

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    {isLast ? (
                      <button
                        type="button"
                        onClick={onBuildPassport}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3.5 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[0_0_48px_rgba(34,211,238,0.45)] hover:bg-cyan-300 cursor-pointer"
                      >
                        <Sparkles className="h-4 w-4" />
                        {SLOGANS.ctaPassport}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => scrollToChapter(i + 1)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-mono text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-100 cursor-pointer"
                      >
                        Scroll onward
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    )}
                    {i >= 2 && (
                      <button
                        type="button"
                        onClick={goExplore}
                        className="inline-flex items-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-300/80 hover:text-white cursor-pointer"
                      >
                        {SLOGANS.ctaExplore}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </section>
            );
          })}
        </div>

        <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 bg-gradient-to-t from-[#050608] via-[#050608]/85 to-transparent md:px-10">
          <button
            type="button"
            onClick={() => scrollToChapter(Math.max(0, activeChapter - 1))}
            disabled={activeChapter === 0}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-300 backdrop-blur-md hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <p className="pointer-events-none font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400">
            {activeChapter + 1} / {STORY_CHAPTERS.length}
          </p>
          {activeChapter >= lastIndex ? (
            <button
              type="button"
              onClick={onBuildPassport}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3.5 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-black cursor-pointer"
            >
              Begin
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => scrollToChapter(activeChapter + 1)}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-200 backdrop-blur-md hover:text-white cursor-pointer"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </footer>
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
              setActiveChapter(0);
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
          <div className="mt-8 max-w-2xl space-y-4">
            <OgShareDeck />
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
