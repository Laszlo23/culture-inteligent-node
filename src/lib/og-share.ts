/**
 * Feed OG pack — every share gets a unique URL so crawlers re-scrape.
 *
 * Platforms (Farcaster / X / Meta) cache embed metadata **per URL**.
 * Rotating bytes at the same path does not refresh previews.
 * Solution: unique `?share=<pack>&n=<nonce>` landing pages + versioned image URLs.
 */

import { BRAND, SLOGANS } from './brand-slogans';

const ORIGIN = BRAND.url.replace(/\/?$/, '');
const ROTATE_KEY = 'culture_og_share_rotate_v1';

/** Bump when OG art changes — busts CDN / crawler image caches. */
export const OG_ASSET_VERSION = '20260720a';

export type OgPackId =
  | 'human_value'
  | 'passport_zero'
  | 'contribution'
  | 'first_spark'
  | 'spread'
  | 'hearing';

export type OgPack = {
  id: OgPackId;
  title: string;
  imageUrl: string;
  path: string;
  alt: string;
  message: string;
  /** Canonical app path after launch (room / hear). */
  appPath: string;
  /** Share landing used as embed URL (includes ?share=). */
  embedPage: string;
};

function versionedAsset(path: string): string {
  const base = path.startsWith('http') ? path : `${ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
  const u = new URL(base);
  u.searchParams.set('v', OG_ASSET_VERSION);
  return u.toString();
}

function packEmbedPage(id: OgPackId, appPath: string): string {
  const u = new URL(ORIGIN + '/');
  u.searchParams.set('share', id);
  u.searchParams.set('fc', '1');
  // Preserve deep-link intent for humans launching the mini app
  if (appPath.includes('hear=1')) u.searchParams.set('hear', '1');
  if (appPath.includes('room=passport')) u.searchParams.set('room', 'passport');
  return u.toString();
}

export const OG_PACKS: OgPack[] = [
  {
    id: 'human_value',
    title: 'Human value',
    path: '/og/human-value.jpg',
    imageUrl: versionedAsset('/og/human-value.jpg'),
    alt: 'Human value was never measured correctly — Building Culture',
    appPath: `${ORIGIN}/?fc=1`,
    embedPage: packEmbedPage('human_value', `${ORIGIN}/?fc=1`),
    message: [
      SLOGANS.hero,
      '',
      'Every human carries invisible value.',
      'Learning. Creating. Helping others.',
      '',
      `${BRAND.parent} builds the ${BRAND.product}.`,
      'Claim your Human Passport.',
      '',
      `${ORIGIN}/?fc=1`,
    ].join('\n'),
  },
  {
    id: 'passport_zero',
    title: 'Passport · zero',
    path: '/og/passport-zero.jpg',
    imageUrl: versionedAsset('/og/passport-zero.jpg'),
    alt: 'Your Human Passport starts at zero',
    appPath: `${ORIGIN}/?room=passport&fc=1`,
    embedPage: packEmbedPage('passport_zero', `${ORIGIN}/?room=passport&fc=1`),
    message: [
      'Your Human Passport starts at zero.',
      '',
      'Zero is not empty — it is a journey.',
      'Knowledge · Builder · Contribution.',
      '',
      SLOGANS.awakeningZero,
      '',
      `${ORIGIN}/?room=passport&fc=1`,
    ].join('\n'),
  },
  {
    id: 'contribution',
    title: 'Contribution',
    path: '/og/contribution.jpg',
    imageUrl: versionedAsset('/og/contribution.jpg'),
    alt: 'Human Value = Contribution',
    appPath: `${ORIGIN}/?fc=1`,
    embedPage: packEmbedPage('contribution', `${ORIGIN}/?fc=1`),
    message: [
      SLOGANS.equation,
      '',
      'Not hours. Not doomscroll.',
      'What you learn, create, and give.',
      '',
      'That is the Human Economy.',
      '',
      `${ORIGIN}/?fc=1`,
    ].join('\n'),
  },
  {
    id: 'first_spark',
    title: 'First Spark',
    path: '/og/first-spark.jpg',
    imageUrl: versionedAsset('/og/first-spark.jpg'),
    alt: 'Your first Spark makes potential visible',
    appPath: `${ORIGIN}/?fc=1`,
    embedPage: packEmbedPage('first_spark', `${ORIGIN}/?fc=1`),
    message: [
      'Your first Spark makes potential visible.',
      '',
      SLOGANS.firstSparkSupport,
      'Proof of Attention > empty hours.',
      '',
      `${ORIGIN}/?fc=1`,
    ].join('\n'),
  },
  {
    id: 'spread',
    title: 'Spread love',
    path: '/og/spread.jpg',
    imageUrl: versionedAsset('/og/spread.jpg'),
    alt: 'Share knowledge. Lift others.',
    appPath: `${ORIGIN}/?room=passport&fc=1`,
    embedPage: packEmbedPage('spread', `${ORIGIN}/?room=passport&fc=1`),
    message: [
      'Share knowledge. Lift others.',
      '',
      SLOGANS.spread,
      'Invite one builder. Reputation compounds.',
      '',
      `${ORIGIN}/?room=passport&fc=1`,
    ].join('\n'),
  },
  {
    id: 'hearing',
    title: 'Hearing Mode',
    path: '/og/hearing.jpg',
    imageUrl: versionedAsset('/og/hearing.jpg'),
    alt: 'Ears first. Then prove.',
    appPath: `${ORIGIN}/?hear=1&fc=1`,
    embedPage: packEmbedPage('hearing', `${ORIGIN}/?hear=1&fc=1`),
    message: [
      'Ears first. Then prove.',
      '',
      'Hearing Mode — soft guide, real attention.',
      'Prove contribution without staring at the screen.',
      '',
      `${ORIGIN}/?hear=1&fc=1`,
    ].join('\n'),
  },
];

export function isOgPackId(raw: string | null | undefined): raw is OgPackId {
  return Boolean(raw && OG_PACKS.some((p) => p.id === raw));
}

export function getOgPack(id: OgPackId): OgPack {
  return OG_PACKS.find((p) => p.id === id) ?? OG_PACKS[0];
}

/** Unique share landing — `n` forces crawlers to treat each cast as a new URL. */
export function uniqueShareUrl(pack: OgPack, nonce?: string | number): string {
  const u = new URL(pack.embedPage);
  u.searchParams.set('n', String(nonce ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`));
  u.searchParams.set('v', OG_ASSET_VERSION);
  return u.toString();
}

