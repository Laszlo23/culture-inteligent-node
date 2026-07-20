/**
 * Tap-through explainer deck — cinematic shell, one job per slide.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { DeckSlide } from '../../lib/decks/types';
import CinematicPanel, { type FacilityMood } from './CinematicPanel';

type Props = {
  slides: DeckSlide[];
  className?: string;
  /** Default mood when a slide omits mood */
  mood?: FacilityMood;
  compact?: boolean;
  /** Fired when user taps a slide's ctaLabel */
  onCta?: (slideId: string) => void;
  /** Optional label on final slide when it has no ctaLabel */
  finishLabel?: string;
  onFinish?: () => void;
};

export default function InteractiveDeck({
  slides,
  className = '',
  mood = 'facility',
  compact = false,
  onCta,
  finishLabel,
  onFinish,
}: Props) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const last = slides.length - 1;
  const slide = slides[Math.min(index, last)];
  const panelMood = slide?.mood ?? mood;

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => Math.max(0, Math.min(last, i + dir)));
    },
    [last]
  );

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [go]);

  if (!slide || slides.length === 0) return null;

  const isLast = index >= last;
  const showFinish = isLast && (slide.ctaLabel || finishLabel);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Interactive presentation"
      className={`outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 rounded-2xl ${className}`}
      onTouchStart={(e) => {
        touchX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        if (start == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(dx) < 48) return;
        go(dx < 0 ? 1 : -1);
      }}
    >
      <CinematicPanel mood={panelMood} compact={compact}>
        <div className="flex min-h-[220px] flex-col justify-between gap-6 p-5 sm:p-7 md:min-h-[260px] md:p-8">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-1.5" aria-hidden>
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === index
                      ? 'w-7 bg-cyan-400'
                      : i < index
                        ? 'w-3 bg-cyan-400/50'
                        : 'w-3 bg-white/25'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300/90">
                  {slide.eyebrow}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold italic leading-tight tracking-tight text-white sm:text-3xl">
                  {slide.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200/95 sm:text-base">
                  {slide.body}
                </p>
                {slide.accent && (
                  <p className="mt-2 max-w-xl text-sm font-medium text-amber-100/90">
                    {slide.accent}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-black/35 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300 transition enabled:hover:border-white/25 enabled:hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <span className="font-mono text-[10px] tabular-nums text-slate-500">
              {index + 1} / {slides.length}
            </span>

            {showFinish ? (
              <button
                type="button"
                onClick={() => {
                  if (slide.ctaLabel) onCta?.(slide.id);
                  else onFinish?.();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-cyan-400 cursor-pointer"
              >
                {slide.ctaLabel || finishLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (slide.ctaLabel) {
                    onCta?.(slide.id);
                    return;
                  }
                  go(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-white/15 cursor-pointer"
              >
                {slide.ctaLabel || 'Next'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </CinematicPanel>
    </div>
  );
}
