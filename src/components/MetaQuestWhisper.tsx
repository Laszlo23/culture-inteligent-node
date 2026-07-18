/**
 * Outer Circuit whisper — hidden quest UI. Cryptic until chapters close.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, ChevronRight, Sparkles } from 'lucide-react';
import type { MetaQuestView } from '../lib/meta-quest';

type Props = {
  view: MetaQuestView;
  onFollow: (roomId: string) => void;
};

export default function MetaQuestWhisper({ view, onFollow }: Props) {
  const [open, setOpen] = useState(false);

  if (!view.discovered && !view.sealed) return null;

  if (view.sealed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-1 rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-950/40 via-[#0a0a0c]/90 to-cyan-950/30 px-3.5 py-2.5 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[9px] font-mono font-black tracking-[0.2em] uppercase text-amber-300/90 block">
            Outer Circuit · sealed
          </span>
          <p className="text-[11px] text-slate-400 font-sans leading-snug mt-0.5">
            The quiet path above daily quests is complete. Keep training — momentum still rewards depth.
          </p>
        </div>
      </motion.div>
    );
  }

  const chapter = view.current;
  if (!chapter) return null;

  return (
    <div className="mx-4 mt-1 relative z-30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-white/10 bg-[#08080c]/88 backdrop-blur-md px-3.5 py-2.5 flex items-center gap-3 text-left hover:border-violet-400/30 transition-colors cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-400/25 flex items-center justify-center shrink-0 group-hover:bg-violet-500/25 transition-colors">
          <Eye className="w-3.5 h-3.5 text-violet-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-mono font-black tracking-[0.18em] uppercase text-violet-300/80">
              ⋯ a quieter path
            </span>
            <span className="text-[8px] font-mono text-slate-600 shrink-0">
              {view.completedCount}/{view.total}
            </span>
          </div>
          <p className="text-[11px] text-slate-300/90 font-sans leading-snug mt-0.5 italic truncate">
            {chapter.whisper}
          </p>
          <div className="mt-1.5 h-1 rounded-full bg-black/50 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500/80 to-cyan-400/70"
              animate={{ width: `${Math.round(view.progress * 100)}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
            />
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 rounded-xl border border-violet-400/20 bg-[#0a0a10]/95 px-3.5 py-3 space-y-2">
              <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                A private circuit above daily missions — just for you. One chapter at a time. No
                checklist until you earn the reveal.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onFollow(chapter.room);
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/35 text-violet-100 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                Step into the whisper
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
