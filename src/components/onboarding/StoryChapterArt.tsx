/**
 * Emotional full-bleed art for cold-start scroll chapters.
 * Mix of campaign stills + abstract forms — no stock card collage.
 */

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { StoryChapterId } from '../../lib/human-economy';

export type ChapterVisual = {
  image: string;
  /** Soft brand wash over the plate */
  wash: string;
  /** Accent for forms / progress */
  accent: 'cyan' | 'amber' | 'rose' | 'emerald';
  form: 'orbit' | 'scale' | 'passport' | 'spark' | 'path';
};

export const CHAPTER_VISUALS: Record<StoryChapterId, ChapterVisual> = {
  opening: {
    image: '/campaign/mine-culture.webp',
    wash: 'from-[#050608]/25 via-[#050608]/55 to-[#050608]',
    accent: 'cyan',
    form: 'orbit',
  },
  problem: {
    image: '/campaign/failure-curve.webp',
    wash: 'from-[#0a0608]/30 via-[#050608]/70 to-[#050608]',
    accent: 'rose',
    form: 'scale',
  },
  awakening: {
    image: '/atmosphere/arena-hero.webp',
    wash: 'from-[#050810]/35 via-[#050608]/65 to-[#050608]',
    accent: 'amber',
    form: 'passport',
  },
  spark: {
    image: '/campaign/culture-club.webp',
    wash: 'from-[#060a10]/30 via-[#050608]/60 to-[#050608]',
    accent: 'cyan',
    form: 'spark',
  },
  evolution: {
    image: '/campaign/spread-love.webp',
    wash: 'from-[#08060a]/30 via-[#050608]/65 to-[#050608]',
    accent: 'emerald',
    form: 'path',
  },
};

const ACCENT: Record<ChapterVisual['accent'], { glow: string; stroke: string; fill: string }> = {
  cyan: {
    glow: 'rgba(34,211,238,0.35)',
    stroke: 'rgba(34,211,238,0.75)',
    fill: 'rgba(34,211,238,0.12)',
  },
  amber: {
    glow: 'rgba(245,158,11,0.35)',
    stroke: 'rgba(251,191,36,0.8)',
    fill: 'rgba(245,158,11,0.14)',
  },
  rose: {
    glow: 'rgba(251,113,133,0.32)',
    stroke: 'rgba(251,113,133,0.75)',
    fill: 'rgba(251,113,133,0.12)',
  },
  emerald: {
    glow: 'rgba(52,211,153,0.32)',
    stroke: 'rgba(52,211,153,0.75)',
    fill: 'rgba(52,211,153,0.12)',
  },
};

function OrbitForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="orbitGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="120" fill="url(#orbitGlow)" />
      <motion.circle
        cx="200"
        cy="200"
        r="88"
        fill="none"
        stroke={c.stroke}
        strokeWidth="1.2"
        strokeDasharray="6 10"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '200px 200px' }}
      />
      <motion.circle
        cx="200"
        cy="200"
        r="128"
        fill="none"
        stroke={c.stroke}
        strokeWidth="0.8"
        opacity={0.5}
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '200px 200px' }}
      />
      <circle cx="200" cy="200" r="18" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      <motion.circle
        cx="288"
        cy="200"
        r="6"
        fill={c.stroke}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '200px 200px' }}
      />
    </svg>
  );
}

function ScaleForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      {/* Broken industrial scale → contribution bloom */}
      <line x1="80" y1="220" x2="320" y2="220" stroke="rgba(148,163,184,0.35)" strokeWidth="2" />
      <motion.rect
        x="95"
        y="150"
        width="70"
        height="50"
        rx="8"
        fill="rgba(148,163,184,0.12)"
        stroke="rgba(148,163,184,0.4)"
        animate={reduce ? undefined : { y: [150, 158, 150] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <text x="130" y="180" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="14" fontFamily="monospace">
        TIME
      </text>
      <motion.g
        animate={reduce ? undefined : { y: [0, -10, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '270px 175px' }}
      >
        <circle cx="270" cy="175" r="36" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
        <text x="270" y="180" textAnchor="middle" fill={c.stroke} fontSize="13" fontFamily="monospace">
          YOU
        </text>
      </motion.g>
      <motion.path
        d="M200 240 C200 280, 160 310, 120 330"
        fill="none"
        stroke="rgba(148,163,184,0.25)"
        strokeWidth="2"
        strokeDasharray="4 6"
      />
      <motion.path
        d="M200 240 C200 270, 240 300, 300 320"
        fill="none"
        stroke={c.stroke}
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

function PassportForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <motion.rect
        x="110"
        y="70"
        width="180"
        height="240"
        rx="22"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
        animate={reduce ? undefined : { y: [70, 64, 70] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx="200" cy="150" r="34" fill="rgba(5,6,8,0.5)" stroke={c.stroke} strokeWidth="1.2" />
      <path
        d="M175 210 h50 M160 235 h80 M160 255 h80 M160 275 h55"
        stroke={c.stroke}
        strokeWidth="3"
        strokeLinecap="round"
        opacity={0.55}
      />
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={140 + i * 60}
          cy="340"
          r="8"
          fill={c.stroke}
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35 }}
        />
      ))}
    </svg>
  );
}

function SparkForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="sparkCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.glow} />
          <stop offset="55%" stopColor={c.fill} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="90" fill="url(#sparkCore)" />
      <motion.g
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '200px 200px' }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="200"
            y1="200"
            x2={200 + Math.cos((deg * Math.PI) / 180) * 110}
            y2={200 + Math.sin((deg * Math.PI) / 180) * 110}
            stroke={c.stroke}
            strokeWidth="1.5"
            opacity={0.55}
          />
        ))}
      </motion.g>
      <motion.circle
        cx="200"
        cy="200"
        r="22"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="2"
        animate={reduce ? undefined : { scale: [1, 1.2, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '200px 200px' }}
      />
    </svg>
  );
}

function PathForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  const nodes = [
    { x: 60, y: 280, label: '01' },
    { x: 130, y: 200, label: '02' },
    { x: 200, y: 150, label: '03' },
    { x: 270, y: 180, label: '04' },
    { x: 340, y: 120, label: '05' },
  ];
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <motion.path
        d="M60 280 C100 240, 110 220, 130 200 S180 160, 200 150 S250 170, 270 180 S310 140, 340 120"
        fill="none"
        stroke={c.stroke}
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, ease: 'easeInOut' }}
      />
      {nodes.map((n, i) => (
        <motion.g
          key={n.label}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 + i * 0.2 }}
        >
          <motion.circle
            cx={n.x}
            cy={n.y}
            r="14"
            fill={c.fill}
            stroke={c.stroke}
            strokeWidth="1.5"
            animate={reduce ? undefined : { scale: i === nodes.length - 1 ? [1, 1.12, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fill={c.stroke}
            fontSize="9"
            fontFamily="monospace"
          >
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

export const STORY_FORMS = {
  orbit: OrbitForms,
  scale: ScaleForms,
  passport: PassportForms,
  spark: SparkForms,
  path: PathForms,
} as const;

export type StoryFormKind = keyof typeof STORY_FORMS;

type MoodArtProps = {
  image: string;
  wash: string;
  accent: ChapterVisual['accent'];
  form: StoryFormKind;
  className?: string;
  /** Smaller form for embedded dashboard cards */
  compact?: boolean;
};

/** Shared plate used by cold-start chapters and facility panels. */
export function MoodArt({
  image,
  wash,
  accent,
  form,
  className = '',
  compact = false,
}: MoodArtProps) {
  const Form = STORY_FORMS[form];
  const reduce = useReducedMotion();

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <motion.img
        key={image}
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        initial={reduce ? false : { scale: 1.06, opacity: 0.75 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        draggable={false}
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${wash}`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_70%_35%,transparent_0%,rgba(5,6,8,0.55)_70%,rgba(5,6,8,0.92)_100%)]" />

      <div
        className={`pointer-events-none absolute opacity-90 ${
          compact
            ? '-right-8 -top-4 h-[14rem] w-[14rem] md:h-[16rem] md:w-[16rem]'
            : '-right-6 top-[12%] h-[55vmin] w-[55vmin] md:right-[6%] md:top-[8%] md:h-[62vmin] md:w-[62vmin]'
        }`}
      >
        <Form accent={accent} />
      </div>

      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
}

type Props = {
  chapterId: StoryChapterId;
  className?: string;
};

export default function StoryChapterArt({ chapterId, className = '' }: Props) {
  const visual = CHAPTER_VISUALS[chapterId];
  return (
    <MoodArt
      image={visual.image}
      wash={visual.wash}
      accent={visual.accent}
      form={visual.form}
      className={className}
    />
  );
}
