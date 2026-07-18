/**
 * Attention glitch + grabber badge — Outer Circuit / brief accents.
 */

import React from 'react';

type GlitchIntensity = 'soft' | 'medium' | 'burst';

/** RGB-split / clip-path glitch frame. Respects prefers-reduced-motion via CSS. */
export function GlitchFrame({
  children,
  className = '',
  intensity = 'soft',
  active = true,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: GlitchIntensity;
  active?: boolean;
}) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }
  return (
    <div
      className={`glitch-frame glitch-frame--${intensity} ${className}`.trim()}
      data-glitch={intensity}
    >
      {children}
    </div>
  );
}

/** Glitching label — layers for chromatic aberration text. */
export function GlitchText({
  children,
  className = '',
  as: Tag = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'h2' | 'h3';
}) {
  const text = typeof children === 'string' ? children : null;
  return (
    <Tag className={`glitch-text ${className}`.trim()} data-text={text || undefined}>
      {children}
    </Tag>
  );
}

type BadgeTone = 'violet' | 'amber' | 'cyan' | 'rose' | 'emerald' | 'orange';

/** Tiny corner count / pulse badge for attention grabbers. */
export function AttentionBadge({
  value,
  tone = 'cyan',
  pulse = false,
  className = '',
  title,
}: {
  value?: string | number;
  tone?: BadgeTone;
  pulse?: boolean;
  className?: string;
  title?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    violet: 'bg-violet-500 border-violet-300/40 text-white',
    amber: 'bg-amber-500 border-amber-200/50 text-black',
    cyan: 'bg-cyan-500 border-cyan-200/40 text-black',
    rose: 'bg-rose-500 border-rose-200/40 text-white',
    emerald: 'bg-emerald-500 border-emerald-200/40 text-black',
    orange: 'bg-orange-500 border-orange-200/40 text-black',
  };
  return (
    <span
      title={title}
      className={`absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 rounded-full border-2 border-[#0a0a0c] text-[8px] font-black font-mono leading-none flex items-center justify-center ${tones[tone]} ${
        pulse ? 'attention-badge-pulse' : ''
      } ${className}`.trim()}
    >
      {value != null ? value : (
        <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
      )}
    </span>
  );
}

/** Icon tile with optional badge — shared attention grabber shell. */
export function AttentionIconTile({
  icon,
  tone = 'cyan',
  badge,
  badgePulse,
  className = '',
}: {
  icon: React.ReactNode;
  tone?: BadgeTone;
  badge?: string | number | boolean;
  badgePulse?: boolean;
  className?: string;
}) {
  const tile: Record<BadgeTone, string> = {
    violet: 'bg-violet-500/15 border-violet-400/30 text-violet-300',
    amber: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    cyan: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300',
    rose: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
    emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    orange: 'bg-orange-500/15 border-orange-400/30 text-orange-300',
  };
  const showBadge = badge === true || badge === 0 || Boolean(badge);
  return (
    <div
      className={`relative w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${tile[tone]} ${className}`.trim()}
    >
      {icon}
      {showBadge && (
        <AttentionBadge
          value={badge === true ? undefined : badge}
          tone={tone}
          pulse={badgePulse}
        />
      )}
    </div>
  );
}
