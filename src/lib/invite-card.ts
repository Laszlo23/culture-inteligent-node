/**
 * Growth invite share cards — personalized “join me” images.
 */

import { BRAND, SLOGANS } from './brand-slogans';
import { shareDisplayName } from './display-identity';

export type InviteCardStyle = 'pass' | 'spark' | 'rain' | 'name';

export const INVITE_CARD_STYLES: {
  id: InviteCardStyle;
  label: string;
  vibe: string;
}[] = [
  { id: 'pass', label: 'Pass', vibe: 'Invite to the Human Passport.' },
  { id: 'spark', label: 'Spark', vibe: 'Come do First Spark with me.' },
  { id: 'rain', label: 'Rain', vibe: 'Make it rain — join the loop.' },
  { id: 'name', label: 'Name', vibe: 'Grab a .culture name before it’s gone.' },
];

export function isInviteCardStyle(raw: string | null | undefined): raw is InviteCardStyle {
  return Boolean(raw && INVITE_CARD_STYLES.some((s) => s.id === raw));
}

export function inviteCardImageUrl(
  opts: {
    name: string;
    code: string;
    style: InviteCardStyle;
    origin?: string;
    nonce?: string | number;
  }
): string {
  const origin = (opts.origin || BRAND.url).replace(/\/?$/, '');
  const u = new URL(`${origin}/api/og/invite`);
  u.searchParams.set('name', opts.name);
  u.searchParams.set('code', opts.code);
  u.searchParams.set('style', opts.style);
  u.searchParams.set('n', String(opts.nonce ?? Date.now().toString(36)));
  u.searchParams.set('v', '1');
  return u.toString();
}

export function inviteShareLandingUrl(opts: {
  code: string;
  style: InviteCardStyle;
  origin?: string;
  nonce?: string | number;
}): string {
  const origin = (opts.origin || BRAND.url).replace(/\/?$/, '');
  const u = new URL(`${origin}/`);
  u.searchParams.set('invite', opts.code);
  u.searchParams.set('card', opts.style);
  u.searchParams.set('share', 'invite');
  u.searchParams.set('fc', '1');
  u.searchParams.set('n', String(opts.nonce ?? Date.now().toString(36)));
  return u.toString();
}

export function buildInviteCardPost(opts: {
  username?: string | null;
  walletAddress: string;
  style: InviteCardStyle;
  imageUrl?: string;
  landingUrl?: string;
}): string {
  const who = shareDisplayName({
    username: opts.username,
    walletAddress: opts.walletAddress,
  });
  const code = opts.walletAddress.slice(0, 6);
  const imageUrl =
    opts.imageUrl ||
    inviteCardImageUrl({ name: who, code, style: opts.style });
  const landing =
    opts.landingUrl ||
    inviteShareLandingUrl({ code, style: opts.style });

  const lead =
    opts.style === 'spark'
      ? `${who} invited you to your first Spark.`
      : opts.style === 'name'
        ? `${who} says: mine a .culture name before they’re gone.`
        : opts.style === 'rain'
          ? `${who} is making it rain. Join the Human Economy.`
          : `${who} invited you to the Human Economy.`;

  return [
    lead,
    '',
    SLOGANS.hero,
    SLOGANS.equation,
    '',
    'Build a Human Passport — learn, create, contribute.',
    '',
    landing,
    '',
    `🖼 Invite from ${who}`,
    imageUrl,
    '',
    'Telegram · https://t.me/+4zFH7-2tyW0yOTBk',
    'Discord · https://discord.gg/geUpHt3eSb',
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    '#HumanEconomy #CultureName',
  ].join('\n');
}
