/**
 * Shareable Human Passport links + cast text.
 */

import { BRAND } from './brand-slogans';
import type { HumanScores } from './human-economy';
import { buildFarcasterComposeUrl } from './farcaster';
import { nextOgPack, withRotatingOg } from './og-share';

export type PassportSharePayload = {
  name: string;
  scores: HumanScores;
  achievements?: string[];
};

function b64url(json: string): string {
  const b =
    typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, 'utf8').toString('base64');
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(escape(atob(b64)));
  }
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function encodePassportShare(payload: PassportSharePayload): string {
  const creativity = payload.scores.creativity ?? payload.scores.builder;
  const compact = {
    n: payload.name.replace(/^@/, '').slice(0, 32),
    k: payload.scores.knowledge,
    c: creativity,
    o: payload.scores.contribution,
    v: payload.scores.humanValue,
    a: (payload.achievements || []).slice(0, 3),
  };
  return b64url(JSON.stringify(compact));
}

export function decodePassportShare(code: string): PassportSharePayload | null {
  try {
    const raw = JSON.parse(fromB64url(code)) as {
      n?: string;
      k?: number;
      c?: number;
      o?: number;
      v?: number;
      a?: string[];
    };
    if (!raw.n || raw.v == null) return null;
    const creativity = Number(raw.c) || 0;
    return {
      name: String(raw.n),
      scores: {
        knowledge: Number(raw.k) || 0,
        builder: creativity,
        creativity,
        contribution: Number(raw.o) || 0,
        humanValue: Number(raw.v) || 0,
      },
      achievements: Array.isArray(raw.a) ? raw.a.map(String) : [],
    };
  } catch {
    return null;
  }
}

export function passportShareUrl(payload: PassportSharePayload, baseUrl?: string): string {
  const base = (baseUrl || BRAND.url || 'https://mining.buildingcultureid.space').replace(
    /\/?$/,
    '/'
  );
  const code = encodePassportShare(payload);
  return `${base}?passport=${encodeURIComponent(code)}`;
}

export function buildPassportShareText(
  payload: PassportSharePayload,
  url: string,
  opts?: { rotateImage?: boolean }
): string {
  const name = payload.name.replace(/^@/, '');
  const creativity = payload.scores.creativity ?? payload.scores.builder;
  const base = [
    `${name}`,
    `Human Value Score: ${payload.scores.humanValue}`,
    '',
    `Knowledge: ${payload.scores.knowledge}`,
    `Creativity: ${creativity}`,
    `Contribution: ${payload.scores.contribution}`,
    '',
    'Verified on Building Culture',
    '',
    'See my Human Passport',
    url,
  ].join('\n');
  if (opts?.rotateImage === false) return base;
  return withRotatingOg({ text: base, embedPage: url, appendImageLink: true }).text;
}

export function buildPassportCastCompose(payload: PassportSharePayload, baseUrl?: string): string {
  const url = passportShareUrl(payload, baseUrl);
  const pack = nextOgPack();
  // Plain text (image is an embed — don't double-append link)
  const text = buildPassportShareText(payload, url, { rotateImage: false });
  return buildFarcasterComposeUrl(text, url, pack.imageUrl);
}

export function achievementsFromScores(scores: HumanScores): string[] {
  const chips: string[] = [];
  const creativity = scores.creativity ?? scores.builder;
  if (scores.knowledge >= 10) chips.push('Curious Mind');
  if (creativity >= 8) chips.push('Creative Thinker');
  if (scores.contribution >= 5) chips.push('Contributor');
  if (scores.humanValue >= 20) chips.push('Rising Human');
  if (chips.length === 0) chips.push('Getting started');
  return chips.slice(0, 3);
}
