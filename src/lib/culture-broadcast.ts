/**
 * Culture mining campaign — shared broadcast copy for landing, store, share.
 * Slogans locked in brand-slogans.ts + docs/BRAND_STRATEGY.md
 */

import { BRAND, SLOGANS } from './brand-slogans';

export const HEARING_MODE_URL = `${BRAND.url.replace(/\/?$/, '/')}?hear=1`;

export const CULTURE_BROADCAST = {
  slogan: SLOGANS.primary,
  sloganLoud: SLOGANS.primaryLoud,
  oneLiner:
    "We're here for attention. Culture Node is a Proof of Attention OS — focused learning becomes knowledge fuel. Chain settles it; attention is the product.",
  landingHook: SLOGANS.curveLong,
  landingBody:
    "We're here for attention — not empty hashes. Prove it in Academy. See the scroll in Hook Mirror. Zen-decide. Fuel follows. That's Culture Club.",
  storeSubtitle:
    'Proof of Attention OS — we\'re here for attention. Learn, decide, fuel your Solana Devnet node.',
  sharePost: [
    SLOGANS.attention,
    SLOGANS.curveLong,
    '',
    'Culture Node = Proof of Attention OS.',
    'Not empty hashes. Focused attention → knowledge fuel.',
    'First Spark. Hook Mirror. Zen decide. Then the node.',
    '',
    'NEW: Hearing Mode — prove attention without looking.',
    `Open: ${HEARING_MODE_URL}`,
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    SLOGANS.primaryLoud,
    SLOGANS.spread,
    '',
    BRAND.url,
  ].join('\n'),
  hearingSharePost: [
    SLOGANS.attention,
    '',
    'Culture Node — ears-first Proof of Attention.',
    'Hearing Mode: prove attention without looking at the screen.',
    'Say Help. Say Academy. First Spark → fuel.',
    '',
    HEARING_MODE_URL,
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    '#CultureNode #ProofOfAttention #HearingMode',
  ].join('\n'),
  notificationTitle: 'BROADCAST · We\'re here for attention',
  notificationBody: `${SLOGANS.attention} ${SLOGANS.curve} Culture Club · Proof of Attention · ${SLOGANS.spread}`,
  hearingBanner: 'Ears-first attention is live — say Help. Prove it without looking.',
  /** Campaign art under /campaign/ */
  art: {
    mineCulture: '/campaign/mine-culture.png',
    failureCurve: '/campaign/failure-curve.png',
    cultureClub: '/campaign/culture-club.png',
    spreadLove: '/campaign/spread-love.png',
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
  title = `${BRAND.product} — ${BRAND.parent}`
): Promise<'share' | 'clipboard'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url: HEARING_MODE_URL });
      return 'share';
    } catch (err) {
      // User cancel — fall through only if not AbortError
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
  }
  await navigator.clipboard?.writeText(text);
  return 'clipboard';
}
