/**
 * Signal-field art for cold-start chapters + facility panels.
 * Crisp geometry over soft liquid photos — future, clear, on-brand.
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
    image: '/story/ch-opening.webp',
    wash: 'from-[#050608]/55 via-[#050608]/75 to-[#050608]',
    accent: 'cyan',
    form: 'orbit',
  },
  problem: {
    image: '/story/ch-problem.webp',
    wash: 'from-[#0a0608]/60 via-[#050608]/80 to-[#050608]',
    accent: 'rose',
    form: 'scale',
  },
  awakening: {
    image: '/story/ch-awakening.webp',
    wash: 'from-[#050810]/60 via-[#050608]/80 to-[#050608]',
    accent: 'amber',
    form: 'passport',
  },
  spark: {
    image: '/story/ch-spark.webp',
    wash: 'from-[#060a10]/55 via-[#050608]/78 to-[#050608]',
    accent: 'cyan',
    form: 'spark',
  },
  evolution: {
    image: '/story/ch-evolution.webp',
    wash: 'from-[#08060a]/55 via-[#050608]/80 to-[#050608]',
    accent: 'emerald',
    form: 'path',
  },
};

const ACCENT: Record<
  ChapterVisual['accent'],
  { glow: string; stroke: string; fill: string; soft: string }
> = {
  cyan: {
    glow: 'rgba(34,211,238,0.22)',
    stroke: 'rgba(103,232,249,0.9)',
    fill: 'rgba(34,211,238,0.08)',
    soft: 'rgba(34,211,238,0.12)',
  },
  amber: {
    glow: 'rgba(245,158,11,0.22)',
    stroke: 'rgba(252,211,77,0.92)',
    fill: 'rgba(245,158,11,0.1)',
    soft: 'rgba(245,158,11,0.12)',
  },
  rose: {
    glow: 'rgba(251,113,133,0.2)',
    stroke: 'rgba(253,164,175,0.9)',
    fill: 'rgba(251,113,133,0.08)',
    soft: 'rgba(251,113,133,0.12)',
  },
  emerald: {
    glow: 'rgba(52,211,153,0.2)',
    stroke: 'rgba(110,231,183,0.9)',
    fill: 'rgba(52,211,153,0.08)',
    soft: 'rgba(52,211,153,0.12)',
  },
};

/** Perspective lattice — clear structure, not liquid mush. */
function SignalLattice({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="sigFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.stroke} stopOpacity="0" />
          <stop offset="55%" stopColor={c.stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={c.stroke} stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="sigHorizon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c.stroke} stopOpacity="0" />
          <stop offset="50%" stopColor={c.stroke} stopOpacity="0.7" />
          <stop offset="100%" stopColor={c.stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Vertical perspective lines */}
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => (
        <line
          key={`v${i}`}
          x1={400 + i * 70}
          y1={210}
          x2={400 + i * 160}
          y2={500}
          stroke="url(#sigFloor)"
          strokeWidth="1"
        />
      ))}
      {/* Horizontal depth rings */}
      {[240, 290, 350, 420, 490].map((y, i) => (
        <line
          key={`h${y}`}
          x1={40 + i * 18}
          y1={y}
          x2={760 - i * 18}
          y2={y}
          stroke={c.stroke}
          strokeOpacity={0.12 + i * 0.04}
          strokeWidth="1"
        />
      ))}
      {/* Horizon */}
      <line x1="40" y1="210" x2="760" y2="210" stroke="url(#sigHorizon)" strokeWidth="1.25" />

      {/* Scan sweep */}
      {!reduce && (
        <motion.rect
          x="0"
          y="0"
          width="800"
          height="2"
          fill={c.stroke}
          animate={{ y: [40, 460, 40], opacity: [0, 0.55, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </svg>
  );
}

function OrbitForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      {[56, 92, 128, 164].map((r, i) => (
        <motion.circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke={c.stroke}
          strokeWidth={i === 2 ? 1.6 : 1}
          strokeOpacity={0.25 + i * 0.12}
          strokeDasharray={i % 2 === 0 ? '2 8' : '10 6'}
          animate={reduce ? undefined : { rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 22 + i * 6, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 200px' }}
        />
      ))}
      <circle cx="200" cy="200" r="10" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      <motion.circle
        cx="292"
        cy="200"
        r="5"
        fill={c.stroke}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '200px 200px' }}
      />
      {/* Crosshair */}
      <line x1="200" y1="120" x2="200" y2="280" stroke={c.stroke} strokeOpacity="0.25" />
      <line x1="120" y1="200" x2="280" y2="200" stroke={c.stroke} strokeOpacity="0.25" />
    </svg>
  );
}

function ScaleForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <rect x="70" y="90" width="110" height="220" rx="4" fill="none" stroke="rgba(148,163,184,0.35)" />
      <rect x="220" y="90" width="110" height="220" rx="4" fill={c.fill} stroke={c.stroke} />
      <text x="125" y="80" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="11" fontFamily="monospace">
        HOURS
      </text>
      <text x="275" y="80" textAnchor="middle" fill={c.stroke} fontSize="11" fontFamily="monospace">
        LEARN
      </text>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={i}
          x="88"
          y={280 - i * 32}
          width={74 - i * 8}
          height="14"
          fill="rgba(148,163,184,0.2)"
          initial={false}
          animate={reduce ? undefined : { opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2.4, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={`r${i}`}
          x="238"
          y={280 - i * 32}
          width={40 + i * 12}
          height="14"
          fill={c.stroke}
          fillOpacity={0.35 + i * 0.1}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.1 * i }}
          style={{ transformOrigin: '238px 0' }}
        />
      ))}
    </svg>
  );
}

function PassportForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <rect x="100" y="60" width="200" height="280" rx="6" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
      <line x1="100" y1="118" x2="300" y2="118" stroke={c.stroke} strokeOpacity="0.4" />
      <text x="200" y="100" textAnchor="middle" fill={c.stroke} fontSize="12" fontFamily="monospace" letterSpacing="3">
        PASSPORT
      </text>
      <rect x="128" y="140" width="56" height="56" rx="2" fill="none" stroke={c.stroke} strokeWidth="1.2" />
      <circle cx="156" cy="162" r="12" fill="none" stroke={c.stroke} />
      <path d="M140 188 h32" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" />
      {['KNOWLEDGE', 'CREATE', 'CONTRIBUTE'].map((label, i) => (
        <g key={label}>
          <text
            x="200"
            y={220 + i * 36}
            fill={c.stroke}
            fontSize="9"
            fontFamily="monospace"
            letterSpacing="1.5"
          >
            {label}
          </text>
          <rect x="200" y={228 + i * 36} width="80" height="3" fill="rgba(255,255,255,0.08)" />
          <motion.rect
            x="200"
            y={228 + i * 36}
            height="3"
            fill={c.stroke}
            initial={{ width: 0 }}
            animate={{ width: 28 + i * 18 }}
            transition={{ duration: 0.9, delay: 0.2 * i }}
          />
        </g>
      ))}
      {!reduce && (
        <motion.rect
          x="100"
          width="200"
          height="2"
          fill={c.stroke}
          animate={{ y: [70, 320, 70], opacity: [0, 0.5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </svg>
  );
}

function SparkForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      {/* Diamond core */}
      <motion.polygon
        points="200,80 320,200 200,320 80,200"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.6"
        animate={reduce ? undefined : { rotate: [0, 90, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '200px 200px' }}
      />
      <polygon
        points="200,120 280,200 200,280 120,200"
        fill="none"
        stroke={c.stroke}
        strokeWidth="1"
        strokeOpacity="0.55"
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={200 + Math.cos(rad) * 48}
            y1={200 + Math.sin(rad) * 48}
            x2={200 + Math.cos(rad) * 118}
            y2={200 + Math.sin(rad) * 118}
            stroke={c.stroke}
            strokeWidth="1.25"
            strokeOpacity="0.55"
          />
        );
      })}
      <circle cx="200" cy="200" r="14" fill={c.stroke} fillOpacity="0.9" />
      <motion.circle
        cx="200"
        cy="200"
        r="28"
        fill="none"
        stroke={c.stroke}
        strokeWidth="1"
        animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        style={{ transformOrigin: '200px 200px' }}
      />
    </svg>
  );
}

