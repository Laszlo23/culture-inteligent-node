/**
 * Farcaster growth kit — compose casts, Mini App deep links, cast templates.
 * Manifest: public/.well-known/farcaster.json
 */

import { BRAND, SLOGANS } from './brand-slogans';
import { buildHookSharePost, hookLoopDeepLink, type HookingTruth } from './hook-loop-campaign';
import {
  getOgPack,
  nextOgPack,
  uniqueShareUrl,
  versionedOgImage,
  OG_ASSET_VERSION,
  type OgPackId,
} from './og-share';

export const FARCASTER_HOME = `${BRAND.url.replace(/\/?$/, '/')}?fc=1`;
export const FARCASTER_HEARING = `${BRAND.url.replace(/\/?$/, '/')}?hear=1&fc=1`;
export const FARCASTER_HOOK_LOOP = `${BRAND.url.replace(/\/?$/, '/')}?room=hook-loop&fc=1`;
export const FARCASTER_TRAP_ID = `${BRAND.url.replace(/\/?$/, '/')}?room=trap-id&fc=1`;
export const FARCASTER_PASSPORT = `${BRAND.url.replace(/\/?$/, '/')}?room=passport&fc=1`;

/** Warpcast / Farcaster compose (text + embeds — page and/or OG image). */
export function buildFarcasterComposeUrl(
  text: string,
  embedUrl?: string,
  imageUrl?: string
): string {
  const params = new URLSearchParams();
  params.set('text', text);
  // Image first so the feed card shows the visual pack
  if (imageUrl) params.append('embeds[]', imageUrl);
  if (embedUrl && embedUrl !== imageUrl) params.append('embeds[]', embedUrl);
  return `https://farcaster.xyz/~/compose?${params.toString()}`;
}

/**
 * Open compose with text + embeds.
 * Always advances the OG rotator so consecutive shares get a different image.
 * Pass `imageUrl` only when the user picked a specific card (still advances).
 */
export function openFarcasterCompose(
  text: string,
  embedUrl?: string,
  imageUrl?: string
): void {
  if (typeof window === 'undefined') return;
  const pack = nextOgPack();
  // Versioned image + unique share landing = fresh scrape every cast
  const resolvedImage = versionedOgImage(imageUrl || pack.imageUrl);
  let resolvedEmbed: string;
  if (embedUrl) {
    try {
      const u = new URL(embedUrl, BRAND.url);
      if (!u.searchParams.has('share')) u.searchParams.set('share', pack.id);
      u.searchParams.set('n', Date.now().toString(36));
      u.searchParams.set('v', OG_ASSET_VERSION);
      if (!u.searchParams.has('fc')) u.searchParams.set('fc', '1');
      resolvedEmbed = u.toString();
    } catch {
      resolvedEmbed = uniqueShareUrl(pack);
    }
  } else {
    resolvedEmbed = uniqueShareUrl(pack);
  }
  const url = buildFarcasterComposeUrl(text, resolvedEmbed, resolvedImage);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export type CastTemplateId =
  | 'launch'
  | 'passport'
  | 'hook_loop'
  | 'trap_id'
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
  /** Optional OG pack image for varied feed cards */
  imageUrl?: string;
  ogPackId?: OgPackId;
};

function withOg(
  packId: OgPackId,
  base: Omit<CastTemplate, 'imageUrl' | 'ogPackId' | 'text' | 'embedUrl'> & {
    text?: string;
    embedUrl?: string;
  }
): CastTemplate {
  const pack = getOgPack(packId);
  return {
    ...base,
    text: base.text ?? pack.message,
    embedUrl: base.embedUrl ?? pack.embedPage,
    imageUrl: pack.imageUrl,
    ogPackId: packId,
  };
}

export const CAST_TEMPLATES: CastTemplate[] = [
  withOg('human_value', {
    id: 'launch',
    title: 'Launch — Human Economy',
    channelHint: '/base /builders /onchain',
  }),
  withOg('passport_zero', {
    id: 'passport',
    title: 'Human Passport',
    channelHint: '/builders /creators',
    text: [
      'Your LinkedIn flex is a résumé.',
      'Your Human Passport is reputation you own.',
      '',
      'Starts at zero. Zero creates a journey.',
      SLOGANS.equation,
      '',
      SLOGANS.ctaPassport,
      FARCASTER_PASSPORT,
    ].join('\n'),
    embedUrl: FARCASTER_PASSPORT,
  }),
  withOg('contribution', {
    id: 'passport_card',
    title: 'See my Human Passport',
    channelHint: '/builders /creators',
    text: [
      'See my Human Passport.',
      '',
      'Human Value — Knowledge · Creativity · Contribution.',
      'Verified on Building Culture.',
      '',
      SLOGANS.ctaPassport,
      FARCASTER_PASSPORT,
    ].join('\n'),
    embedUrl: FARCASTER_PASSPORT,
  }),
  {
    id: 'hook_loop',
    title: 'Hook Loop viral',
    channelHint: '/memes /attention',
    embedUrl: FARCASTER_HOOK_LOOP,
    imageUrl: `${BRAND.url.replace(/\/?$/, '')}/campaign/failure-curve.webp`,
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
    id: 'trap_id',
    title: 'Scroll Trap ID',
    channelHint: '/memes /attention',
    embedUrl: FARCASTER_TRAP_ID,
    imageUrl: `${BRAND.url.replace(/\/?$/, '')}/campaign/failure-curve.webp`,
    text: [
      SLOGANS.trapId,
      '',
      SLOGANS.trapIdSub,
      SLOGANS.trapIdShare,
      '',
      FARCASTER_TRAP_ID,
      '',
      '#TrapID #ProofOfAttention',
    ].join('\n'),
  },
  withOg('first_spark', {
    id: 'proof',
    title: 'Proof of Attention',
    channelHint: '/learning /builders',
  }),
  withOg('hearing', {
    id: 'hearing',
    title: 'Hearing Mode',
    channelHint: '/a11y /builders',
  }),
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
  withOg('contribution', {
    id: 'rain',
    title: 'Make it rain',
    channelHint: '/builders /base /onchain',
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
    embedUrl: FARCASTER_HOME,
  }),
  withOg('hearing', {
    id: 'weekly_hearing',
    title: 'Weekly Hearing demo',
    channelHint: '/a11y /builders /attention',
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
    embedUrl: FARCASTER_HEARING,
  }),
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
  withOg('spread', {
    id: 'spread_club',
    title: 'Spread the club',
    channelHint: '/builders',
    text: [
      SLOGANS.spread,
      '',
      'Your invite = a connection when they claim a Human Passport.',
      'Growth loop: Land → Claim → Spark → Spread → Return.',
      '',
      'Copy your invite in-app. Cast it. Make it rain.',
      FARCASTER_PASSPORT,
    ].join('\n'),
    embedUrl: FARCASTER_PASSPORT,
  }),
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
