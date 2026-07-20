/**
 * Full-bleed level-up / first-moment celebration.
 */

import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CinematicBackdrop } from './fx';

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  level?: number;
  onDone: () => void;
};

export default function LevelUpFanfare({ open, title, subtitle, level, onDone }: Props) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onDone, reduceMotion ? 1600 : 2800);
    return () => window.clearTimeout(t);
  }, [open, onDone, reduceMotion]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="absolute inset-0 opacity-60 pointer-events-none">
            <CinematicBackdrop variant="ritual" />
          </div>
          {!reduceMotion && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute w-1.5 h-1.5 rounded-full bg-amber-300"
                  style={{
                    left: `${20 + (i % 6) * 12}%`,
                    top: `${30 + Math.floor(i / 6) * 25}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.6, 0],
                    y: [0, -40 - i * 4],
                  }}
                  transition={{ duration: 1.4, delay: i * 0.05 }}
                />
              ))}
            </>
          )}
          <motion.div
            initial={reduceMotion ? false : { scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative z-10 max-w-sm w-full text-center rounded-2xl border border-amber-400/50 bg-gradient-to-br from-[#1a1408]/95 via-[#0c0c12] to-cyan-950/40 px-6 py-8 shadow-[0_0_60px_rgba(251,191,36,0.35)]"
          >
            {typeof level === 'number' && (
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-amber-300 mb-2">
                Level {level}
              </p>
            )}
            <h2 className="font-display text-3xl md:text-4xl font-extrabold italic text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{subtitle}</p>
            )}
            <button
              type="button"
              onClick={onDone}
              className="mt-6 w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_28px_rgba(251,191,36,0.4)]"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