function PathForms({ accent }: { accent: ChapterVisual['accent'] }) {
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  const nodes = [
    { x: 50, y: 300 },
    { x: 120, y: 220 },
    { x: 200, y: 160 },
    { x: 280, y: 200 },
    { x: 350, y: 110 },
  ];
  const d = nodes.map((n, i) => `${i === 0 ? 'M' : 'L'}${n.x} ${n.y}`).join(' ');
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <motion.path
        d={d}
        fill="none"
        stroke={c.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />
      {nodes.map((n, i) => (
        <g key={i}>
          <motion.rect
            x={n.x - 10}
            y={n.y - 10}
            width="20"
            height="20"
            fill="#050608"
            stroke={c.stroke}
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.15 }}
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
            {String(i + 1).padStart(2, '0')}
          </text>
          {!reduce && i === nodes.length - 1 && (
            <motion.rect
              x={n.x - 16}
              y={n.y - 16}
              width="32"
              height="32"
              fill="none"
              stroke={c.stroke}
              animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.35, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            />
          )}
        </g>
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
  image?: string;
  wash?: string;
  accent: ChapterVisual['accent'];
  form: StoryFormKind;
  className?: string;
  /** Smaller form for embedded dashboard cards */
  compact?: boolean;
  /**
   * `signal` (default) — crisp geometric field.
   * `photo` — faint chapter still under the lattice (cold-start only).
   */
  plate?: 'signal' | 'photo';
};

/** Shared plate used by cold-start chapters and facility panels. */
export function MoodArt({
  image,
  wash = 'from-[#050608]/40 via-[#050608]/80 to-[#050608]',
  accent,
  form,
  className = '',
  compact = false,
  plate = 'signal',
}: MoodArtProps) {
  const Form = STORY_FORMS[form];
  const c = ACCENT[accent];
  const reduce = useReducedMotion();
  const usePhoto = plate === 'photo' && Boolean(image);

  return (
    <div className={`absolute inset-0 overflow-hidden bg-[#050608] ${className}`} aria-hidden>
      {usePhoto && (
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.28] saturate-[0.7] contrast-125"
          draggable={false}
        />
      )}

      {/* Accent void */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 45% at 78% 28%, ${c.glow}, transparent 60%),
            radial-gradient(ellipse 40% 35% at 12% 80%, ${c.soft}, transparent 55%),
            linear-gradient(180deg, #070a10 0%, #050608 55%, #030406 100%)
          `,
        }}
      />

      <SignalLattice accent={accent} />

      <div className={`absolute inset-0 bg-gradient-to-t ${wash}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050608]/90 via-[#050608]/35 to-transparent" />

      {/* Form glyph — sharp, readable */}
      <div
        className={`pointer-events-none absolute ${
          compact
            ? 'right-0 top-0 h-[13rem] w-[13rem] opacity-90 md:h-[15rem] md:w-[15rem]'
            : 'right-[2%] top-[6%] h-[52vmin] w-[52vmin] opacity-95 md:right-[5%] md:top-[4%] md:h-[58vmin] md:w-[58vmin]'
        }`}
      >
        <Form accent={accent} />
      </div>

      {/* Corner brackets — clear HUD chrome */}
      <div className="pointer-events-none absolute inset-3 md:inset-4">
        <span
          className="absolute left-0 top-0 h-3 w-3 border-l border-t"
          style={{ borderColor: c.stroke, opacity: 0.55 }}
        />
        <span
          className="absolute right-0 top-0 h-3 w-3 border-r border-t"
          style={{ borderColor: c.stroke, opacity: 0.55 }}
        />
        <span
          className="absolute bottom-0 left-0 h-3 w-3 border-b border-l"
          style={{ borderColor: c.stroke, opacity: 0.55 }}
        />
        <span
          className="absolute bottom-0 right-0 h-3 w-3 border-b border-r"
          style={{ borderColor: c.stroke, opacity: 0.55 }}
        />
      </div>

      {!reduce && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${c.stroke}, transparent)` }}
          animate={{ top: ['8%', '88%', '8%'], opacity: [0, 0.35, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
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
      plate="photo"
    />
  );
}
