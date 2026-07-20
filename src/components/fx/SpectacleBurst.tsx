/**
 * Lightweight celebration burst — rings + motes. CSS/motion only (no canvas).
 */

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type Props = {
  active?: boolean;
  tone?: 'amber' | 'cyan' | 'emerald' | 'rose';
  density?: 'lite' | 'full';
  className?: string;
};

const TONE: Record<NonNullable<Props['tone']>, { ring: string; mote: string }> = {
  amber: { ring: 'border-amber-300', mote: 'bg-amber-300' },
  cyan: { ring: 'border-cyan-300', mote: 'bg-cyan-300' },
  emerald: { ring: 'border-emerald-300', mote: 'bg-emerald-300' },
  rose: { ring: 'border-rose-300', mote: 'bg-rose-300' },
};

export default function SpectacleBurst({
  active = true,
  tone = 'amber',
  density = 'full',
  className = '',
}: Props) {
  const reduceMotion = useReducedMotion();
  const count = density === 'lite' ? 8 : 16;
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 48 + (i % 4) * 22;
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          delay: i * 0.03,
          size: 3 + (i % 3),
        };
      }),
    [count]
  );

  if (!active || reduceMotion) return null;
  const t = TONE[tone];

  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`} aria-hidden>
      {[0, 1, 2].map((r) => (
        <motion.span
          key={`ring-${r}`}
          className={`absolute rounded-full border ${t.ring}`}
          style={{ width: 40, height: 40 }}
          initial={{ opacity: 0.7, scale: 0.4 }}
          animate={{ opacity: 0, scale: 2.8 + r * 0.55 }}
          transition={{ duration: 0.9, delay: r * 0.12, ease: 'easeOut' }}
        />
      ))}
      {motes.map((m) => (
        <motion.span
          key={m.id}
          className={`absolute rounded-full ${t.mote}`}
          style={{ width: m.size, height: m.size }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], x: m.x, y: m.y, scale: [0.4, 1.2, 0.2] }}
          transition={{ duration: 0.85, delay: m.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
