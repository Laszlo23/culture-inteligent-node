/**
 * Server-only Neynar fetch helpers for passport social pulse.
 * Requires NEYNAR_API_KEY — never expose to the client.
 */

import {
  castUrl,
  pickMostEngaging,
  scorePercent,
  scoreTier,
  type EngagingCastInput,
} from './social-rank';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';
const CACHE_TTL_MS = 5 * 60 * 1000;

export type NeynarSocialPulse = {
  configured: boolean;
  linked: boolean;
  user: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string | null;
    bio: string;
    followerCount: number;
    followingCount: number;
    score: number | null;
    scorePercent: number;
    tier: ReturnType<typeof scoreTier>;
  } | null;
  casts: Array<{
    hash: string;
    text: string;
    timestamp: string | null;
    likes: number;
    recasts: number;
    replies: number;
    heat: number;
    url: string;
    channel: string | null;
  }>;
  source: 'fid' | 'username' | 'address' | null;
  error?: string;
};

type CacheEntry = { at: number; value: NeynarSocialPulse };

const cache = new Map<string, CacheEntry>();

function apiKey(): string {
  return String(process.env.NEYNAR_API_KEY || '').trim();
}

async function neynarGet<T>(path: string, query: Record<string, string>): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error('neynar_not_configured');
  const url = new URL(`${NEYNAR_BASE}${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
      'x-api-key': key,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`neynar_${res.status}:${body.slice(0, 180)}`);
  }
  return (await res.json()) as T;
}

type RawUser = {
  fid: number;
  username: string;
  display_name?: string | null;
  pfp_url?: string | null;
  follower_count?: number;
  following_count?: number;
  score?: number;
  experimental?: { neynar_user_score?: number };
  profile?: { bio?: { text?: string } };
};

type RawCast = {
  hash: string;
  text?: string;
  timestamp?: string;
  channel?: { id?: string; name?: string } | null;
  reactions?: { likes_count?: number; recasts_count?: number };
  replies?: { count?: number };
  embeds?: Array<{ url?: string }>;
};

function extractScore(u: RawUser): number | null {
  const s = u.score ?? u.experimental?.neynar_user_score;
  return typeof s === 'number' && Number.isFinite(s) ? s : null;
}

function mapUser(u: RawUser) {
  const score = extractScore(u);
  return {
    fid: u.fid,
    username: u.username,
    displayName: u.display_name || u.username,
    pfpUrl: u.pfp_url ?? null,
    bio: u.profile?.bio?.text || '',
    followerCount: u.follower_count ?? 0,
    followingCount: u.following_count ?? 0,
    score,
    scorePercent: scorePercent(score),
    tier: scoreTier(score),
  };
}

function mapCasts(username: string, casts: RawCast[]) {
  const inputs: EngagingCastInput[] = casts
    .filter((c) => typeof c.hash === 'string' && c.hash)
    .map((c) => ({
      hash: c.hash,
      text: (c.text || '').trim(),
      timestamp: c.timestamp,
      likes: c.reactions?.likes_count ?? 0,
      recasts: c.reactions?.recasts_count ?? 0,
      replies: c.replies?.count ?? 0,
      channel: c.channel?.id || c.channel?.name || null,
    }))
    .filter((c) => c.text.length > 0);

  return pickMostEngaging(inputs, 3).map((c) => ({
    hash: c.hash,
    text: c.text.slice(0, 280),
    timestamp: c.timestamp || null,
    likes: c.likes,
    recasts: c.recasts,
    replies: c.replies,
    heat: Math.round(c.heat),
    url: castUrl(username, c.hash),
    channel: c.channel || null,
  }));
}

async function resolveUser(opts: {
  fid?: number;
  username?: string;
  address?: string;
}): Promise<{ user: RawUser; source: NonNullable<NeynarSocialPulse['source']> } | null> {
  if (opts.fid && opts.fid > 0) {
    const data = await neynarGet<{ users?: RawUser[] }>('/user/bulk/', {
      fids: String(opts.fid),
    });
    const user = data.users?.[0];
    return user ? { user, source: 'fid' } : null;
  }

  if (opts.username) {
    const data = await neynarGet<{ user?: RawUser }>('/user/by_username/', {
      username: opts.username,
    });
    return data.user ? { user: data.user, source: 'username' } : null;
  }

  if (opts.address) {
    const data = await neynarGet<Record<string, RawUser[]>>('/user/bulk-by-address/', {
      addresses: opts.address,
    });
    const list = data[opts.address] || data[opts.address.toLowerCase()] || Object.values(data)[0];
    const user = Array.isArray(list) ? list[0] : undefined;
    return user ? { user, source: 'address' } : null;
  }

  return null;
}

export async function fetchNeynarSocialPulse(opts: {
  fid?: number;
  username?: string;
  address?: string;
}): Promise<NeynarSocialPulse> {
  if (!apiKey()) {
    return {
      configured: false,
      linked: false,
      user: null,
      casts: [],
      source: null,
      error: 'neynar_not_configured',
    };
  }

  const cacheKey = [
    opts.fid ? `f:${opts.fid}` : '',
    opts.username ? `u:${opts.username.toLowerCase()}` : '',
    opts.address ? `a:${opts.address}` : '',
  ]
    .filter(Boolean)
    .join('|');

  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  }

  try {
    const resolved = await resolveUser(opts);
    if (!resolved) {
      const empty: NeynarSocialPulse = {
        configured: true,
        linked: false,
        user: null,
        casts: [],
        source: null,
        error: 'user_not_found',
      };
      return empty;
    }

    const { user, source } = resolved;
    let casts: RawCast[] = [];
    try {
      const feed = await neynarGet<{ casts?: RawCast[] }>('/feed/user/casts/', {
        fid: String(user.fid),
        limit: '30',
        include_replies: 'false',
      });
      casts = feed.casts || [];
    } catch {
      casts = [];
    }

    const value: NeynarSocialPulse = {
      configured: true,
      linked: true,
      user: mapUser(user),
      casts: mapCasts(user.username, casts),
      source,
    };

    if (cacheKey) cache.set(cacheKey, { at: Date.now(), value });
    return value;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'neynar_error';
    return {
      configured: true,
      linked: false,
      user: null,
      casts: [],
      source: null,
      error: message,
    };
  }
}
