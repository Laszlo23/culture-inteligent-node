/**
 * Full-bleed level-up / first-moment celebration — Destiny-grade slam.
 */

import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CinematicBackdrop } from './fx';
import SpectacleBurst from './fx/SpectacleBurst';

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
    const t = window.setTimeout(onDone, reduceMotion ? 1800 : 3400);
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
          <motion.div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <div className="absolute inset-0 opacity-70 pointer-events-none">
            <CinematicBackdrop variant="ritual" />
          </div>
          {/* Sweep light */}
          {!reduceMotion && (
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-200/15 to-transparent skew-x-12"
              initial={{ left: '-40%', opacity: 0 }}
              animate={{ left: '120%', opacity: [0, 1, 0] }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
          )}

          <div className="relative z-10 w-full max-w-md">
            <SpectacleBurst active={!reduceMotion} tone="amber" density="full" />

            {typeof level === 'number' && (
              <motion.p
                initial={reduceMotion ? false : { scale: 2.2, opacity: 0, filter: 'blur(12px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                className="text-center font-display text-[5.5rem] sm:text-[7rem] font-black italic leading-none text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_0_40px_rgba(251,191,36,0.55)]"
              >
                {level}
              </motion.p>
            )}

            <motion.div
              initial={reduceMotion ? false : { scale: 0.88, y: 28, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.08 }}
              className="relative mt-1 text-center rounded-2xl border border-amber-400/55 bg-gradient-to-br from-[#1a1408]/95 via-[#0c0c12]/95 to-cyan-950/50 px-6 py-7 shadow-[0_0_80px_rgba(251,191,36,0.4)] overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 holo-sheen opacity-40" />
              <p className="relative font-mono text-[10px] font-black uppercase tracking-[0.32em] text-amber-300 mb-2">
                {typeof level === 'number' ? 'Level break' : 'Moment'}
              </p>
              <h2 className="relative font-display text-3xl md:text-4xl font-extrabold italic text-white tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="relative mt-2 text-sm text-slate-200/90 leading-relaxed">{subtitle}</p>
              )}
              <button
                type="button"
                onClick={onDone}
                className="cta-breathe relative mt-6 w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Continue
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
