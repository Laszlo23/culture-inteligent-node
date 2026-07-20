/**
 * Compact Level + XP bar — holographic identity chip.
 */

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  readLevelSnapshot,
  subscribePlayerProgress,
  type LevelSnapshot,
} from '../lib/player-progress';

type Props = {
  compact?: boolean;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
};

export default function PlayerLevelChip({
  compact = false,
  className = '',
  onClick,
  glow = true,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [snap, setSnap] = useState<LevelSnapshot>(() => readLevelSnapshot());
  const [pulse, setPulse] = useState(false);

  useEffect(
    () =>
      subscribePlayerProgress(() => {
        const next = readLevelSnapshot();
        setSnap((prev) => {
          if (next.level !== prev.level || next.totalXp !== prev.totalXp) {
            setPulse(true);
            window.setTimeout(() => setPulse(false), 700);
          }
          return next;
        });
      }),
    []
  );

  const glowPx = glow ? Math.min(42, 14 + snap.level * 1.3) : 0;
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-[#1f160a] via-[#0c0a10] to-[#061018] px-2.5 py-1.5 text-left ${
        onClick ? 'cursor-pointer hover:border-amber-300/70' : ''
      } ${pulse ? 'ring-2 ring-amber-300/70' : ''} ${className}`}
      style={
        glow
          ? {
              boxShadow: `0 0 ${glowPx}px rgba(251,191,36,${0.18 + Math.min(0.4, snap.level * 0.012)}), inset 0 0 20px rgba(34,211,238,0.06)`,
            }
          : undefined
      }
    >
      {!reduceMotion && (
        <>
          <motion.span
            className="pointer-events-none absolute -inset-px rounded-2xl border border-cyan-400/30"
            animate={{ opacity: [0.2, 0.65, 0.2] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="pointer-events-none absolute inset-0 holo-sheen opacity-70" />
        </>
      )}
      <div className="relative flex items-center gap-2">
        <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/95">
          Lv
        </span>
        <motion.span
          key={snap.level}
          initial={reduceMotion ? false : { scale: 1.35, opacity: 0.4, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="font-display text-xl font-extrabold italic text-white leading-none drop-shadow-[0_0_12px_rgba(251,191,36,0.55)]"
        >
          {snap.level}
        </motion.span>
        {!compact && (
          <div className="w-[4.5rem] sm:w-24">
            <div className="h-1.5 rounded-full bg-black/55 overflow-hidden border border-white/12">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-white to-cyan-400"
                initial={false}
                animate={{ width: `${snap.pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-0.5 font-mono text-[8px] text-slate-400 tracking-wide">
              {snap.xpIntoLevel}/{snap.xpForNext} XP
            </p>
          </div>
        )}
      </div>
    </Tag>
  );
}
