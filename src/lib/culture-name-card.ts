/**
 * Culture Name share cards — personalized image URLs + punchy copy.
 * Image bytes are rendered server-side (Sharp) at /api/og/culture-name.
 */

import { BRAND, SLOGANS } from './brand-slogans';
import { formatCultureName, normalizeCultureLabel, type CultureLabel } from './culture-names';

export type CultureCardStyle = 'mine' | 'flex' | 'taken' | 'signal';

export const CULTURE_CARD_STYLES: {
  id: CultureCardStyle;
  label: string;
  vibe: string;
}[] = [
  { id: 'mine', label: 'Mine', vibe: 'I dug it. It’s mine.' },
  { id: 'flex', label: 'Flex', vibe: 'Big name energy.' },
  { id: 'taken', label: 'Taken', vibe: 'First come. Done.' },
  { id: 'signal', label: 'Signal', vibe: 'HUD lock — identity online.' },
];

export function isCultureCardStyle(raw: string | null | undefined): raw is CultureCardStyle {
  return Boolean(raw && CULTURE_CARD_STYLES.some((s) => s.id === raw));
}

export function pickCultureCardStyle(seed?: string): CultureCardStyle {
  const ids = CULTURE_CARD_STYLES.map((s) => s.id);
  if (!seed) {
    return ids[Math.floor(Math.random() * ids.length)];
  }
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ids[h % ids.length];
}

/** Absolute image URL for crawlers / embeds. */
export function cultureNameCardImageUrl(
  label: CultureLabel,
  style: CultureCardStyle,
  opts?: { origin?: string; nonce?: string | number }
): string {
  const origin = (opts?.origin || BRAND.url).replace(/\/?$/, '');
  const u = new URL(`${origin}/api/og/culture-name`);
  u.searchParams.set('name', normalizeCultureLabel(label));
  u.searchParams.set('style', style);
  u.searchParams.set('n', String(opts?.nonce ?? Date.now().toString(36)));
  u.searchParams.set('v', '2');
  return u.toString();
}

/** Landing page that scrapes the personalized card as og:image. */
export function cultureNameShareLandingUrl(
  label: CultureLabel,
  style: CultureCardStyle,
  opts?: { origin?: string; nonce?: string | number }
): string {
  const origin = (opts?.origin || BRAND.url).replace(/\/?$/, '');
  const u = new URL(`${origin}/`);
  u.searchParams.set('room', 'culture-name');
  u.searchParams.set('name', normalizeCultureLabel(label));
  u.searchParams.set('card', style);
  u.searchParams.set('share', 'culture_name');
  u.searchParams.set('fc', '1');
  u.searchParams.set('n', String(opts?.nonce ?? Date.now().toString(36)));
  return u.toString();
}

const CAPTIONS: Record<CultureCardStyle, (full: string) => string[]> = {
  mine: (full) => [
    `I mined ${full}`,
    '',
    'Not a username. A Culture Name — bound to my wallet.',
    'First come. One name. Forever.',
  ],
  flex: (full) => [
    `${full} checking in.`,
    '',
    'Human Economy handle unlocked.',
    'Your turn — mine yours before it’s gone.',
  ],
  taken: (full) => [
    `${full} is TAKEN.`,
    '',
    'I got here first.',
    'Find an open .culture name — if you can.',
  ],
  signal: (full) => [
    `Signal locked: ${full}`,
    '',
    'Identity online in the Human Economy.',
    'Mine your Culture Name. Share the card.',
  ],
};

export function buildCultureNameCardPost(
  label: CultureLabel,
  style: CultureCardStyle,
  opts?: { imageUrl?: string; landingUrl?: string }
): string {
  const full = formatCultureName(label);
  const imageUrl =
    opts?.imageUrl || cultureNameCardImageUrl(label, style);
  const landing =
    opts?.landingUrl || cultureNameShareLandingUrl(label, style);
  return [
    ...CAPTIONS[style](full),
    '',
    SLOGANS.cultureNameShare,
    '',
    'Mine yours:',
    `${BRAND.url.replace(/\/?$/, '/')}?room=culture-name`,
    '',
    landing,
    '',
    `🖼 ${full}`,
    imageUrl,
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    '#CultureName #HumanEconomy',
  ].join('\n');
}

export function buildCultureNameCast(
  label: CultureLabel,
  style: CultureCardStyle
): { text: string; embedUrl: string; imageUrl: string } {
  const full = formatCultureName(label);
  const imageUrl = cultureNameCardImageUrl(label, style);
  const embedUrl = cultureNameShareLandingUrl(label, style);
  const text = [
    CAPTIONS[style](full).slice(0, 4).join('\n'),
    '',
    'Mine yours →',
    '#CultureName #HumanEconomy',
  ].join('\n');
  return { text, embedUrl, imageUrl };
}
