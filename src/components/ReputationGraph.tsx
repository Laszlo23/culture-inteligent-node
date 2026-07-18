/**
 * Reputation sparkline — local attention activity over time.
 */

import React, { useMemo } from 'react';
import { buildReputationSeries } from '../lib/human-economy';

type Props = {
  days?: number;
  className?: string;
  label?: string;
};

export default function ReputationGraph({
  days = 14,
  className = '',
  label = 'Reputation growth',
}: Props) {
  const series = useMemo(() => buildReputationSeries(days), [days]);
  const w = 280;
  const h = 64;
  const pad = 4;
  const maxX = Math.max(1, series.length - 1);

  const points = series
    .map((d, i) => {
      const x = pad + (i / maxX) * (w - pad * 2);
      const y = h - pad - (d.value / 100) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const area = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
        <p className="font-mono text-[9px] text-slate-600">{days}d</p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-16 text-cyan-400"
        role="img"
        aria-label={`${label} over ${days} days`}
      >
        <defs>
          <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#repFill)" />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
