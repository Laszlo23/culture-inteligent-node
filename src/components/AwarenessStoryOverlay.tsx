/**
 * Replayable cinematic Awareness Story — ship the message inside the product,
 * not only on cold start. Finish lands on a real next action.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import { STORY_CHAPTERS, type StoryChapterId } from '../lib/human-economy';
import { CHAPTER_VISUALS, MoodArt } from './onboarding/StoryChapterArt';
import { BRAND } from '../lib/brand-slogans';
import { track } from '../lib/attention-metrics';

export const AWARENESS_STORY_SEEN_KEY = 'culture_awareness_story_seen_v1';

export function hasSeenAwarenessStory(): boolean {
  try {
    return localStorage.getItem(AWARENESS_STORY_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markAwarenessStorySeen(): void {
  try {
    localStorage.setItem(AWARENESS_STORY_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** After last chapter — e.g. start Spark */
  onFinish: () => void;
  finishLabel?: string;
};

export default function AwarenessStoryOverlay({
  open,
  onClose,
  onFinish,
  finishLabel = 'Begin your first Spark',
}: Props) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const last = STORY_CHAPTERS.length - 1;
  const ch = STORY_CHAPTERS[index];
  const visual = CHAPTER_VISUALS[ch.id as StoryChapterId];

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    track('awareness_story_open', { where: 'overlay' });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (index >= last) {
          markAwarenessStorySeen();
          onFinish();
        } else setIndex((i) => Math.min(last, i + 1));
      }
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, last, onClose, onFinish]);

  if (!open) return null;

  const goNext = () => {
    if (index >= last) {
      markAwarenessStorySeen();
      track('awareness_story_complete', { chapters: STORY_CHAPTERS.length });
      onFinish();
      return;
    }
    setIndex((i) => i + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[85] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          aria-label="Close story"
          className="absolute inset-0 bg-black/70 cursor-pointer border-0"
          onClick={onClose}
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 200 }}
          className="relative z-10 w-full max-w-2xl mx-3 overflow-hidden rounded-3xl border border-white/15 shadow-[0_40px_100px_rgba(0,0,0,0.75)]"
          role="dialog"
          aria-modal="true"
          aria-label="Awareness story"
        >
          <div className="relative min-h-[min(72dvh,560px)] flex flex-col justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={ch.id}
                className="absolute inset-0"
                initial={reduce ? false : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.45 }}
              >
                <MoodArt
                  image={visual.image}
                  wash={visual.wash}
                  accent={visual.accent}
                  form={visual.form}
                  plate="photo"
                />
              </motion.div>
            </AnimatePresence>

            <div className="relative z-10 p-6 md:p-8 pb-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-cyan-300">
                  {BRAND.parent} · Story
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg border border-white/10 bg-black/40 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-1.5 mb-5">
                {STORY_CHAPTERS.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-1 rounded-full ${
                      i === index
                        ? 'bg-cyan-400'
                        : i < index
                          ? 'bg-cyan-400/50'
                          : 'bg-white/20'
                    }`}
                    animate={{ width: i === index ? 28 : 12 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={ch.id + '-copy'}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
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
                  <h2 className="mt-2 font-display text-3xl md:text-4xl font-extrabold italic text-white leading-[1.1] drop-shadow-[0_4px_28px_rgba(0,0,0,0.8)]">
                    {ch.title}
                  </h2>
                  <p className="mt-4 text-base text-slate-100/95 leading-relaxed max-w-xl">
                    {ch.body}
                  </p>
                  {ch.accent && (
                    <p className="mt-2 text-sm text-cyan-100/90 font-medium leading-relaxed">
                      {ch.accent}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => setIndex((i) => i - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-white/15 bg-black/45 text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <motion.button
                  type="button"
                  onClick={goNext}
                  whileHover={reduce ? undefined : { scale: 1.02 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="flex-1 min-w-[12rem] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white text-black font-mono text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.18)]"
                >
                  {index >= last ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {finishLabel}
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
              <p className="mt-3 text-center text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {index + 1} / {STORY_CHAPTERS.length} · tap or →
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
