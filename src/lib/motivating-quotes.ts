/**
 * Short motivating lines for entry + room change.
 * Aligned with brand-slogans — not a second slogan system.
 */

import { SLOGANS } from './brand-slogans';

export const MOTIVATING_QUOTES = [
  SLOGANS.hero,
  SLOGANS.equation,
  SLOGANS.attention,
  SLOGANS.proof,
  SLOGANS.spread,
  SLOGANS.potential,
  SLOGANS.firstSpark,
  SLOGANS.zen,
  SLOGANS.ownership,
  SLOGANS.hook,
  'Your attention becomes contribution when you stay with it.',
  'One clear next step beats a perfect plan you never start.',
  'Zero is not empty — it is a journey.',
  'Learn something real. Then pass it on.',
  'Reputation compounds when you lift others.',
] as const;

export type MotivatingQuote = (typeof MOTIVATING_QUOTES)[number];

/** UTC day index — stable for a calendar day. */
export function quoteDayIndex(now = Date.now()): number {
  return Math.floor(now / 86_400_000);
}

function hashSeed(seed: string | number): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.abs(Math.floor(seed)) >>> 0;
  }
  const s = String(seed);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick a quote from day + optional room/session seed.
 * Same inputs → same quote (no flicker on re-render).
 */
export function pickQuote(seed?: string | number | null, now = Date.now()): MotivatingQuote {
  const day = quoteDayIndex(now);
  const extra = seed == null || seed === '' ? 0 : hashSeed(seed);
  const idx = (day + extra) % MOTIVATING_QUOTES.length;
  return MOTIVATING_QUOTES[idx];
}
