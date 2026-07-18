/**
 * Community invite attribution — honor ?invite= links we already emit.
 */

import { BRAND, SLOGANS } from './brand-slogans';

export const COMMUNITY_INVITE_KEY = 'building_culture_invite_v1';

export const COMMUNITY_LINKS = {
  live: BRAND.url,
  hearing: `${BRAND.url.replace(/\/?$/, '/')}?hear=1`,
  hookLoop: `${BRAND.url.replace(/\/?$/, '/')}?room=hook-loop&fc=1`,
  passport: `${BRAND.url.replace(/\/?$/, '/')}?room=passport&fc=1`,
  telegram: 'https://t.me/+4zFH7-2tyW0yOTBk',
  discord: 'https://discord.gg/geUpHt3eSb',
  farcasterManifestTool:
    'https://farcaster.xyz/~/developers/mini-apps/manifest?domain=mining.buildingcultureid.space',
} as const;

export type InviteRecord = {
  code: string;
  landedAt: string;
  claimedAt?: string;
};

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function normalizeInviteCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  return code.length >= 4 ? code : null;
}

export function captureInviteFromUrl(search?: string): {
  record: InviteRecord | null;
  fresh: boolean;
} {
  if (typeof window === 'undefined' && !search) return { record: null, fresh: false };
  try {
    const q = search ?? window.location.search;
    const code = normalizeInviteCode(new URLSearchParams(q).get('invite'));
    if (!code) return { record: readInvite(), fresh: false };
    const existing = readInvite();
    if (existing?.code === code) return { record: existing, fresh: false };
    const record: InviteRecord = { code, landedAt: new Date().toISOString() };
    storage()?.setItem(COMMUNITY_INVITE_KEY, JSON.stringify(record));
    return { record, fresh: true };
  } catch {
    return { record: readInvite(), fresh: false };
  }
}

export function readInvite(): InviteRecord | null {
  try {
    const raw = storage()?.getItem(COMMUNITY_INVITE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InviteRecord;
    if (!parsed?.code) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function markInviteClaimed(): InviteRecord | null {
  const cur = readInvite();
  if (!cur) return null;
  const next = { ...cur, claimedAt: new Date().toISOString() };
  storage()?.setItem(COMMUNITY_INVITE_KEY, JSON.stringify(next));
  return next;
}

export function inviteWelcomeLine(code?: string | null): string | null {
  const c = code || readInvite()?.code;
  if (!c) return null;
  return `A builder invited you (${c}). Claim your Human Passport — then prove attention and pass the light on.`;
}

/** Cast / share pack when YOU invite someone. */
export function buildCommunityInviteCast(opts: {
  displayName?: string;
  walletAddress: string;
}): { text: string; embedUrl: string } {
  const who = opts.displayName?.trim() || `Builder_${opts.walletAddress.slice(0, 4)}`;
  const code = opts.walletAddress.slice(0, 6);
  const embedUrl = `${BRAND.url.replace(/\/?$/, '/')}?invite=${code}&fc=1`;
  const text = [
    `${who} is building in the Human Economy.`,
    '',
    SLOGANS.hero,
    SLOGANS.equation,
    '',
    'Claim a Human Passport. Prove attention. Own your reputation.',
    '',
    'Join me:',
    embedUrl,
    '',
    `Telegram · ${COMMUNITY_LINKS.telegram}`,
    `Discord · ${COMMUNITY_LINKS.discord}`,
  ].join('\n');
  return { text, embedUrl };
}
