/**
 * Farcaster growth kit — compose casts, Mini App deep links, cast templates.
 * Manifest: public/.well-known/farcaster.json
 */

import { BRAND, SLOGANS } from './brand-slogans';
import { buildHookSharePost, hookLoopDeepLink, type HookingTruth } from './hook-loop-campaign';

export const FARCASTER_HOME = `${BRAND.url.replace(/\/?$/, '/')}?fc=1`;
export const FARCASTER_HEARING = `${BRAND.url.replace(/\/?$/, '/')}?hear=1&fc=1`;
export const FARCASTER_HOOK_LOOP = `${BRAND.url.replace(/\/?$/, '/')}?room=hook-loop&fc=1`;
export const FARCASTER_PASSPORT = `${BRAND.url.replace(/\/?$/, '/')}?room=passport&fc=1`;

/** Warpcast / Farcaster compose (text + optional embed URL). */
export function buildFarcasterComposeUrl(text: string, embedUrl?: string): string {
  const params = new URLSearchParams();
  params.set('text', text);
  if (embedUrl) {
    params.append('embeds[]', embedUrl);
  }
  return `https://farcaster.xyz/~/compose?${params.toString()}`;
}

export function openFarcasterCompose(text: string, embedUrl?: string): void {
  if (typeof window === 'undefined') return;
  const url = buildFarcasterComposeUrl(text, embedUrl);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export type CastTemplateId =
  | 'launch'
  | 'passport'
  | 'hook_loop'
  | 'proof'
  | 'hearing'
  | 'pricing'
  | 'thread_2'
  | 'thread_3'
  | 'rain'
  | 'weekly_hearing'
  | 'partner_pilot'
  | 'spread_club'
  | 'passport_card';

export type CastTemplate = {
  id: CastTemplateId;
  title: string;
  channelHint: string;
  text: string;
  embedUrl: string;
};

export const CAST_TEMPLATES: CastTemplate[] = [
  {
    id: 'launch',
    title: 'Launch — Human Economy',
    channelHint: '/base /builders /onchain',
    embedUrl: FARCASTER_HOME,
    text: [
      SLOGANS.hero,
      '',
      'For centuries we measured people by the hours they worked.',
      'The AI era needs a new measurement:',
      'what you learn · create · contribute.',
      '',
      `${BRAND.parent} = ${BRAND.product}.`,
      'Build your Human Passport.',
      '',
      FARCASTER_HOME,
    ].join('\n'),
  },
  {
    id: 'passport',
    title: 'Human Passport',
    channelHint: '/builders /creators',
    embedUrl: FARCASTER_PASSPORT,
    text: [
      'Your LinkedIn flex is a résumé.',
      'Your Human Passport is reputation you own.',
      '',
      SLOGANS.equation,
      'Prove attention. Grow Knowledge · Creativity · Contribution.',
      '',
      SLOGANS.ctaPassport,
      FARCASTER_HOME,
    ].join('\n'),
  },
  {
    id: 'passport_card',
    title: 'See my Human Passport',
    channelHint: '/builders /creators',
    embedUrl: FARCASTER_PASSPORT,
    text: [
      'See my Human Passport.',
      '',
      'Human Value — Knowledge · Creativity · Contribution.',
      'Verified on Building Culture.',
      '',
      SLOGANS.ctaPassport,
      FARCASTER_PASSPORT,
    ].join('\n'),
  },
  {
    id: 'hook_loop',
    title: 'Hook Loop viral',
    channelHint: '/memes /attention',
    embedUrl: FARCASTER_HOOK_LOOP,
    text: [
      SLOGANS.hookLoop,
      '',
      'Fun memes. Real mechanics.',
      'Share a truth → unlock the next.',
      'Perfect loop. Honest this time.',
      '',
      FARCASTER_HOOK_LOOP,
    ].join('\n'),
  },
  {
    id: 'proof',
    title: 'Proof of Attention',
    channelHint: '/learning /builders',
    embedUrl: FARCASTER_HOME,
    text: [
      'Empty scrolling is not contribution.',
      '',
      'Proof of Attention = short challenges that move your Knowledge Score.',
      '~2 minutes. Then your passport updates.',
      '',
      FARCASTER_HOME,
    ].join('\n'),
  },
  {
    id: 'hearing',
    title: 'Hearing Mode',
    channelHint: '/a11y /builders',
    embedUrl: FARCASTER_HEARING,
    text: [
      'Prove attention without looking at the screen.',
      '',
      'Hearing Mode — ears-first Human Economy.',
      'Say Help. Start a challenge. Own the receipt.',
      '',
      FARCASTER_HEARING,
    ].join('\n'),
  },
  {
    id: 'pricing',
    title: 'Business model',
    channelHint: '/founders',
    embedUrl: FARCASTER_HOME,
    text: [
      'How Building Culture makes money (clear, not extractive):',
      '',
      '• Human Passport Pro — $9.99/mo',
      '• Human Intelligence Platform — $999–$5k/mo (companies)',
      '• Creator marketplace — platform fee',
      '',
      'Core Proof of Attention stays free.',
      FARCASTER_HOME,
    ].join('\n'),
  },
  {
    id: 'thread_2',
    title: 'Thread · why it matters',
    channelHint: 'reply to launch',
    embedUrl: FARCASTER_HOME,
    text: [
      '2/',
      'Time = Money was industrial age math.',
      'AI writes, codes, generates.',
      '',
      'The scarce asset is verified human contribution.',
      'That\'s the Human Economy.',
    ].join('\n'),
  },
  {
    id: 'thread_3',
    title: 'Thread · CTA',
    channelHint: 'reply to launch',
    embedUrl: FARCASTER_HOME,
    text: [
      '3/',
      'Open the Mini App. Claim a Human Passport.',
      'Then cast a Hook Loop truth — unlock the next one.',
      '',
      'Builders / parents / learners welcome.',
      FARCASTER_HOME,
    ].join('\n'),
  },
  {
    id: 'rain',
    title: 'Make it rain',
    channelHint: '/builders /base /onchain',
    embedUrl: FARCASTER_HOME,
    text: [
      'Make it rain.',
      '',
      'Hear → Spark → Zen → Spread → Return.',
      'Not empty hashes. Proof of Attention.',
      '',
      'Claim a Human Passport. Invite one builder.',
      'Discord houses + Telegram pulse. Same loop.',
      '',
      FARCASTER_HOME,
      FARCASTER_HEARING,
    ].join('\n'),
  },
  {
    id: 'weekly_hearing',
    title: 'Weekly Hearing demo',
    channelHint: '/a11y /builders /attention',
    embedUrl: FARCASTER_HEARING,
    text: [
      'Community Hearing — 30 min live.',
      '',
      '1. Open Hearing Mode (ears first)',
      '2. Say Academy → First Spark (~2 min)',
      '3. Zen: Mind or Machine',
      '4. Spread your invite',
      '',
      'Join us. Bring one friend.',
      FARCASTER_HEARING,
    ].join('\n'),
  },
  {
    id: 'partner_pilot',
    title: 'Partner Attention Session',
    channelHint: '/founders /protocols',
    embedUrl: FARCASTER_HOME,
    text: [
      'Protocols / edtech / wallets:',
      '',
      'We ship your insight as an Attention Session inside Culture Node.',
      'Members learn → Zen decide → Proof of Attention → Spread.',
      '',
      'Pilot week: $0–$1.5k or trade. Free core stays free.',
      'DM for a pilot. Case study > vanity impressions.',
      '',
      `${FARCASTER_HOME.replace('?fc=1', '?room=partners&fc=1')}`,
    ].join('\n'),
  },
  {
    id: 'spread_club',
    title: 'Spread the club',
    channelHint: '/builders',
    embedUrl: FARCASTER_PASSPORT,
    text: [
      SLOGANS.spread,
      '',
      'Your invite = a connection when they claim a Human Passport.',
      'Growth loop: Land → Claim → Spark → Spread → Return.',
      '',
      'Copy your invite in-app. Cast it. Make it rain.',
      FARCASTER_PASSPORT,
    ].join('\n'),
  },
];

/** Ordered rain sequence for MakeItRainDeck */
export const RAIN_CAST_SEQUENCE: CastTemplateId[] = [
  'rain',
  'launch',
  'hearing',
  'weekly_hearing',
  'hook_loop',
  'spread_club',
  'partner_pilot',
];

export function getCastTemplate(id: CastTemplateId): CastTemplate {
  const t = CAST_TEMPLATES.find((c) => c.id === id);
  if (!t) return CAST_TEMPLATES[0];
  return t;
}

export function buildHookLoopCast(truth: HookingTruth): { text: string; embedUrl: string } {
  const embedUrl = `${hookLoopDeepLink(truth.id)}&fc=1`;
  const text = [
    `HOOKING TRUTH #${truth.n}`,
    '',
    `"${truth.truth}"`,
    '',
    `${truth.memeTop}`,
    `${truth.memeBottom}`,
    '',
    'Cast → unlock the next truth.',
    '#HookLoop #HumanEconomy',
  ].join('\n');
  return { text, embedUrl };
}

/** Full share pack still useful for copy; compose uses short cast. */
export function buildHookLoopCastLong(truth: HookingTruth): string {
  return buildHookSharePost(truth);
}

export function isFarcasterClient(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ua = navigator.userAgent || '';
    if (/Warpcast|Farcaster/i.test(ua)) return true;
    // Mini App often opens with fc=1
    return new URLSearchParams(window.location.search).get('fc') === '1';
  } catch {
    return false;
  }
}
