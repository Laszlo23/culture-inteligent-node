/**
 * Lightweight matrix rain for facility sector cards — CSS only, intensifies on group-hover.
 */

import React from 'react';
import { MATRIX_COLUMNS } from '../../lib/sector-media';

type Props = {
  accent?: 'cyan' | 'fuchsia' | 'teal' | 'pink' | 'emerald' | 'amber';
};

const ACCENT_TEXT: Record<NonNullable<Props['accent']>, string> = {
  cyan: 'text-cyan-400/70',
  fuchsia: 'text-fuchsia-400/70',
  teal: 'text-teal-400/70',
  pink: 'text-pink-400/70',
  emerald: 'text-emerald-400/70',
  amber: 'text-amber-400/70',
};

export function SectorMatrix({ accent = 'cyan' }: Props) {
  return (
    <div
      className={`sector-matrix absolute inset-0 overflow-hidden opacity-[0.12] group-hover:opacity-[0.32] group-focus-within:opacity-[0.32] transition-opacity duration-500 ${ACCENT_TEXT[accent] ?? ACCENT_TEXT.cyan}`}
      aria-hidden
    >
      {MATRIX_COLUMNS.map((glyphs, i) => (
        <span
          key={i}
          className="sector-matrix-col"
          style={{
            left: `${4 + i * 12}%`,
            animationDelay: `${-i * 0.85}s`,
            animationDuration: `${6 + (i % 3) * 1.4}s`,
          }}
        >
          {glyphs.split('').join('\n')}
          {'\n'}
          {glyphs.split('').join('\n')}
        </span>
      ))}
    </div>
  );
}

export default SectorMatrix;
