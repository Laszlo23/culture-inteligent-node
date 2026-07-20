/**
 * Compact Level + XP bar — proud identity chip.
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
  /** Glow intensity scales with level */
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

  useEffect(() => subscribePlayerProgress(() => setSnap(readLevelSnapshot())), []);

  const glowPx = glow ? Math.min(36, 12 + snap.level * 1.2) : 0;
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-amber-400/35 bg-gradient-to-br from-[#1a1408]/95 to-[#0a080c] px-2.5 py-1.5 text-left ${
        onClick ? 'cursor-pointer hover:border-amber-300/55' : ''
      } ${className}`}
      style={
        glow
          ? { boxShadow: `0 0 ${glowPx}px rgba(251,191,36,${0.15 + Math.min(0.35, snap.level * 0.01)})` }
          : undefined
      }
    >
      {!reduceMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
          animate={{ x: ['-100%', '120%'] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
      )}
      <div className="relative flex items-center gap-2">
        <span className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-amber-300/90">
          Lv
        </span>
        <motion.span
          key={snap.level}
          initial={reduceMotion ? false : { scale: 1.2, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-display text-lg font-extrabold italic text-white leading-none"
        >
          {snap.level}
        </motion.span>
        {!compact && (
          <div className="w-16 sm:w-20">
            <div className="h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-400"
                initial={false}
                animate={{ width: `${snap.pct}%` }}
                transition={{ duration: 0.45 }}
              />
            </div>
            <p className="mt-0.5 font-mono text-[8px] text-slate-500 tracking-wide">
              {snap.xpIntoLevel}/{snap.xpForNext} XP
            </p>
          </div>
        )}
      </div>
    </Tag>
  );
}
