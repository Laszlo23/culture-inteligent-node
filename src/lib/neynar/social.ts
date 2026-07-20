/**
 * Client helpers for Farcaster social pulse (via /api/neynar/social).
 */

import type { ScoreTier } from './social-rank';

export type SocialPulseCast = {
  hash: string;
  text: string;
  timestamp: string | null;
  likes: number;
  recasts: number;
  replies: number;
  heat: number;
  url: string;
  channel: string | null;
};

export type SocialPulseUser = {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string | null;
  bio: string;
  followerCount: number;
  followingCount: number;
  score: number | null;
  scorePercent: number;
  tier: ScoreTier;
};

export type SocialPulse = {
  configured: boolean;
  linked: boolean;
  user: SocialPulseUser | null;
  casts: SocialPulseCast[];
  source: 'fid' | 'username' | 'address' | null;
  error?: string;
};

const LINK_KEY = 'building_culture_farcaster_link_v1';

export type FarcasterLink = {
  username?: string;
  fid?: number;
  updatedAt: number;
};

export function readFarcasterLink(): FarcasterLink | null {
  try {
    const raw = localStorage.getItem(LINK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FarcasterLink;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeFarcasterLink(link: Omit<FarcasterLink, 'updatedAt'>): void {
  const next: FarcasterLink = { ...link, updatedAt: Date.now() };
  localStorage.setItem(LINK_KEY, JSON.stringify(next));
}

export function clearFarcasterLink(): void {
  localStorage.removeItem(LINK_KEY);
}

export function normalizeFcUsername(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase();
}

export async function fetchSocialPulse(opts: {
  fid?: number;
  username?: string;
  address?: string;
}): Promise<SocialPulse> {
  const params = new URLSearchParams();
  if (opts.fid && opts.fid > 0) params.set('fid', String(opts.fid));
  if (opts.username) params.set('username', normalizeFcUsername(opts.username));
  if (opts.address) params.set('address', opts.address);

  const res = await fetch(`/api/neynar/social?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      configured: res.status !== 503,
      linked: false,
      user: null,
      casts: [],
      source: null,
      error: typeof err?.error === 'string' ? err.error : `http_${res.status}`,
    };
  }
  return (await res.json()) as SocialPulse;
}
