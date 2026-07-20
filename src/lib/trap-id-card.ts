/**
 * Trap ID share cards — personalized image + punchy personal copy.
 */

import { BRAND, SLOGANS } from './brand-slogans';
import {
  getTrapById,
  trapIdDeepLink,
  type TrapArchetype,
  type TrapArchetypeId,
} from './trap-id';

export type TrapCardStyle = 'roast' | 'meme' | 'mirror' | 'dare';

export const TRAP_CARD_STYLES: {
  id: TrapCardStyle;
  label: string;
  vibe: string;
}[] = [
  { id: 'meme', label: 'Meme', vibe: 'Classic top/bottom — scroll stopper.' },
  { id: 'roast', label: 'Roast', vibe: 'Identity flex + confession they’ll screenshot.' },
  { id: 'dare', label: 'Dare', vibe: 'Tag a friend. Prove me wrong.' },
  { id: 'mirror', label: 'Mirror', vibe: 'Truth + flip — for the deep ones.' },
];

export function isTrapCardStyle(raw: string | null | undefined): raw is TrapCardStyle {
  return Boolean(raw && TRAP_CARD_STYLES.some((s) => s.id === raw));
}

export function pickTrapCardStyle(_trapId: string): TrapCardStyle {
  // Always lead with the scroll-stopper meme — other styles are opt-in.
  return 'meme';
}

export function trapIdCardImageUrl(
  trapId: TrapArchetypeId,
  style: TrapCardStyle,
  opts?: { origin?: string; nonce?: string | number }
): string {
  const origin = (opts?.origin || BRAND.url).replace(/\/?$/, '');
  const u = new URL(`${origin}/api/og/trap-id`);
  u.searchParams.set('trap', trapId);
  u.searchParams.set('style', style);
  u.searchParams.set('n', String(opts?.nonce ?? Date.now().toString(36)));
  u.searchParams.set('v', '3');
  return u.toString();
}

export function trapIdShareLandingUrl(
  trapId: TrapArchetypeId,
  style: TrapCardStyle,
  opts?: { origin?: string; nonce?: string | number }
): string {
  const origin = (opts?.origin || BRAND.url).replace(/\/?$/, '');
  const u = new URL(`${origin}/`);
  u.searchParams.set('room', 'trap-id');
  u.searchParams.set('trap', trapId);
  u.searchParams.set('card', style);
  u.searchParams.set('share', 'trap_id');
  u.searchParams.set('fc', '1');
  u.searchParams.set('n', String(opts?.nonce ?? Date.now().toString(36)));
  return u.toString();
}

export function buildTrapCardPost(
  trap: TrapArchetype,
  style: TrapCardStyle,
  opts?: { imageUrl?: string; landingUrl?: string }
): string {
  const imageUrl = opts?.imageUrl || trapIdCardImageUrl(trap.id, style);
  const landing = opts?.landingUrl || trapIdShareLandingUrl(trap.id, style);
  const lead =
    style === 'dare'
      ? trap.challenge
      : style === 'mirror'
        ? `"${trap.truth}"`
        : style === 'meme'
          ? `${trap.memeTop}\n${trap.memeBottom}`
          : trap.roast;

  return [
    `I'm a ${trap.handle}.`,
    '',
    lead,
    '',
    style === 'roast' ? `"${trap.truth}"` : trap.roast,
    '',
    "What's your bait? Find your Scroll Trap ID (30 sec):",
    landing,
    '',
    `🖼 ${trap.handle}`,
    imageUrl,
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    SLOGANS.thumbBait,
    '',
    '#TrapID #WhatsYourBait #ProofOfAttention #HumanEconomy',
  ].join('\n');
}

export function buildTrapCardCast(
  trap: TrapArchetype,
  style: TrapCardStyle
): { text: string; embedUrl: string; imageUrl: string } {
  const imageUrl = trapIdCardImageUrl(trap.id, style);
  const embedUrl = trapIdShareLandingUrl(trap.id, style);
  const text = [
    `I'm a ${trap.handle}.`,
    '',
    style === 'dare' ? trap.challenge : `"${trap.truth}"`,
    '',
    trap.memeTop,
    trap.memeBottom,
    '',
    "What's your bait? Find yours in 30 sec →",
    '#TrapID #WhatsYourBait #HumanEconomy',
  ].join('\n');
  return { text, embedUrl, imageUrl };
}

export function resolveTrapForCard(trapId: string | null | undefined): TrapArchetype | null {
  return getTrapById(trapId);
}

/** Keep deep link helper available for non-card shares */
export { trapIdDeepLink };