export function versionedOgImage(pathOrUrl: string): string {
  return versionedAsset(pathOrUrl);
}

export function defaultOgImageUrl(): string {
  return versionedAsset('/og.jpg');
}

function readRotateIndex(): number {
  try {
    const n = Number(localStorage.getItem(ROTATE_KEY) || '0');
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeRotateIndex(n: number): void {
  try {
    localStorage.setItem(ROTATE_KEY, String(n));
  } catch {
    // ignore
  }
}

/** Peek next pack without advancing (UI preview). */
export function peekOgPack(): OgPack {
  return OG_PACKS[readRotateIndex() % OG_PACKS.length];
}

/**
 * Advance rotation and return the pack for this share.
 * Every call → next image in the pack (cycles through all 6).
 */
export function nextOgPack(): OgPack {
  const i = readRotateIndex();
  writeRotateIndex(i + 1);
  return OG_PACKS[i % OG_PACKS.length];
}

/** Attach rotating OG art + unique embed URL to any share body. */
export function withRotatingOg(opts: {
  text: string;
  embedPage?: string;
  /** Include image URL in the text body (for clipboard / native share) */
  appendImageLink?: boolean;
}): { text: string; embedUrl: string; imageUrl: string; pack: OgPack } {
  const pack = nextOgPack();
  const embedUrl = opts.embedPage
    ? (() => {
        const u = new URL(opts.embedPage!, ORIGIN);
        u.searchParams.set('share', pack.id);
        u.searchParams.set('n', `${Date.now().toString(36)}`);
        u.searchParams.set('v', OG_ASSET_VERSION);
        if (!u.searchParams.has('fc')) u.searchParams.set('fc', '1');
        return u.toString();
      })()
    : uniqueShareUrl(pack);
  const text = opts.appendImageLink
    ? `${opts.text.trim()}\n\n🖼 ${pack.title}\n${pack.imageUrl}`
    : opts.text;
  return { text, embedUrl, imageUrl: pack.imageUrl, pack };
}

/** Day-based pack for static surfaces (not share clicks). */
export function ogPackForToday(now = Date.now()): OgPack {
  const day = Math.floor(now / 86_400_000);
  return OG_PACKS[day % OG_PACKS.length];
}

/** Mini App embed JSON for a pack (server + client). */
export function buildMiniAppEmbedJson(pack: OgPack): string {
  return JSON.stringify({
    version: 'next',
    imageUrl: pack.imageUrl,
    button: {
      title: 'Build Passport',
      action: {
        type: 'launch_miniapp',
        name: 'Building Culture',
        url: pack.appPath,
        splashImageUrl: versionedAsset('/miniapp/splash-200.png'),
        splashBackgroundColor: '#050608',
      },
    },
  });
}
