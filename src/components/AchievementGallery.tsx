/**
 * Passport achievement gallery — unlocked + ??? teasers.
 */

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ACHIEVEMENT_CATALOG,
  getAchievement,
  listUnlockedIds,
  lockedTeasers,
  type AchievementDef,
  type AchievementId,
  type AchievementRarity,
} from '../lib/achievements';
import { subscribeRewards } from '../lib/reward-bus';

function rarityClass(r: AchievementRarity, locked: boolean): string {
  if (locked) return 'border-white/10 bg-white/[0.03] text-slate-500';
  if (r === 'legendary') return 'border-amber-400/45 bg-amber-500/15 text-amber-100';
  if (r === 'rare') return 'border-cyan-400/40 bg-cyan-500/12 text-cyan-100';
  return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100';
}

export default function AchievementGallery({ compact = false }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [unlocked, setUnlocked] = useState<AchievementId[]>(() => listUnlockedIds());
  const [teasers, setTeasers] = useState<AchievementDef[]>(() => lockedTeasers(compact ? 2 : 3));

  const refresh = () => {
    setUnlocked(listUnlockedIds());
    setTeasers(lockedTeasers(compact ? 2 : 3));
  };

  useEffect(() => {
    refresh();
    let scheduled = 0;
    return subscribeRewards((e) => {
      if (e.kind !== 'badge' && e.kind !== 'level' && e.kind !== 'moment') return;
      // Coalesce burst unlocks into one gallery refresh
      if (scheduled) return;
      scheduled = window.setTimeout(() => {
        scheduled = 0;
        refresh();
      }, 50);
    });
  }, [compact]);

  const unlockedDefs = unlocked.map((id) => getAchievement(id));

  const show = unlockedDefs.slice(-6);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-[#12100a]/70 via-black/45 to-[#061018]/50 p-4 backdrop-blur-md shadow-[0_0_28px_rgba(251,191,36,0.08)]">
      <div className="pointer-events-none absolute inset-0 holo-sheen opacity-25" />
      <div className="relative flex items-center justify-between gap-2 mb-3">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-amber-300/90">
          Achievements
        </p>
        <p className="font-mono text-[10px] text-slate-500">
          {unlocked.length}/{ACHIEVEMENT_CATALOG.length}
        </p>
      </div>

      <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-2">
        {show.map((a, i) => (
          <motion.div
            key={a.id}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-xl border px-3 py-2.5 shadow-[0_0_18px_rgba(0,0,0,0.25)] ${rarityClass(a.rarity, false)}`}
          >
            <p className="font-display text-sm font-bold italic truncate">{a.title}</p>
            <p className="text-[10px] text-white/60 mt-0.5 line-clamp-2">{a.blurb}</p>
          </motion.div>
        ))}

        {teasers.map((a) => (
          <div
            key={`lock-${a.id}`}
            className={`relative overflow-hidden rounded-xl border px-3 py-2.5 ${rarityClass(a.rarity, true)}`}
          >
            <div className="blur-[3px] select-none">
              <p className="font-display text-sm font-bold italic">Hidden</p>
              <p className="text-[10px] mt-0.5">Keep going…</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-2xl font-black italic text-white/50">???</span>
            </div>
          </div>
        ))}

        {show.length === 0 && teasers.length === 0 && (
          <p className="col-span-full text-sm text-slate-500">Earn XP to unlock your first badge.</p>
        )}
      </div>
    </div>
  );
}
