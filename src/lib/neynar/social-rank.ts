/**
 * Pure helpers for Neynar social pulse ranking / score tiers.
 */

export type EngagingCastInput = {
  hash: string;
  text: string;
  timestamp?: string;
  likes: number;
  recasts: number;
  replies: number;
  embeds?: string[];
  channel?: string | null;
};

export type ScoreTier = {
  id: 'signal' | 'pulse' | 'voltage' | 'beacon' | 'legend';
  label: string;
  blurb: string;
  min: number;
};

export const SCORE_TIERS: ScoreTier[] = [
  { id: 'signal', label: 'Signal', blurb: 'Just tuning in', min: 0 },
  { id: 'pulse', label: 'Pulse', blurb: 'People feel you', min: 0.35 },
  { id: 'voltage', label: 'Voltage', blurb: 'Real network heat', min: 0.55 },
  { id: 'beacon', label: 'Beacon', blurb: 'High-trust presence', min: 0.7 },
  { id: 'legend', label: 'Legend', blurb: 'Culture gravity', min: 0.9 },
];

export function engagementScore(c: Pick<EngagingCastInput, 'likes' | 'recasts' | 'replies'>): number {
  return c.likes + c.recasts * 2 + c.replies * 1.5;
}

export function pickMostEngaging(
  casts: EngagingCastInput[],
  limit = 3
): (EngagingCastInput & { heat: number })[] {
  return [...casts]
    .map((c) => ({ ...c, heat: engagementScore(c) }))
    .sort((a, b) => b.heat - a.heat || (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, limit);
}

export function scoreTier(score: number | null | undefined): ScoreTier {
  const s = typeof score === 'number' && Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0;
  let tier = SCORE_TIERS[0]!;
  for (const t of SCORE_TIERS) {
    if (s >= t.min) tier = t;
  }
  return tier;
}

export function scorePercent(score: number | null | undefined): number {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 0;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export function castUrl(username: string, hash: string): string {
  const cleanUser = username.replace(/^@/, '');
  const h = hash.startsWith('0x') ? hash : `0x${hash}`;
  return `https://farcaster.xyz/${encodeURIComponent(cleanUser)}/${h}`;
}
