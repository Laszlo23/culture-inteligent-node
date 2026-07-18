/**
 * Persistent momentum strip — shows long-session climb toward next reward.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';

type Props = {
  beats: number;
  nextAt: number | null;
  progress: number;
};

export default function PlayMomentumBar({ beats, nextAt, progress }: Props) {
  if (beats < 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-1 mb-0 z-30 relative"
    >
      <div className="rounded-xl border border-white/10 bg-[#0a0a0c]/85 backdrop-blur-md px-3 py-2 flex items-center gap-3 shadow-lg">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/25 to-cyan-500/25 border border-white/10 flex items-center justify-center shrink-0">
          <Flame className="w-3.5 h-3.5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2 mb-1">
            <span className="text-[9px] font-mono font-black tracking-widest uppercase text-slate-200">
              Session momentum · ×{beats}
            </span>
            <span className="text-[8px] font-mono text-slate-500 shrink-0">
              {nextAt != null ? `Next reward @ ×${nextAt}` : 'Peak duality — keep playing'}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-black/60 border border-white/5 overflow-hidden flex">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-cyan-400"
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
