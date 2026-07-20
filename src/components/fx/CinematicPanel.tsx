/**
 * Facility cinematic shell — same energy as cold-start presentation panels.
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  CHAPTER_VISUALS,
  MoodArt,
  type StoryFormKind,
} from '../onboarding/StoryChapterArt';
import type { StoryChapterId } from '../../lib/human-economy';

export type FacilityMood = StoryChapterId | 'facility';

const FACILITY_MOOD: {
  wash: string;
  accent: 'cyan' | 'amber' | 'rose' | 'emerald';
  form: StoryFormKind;
} = {
  wash: 'from-[#050608]/30 via-[#050608]/70 to-[#050608]/95',
  accent: 'cyan',
  form: 'orbit',
};

type Props = {
  mood?: FacilityMood;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function CinematicPanel({
  mood = 'awakening',
  compact = false,
  className = '',
  children,
}: Props) {
  const visual =
    mood === 'facility'
      ? FACILITY_MOOD
      : {
          wash: CHAPTER_VISUALS[mood].wash,
          accent: CHAPTER_VISUALS[mood].accent,
          form: CHAPTER_VISUALS[mood].form,
        };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border border-white/12 bg-[#07080c] shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${className}`}
    >
      <MoodArt
        wash={visual.wash}
        accent={visual.accent}
        form={visual.form}
        compact={compact}
        plate="signal"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050608]/70 via-[#050608]/25 to-transparent" />
      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}
