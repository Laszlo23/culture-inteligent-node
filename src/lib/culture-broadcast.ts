/**
 * Culture mining campaign — shared broadcast copy for landing, store, share.
 * Slogans locked in brand-slogans.ts + docs/BRAND_STRATEGY.md
 */

import { BRAND, SLOGANS } from './brand-slogans';
import { withRotatingOg } from './og-share';

export const HEARING_MODE_URL = `${BRAND.url.replace(/\/?$/, '/')}?hear=1`;

export const CULTURE_BROADCAST = {
  slogan: SLOGANS.primary,
  sloganLoud: SLOGANS.primaryLoud,
  oneLiner: `${SLOGANS.hero} ${BRAND.parent} builds the Human Economy — Human Passports from learning, creating, contributing.`,
  landingHook: SLOGANS.curveLong,
  landingBody: `${SLOGANS.equation} Prove attention. Own your passport. Grow reputation — not empty hours.`,
  storeSubtitle:
    'Human Passport — reputation from learning, creating, contributing. Proof of Attention.',
  sharePost: [
    SLOGANS.hero,
    SLOGANS.equation,
    '',
    `${BRAND.parent} — ${BRAND.product}.`,
    'Build a Human Passport. Prove attention. Own your digital reputation.',
    '',
    'Hook Loop — how they hook you into doomscrolling.',
    `${BRAND.url}?room=hook-loop`,
    '',
    HEARING_MODE_URL,
    '',
    SLOGANS.primaryLoud,
    SLOGANS.spread,
    '',
    BRAND.url,
  ].join('\n'),
  hearingSharePost: [
    SLOGANS.attention,
    '',
    'Human Economy — ears-first Proof of Attention.',
    'Hearing Mode: prove contribution without looking at the screen.',
    '',
    HEARING_MODE_URL,
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    '#HumanEconomy #HumanPassport #ProofOfAttention',
  ].join('\n'),
  notificationTitle: 'BROADCAST · The Human Economy',
  notificationBody: `${SLOGANS.hero} ${SLOGANS.equation} · ${SLOGANS.spread}`,
  hearingBanner:
    'Hearing Mode — a soft listening space. Say Help. Prove attention without staring at the screen.',
  /** Campaign art under /campaign/ + feed OG pack under /og/ */
  art: {
    mineCulture: '/campaign/mine-culture.webp',
    failureCurve: '/campaign/failure-curve.webp',
    cultureClub: '/campaign/culture-club.webp',
    spreadLove: '/campaign/spread-love.webp',
    ogHumanValue: '/og/human-value.jpg',
    ogPassportZero: '/og/passport-zero.jpg',
    ogContribution: '/og/contribution.jpg',
    ogFirstSpark: '/og/first-spark.jpg',
    ogSpread: '/og/spread.jpg',
    ogHearing: '/og/hearing.jpg',
  },
} as const;

export const BROADCAST_TOAST_KEY = 'culture_broadcast_mine_v1';

export function hasSeenCultureBroadcast(): boolean {
  try {
    return localStorage.getItem(BROADCAST_TOAST_KEY) === '1';
  } catch {
    return true;
  }
}

export function markCultureBroadcastSeen(): void {
  try {
    localStorage.setItem(BROADCAST_TOAST_KEY, '1');
  } catch {
    // ignore
  }
}

/** Web Share when available; otherwise clipboard. Returns how it was shared. */
export async function shareCultureText(
  text: string,
  title = `${BRAND.product} — ${BRAND.parent}`,
  url: string = HEARING_MODE_URL
): Promise<'share' | 'clipboard'> {
  // Rotate OG art into the body so native/clipboard shares also change image
  const rotated = withRotatingOg({
    text,
    embedPage: url,
    appendImageLink: true,
  });
  const shareText = rotated.text;
  const shareUrl = rotated.embedUrl;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
      return 'share';
    } catch (err) {
      // User cancel — fall through only if not AbortError
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
  }
  await copyTextFallback(shareText);
  return 'clipboard';
}

/** Clipboard that works on older Safari / in-app browsers. */
export async function copyTextFallback(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through
    }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  if (!ok) {
    throw new Error('Clipboard unavailable');
  }
}
