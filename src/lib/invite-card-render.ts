/**
 * Server-only: growth invite share cards (SVG → JPEG).
 */

import sharp from 'sharp';
import { isInviteCardStyle, type InviteCardStyle } from './invite-card.ts';

const W = 1200;
const H = 630;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function nameSize(name: string): number {
  const n = name.length;
  if (n <= 12) return 72;
  if (n <= 18) return 58;
  if (n <= 24) return 48;
  return 40;
}

const STYLES: Record<
  InviteCardStyle,
  { bg0: string; bg1: string; accent: string; accent2: string; eyebrow: string; cta: string }
> = {
  pass: {
    bg0: '#050608',
    bg1: '#0c1520',
    accent: '#22D3EE',
    accent2: '#F59E0B',
    eyebrow: 'YOU’RE INVITED',
    cta: 'CLAIM HUMAN PASSPORT',
  },
  spark: {
    bg0: '#0a0806',
    bg1: '#1a1208',
    accent: '#F59E0B',
    accent2: '#22D3EE',
    eyebrow: 'FIRST SPARK WAITING',
    cta: 'START IN ~2 MIN',
  },
  rain: {
    bg0: '#060810',
    bg1: '#101828',
    accent: '#A78BFA',
    accent2: '#22D3EE',
    eyebrow: 'MAKE IT RAIN',
    cta: 'JOIN THE LOOP',
  },
  name: {
    bg0: '#081418',
    bg1: '#0a1a18',
    accent: '#34D399',
    accent2: '#F59E0B',
    eyebrow: 'MINE A .CULTURE NAME',
    cta: 'GRAB YOURS',
  },
};

function buildSvg(name: string, style: InviteCardStyle): string {
  const p = STYLES[style];
  const size = nameSize(name);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bg0}"/>
      <stop offset="100%" stop-color="${p.bg1}"/>
    </linearGradient>
    <radialGradient id="glow" cx="25%" cy="20%" r="55%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="28" fill="none" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="2"/>

  <text x="80" y="120" font-family="ui-monospace, Menlo, monospace" font-size="22" font-weight="700" fill="${p.accent}" letter-spacing="5">${esc(p.eyebrow)}</text>

  <text x="80" y="240" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="900" font-style="italic" fill="#F8FAFC">${esc(name)}</text>
  <text x="80" y="300" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" fill="#94A3B8">invites you to the Human Economy</text>

  <text x="80" y="400" font-family="ui-sans-serif, system-ui, sans-serif" font-size="24" fill="#CBD5E1">Learn. Create. Contribute. Own your reputation.</text>

  <rect x="80" y="460" width="340" height="52" rx="14" fill="${p.accent}" fill-opacity="0.2" stroke="${p.accent}" stroke-opacity="0.6"/>
  <text x="250" y="494" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="18" font-weight="800" fill="${p.accent}" letter-spacing="2">${esc(p.cta)}</text>

  <text x="80" y="570" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="#64748B" letter-spacing="2">BUILDING CULTURE</text>
  <text x="1120" y="570" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${p.accent2}" letter-spacing="2">SHARE · GROW</text>
</svg>`;
}

const cache = new Map<string, Buffer>();

export async function renderInviteCard(opts: {
  name: string;
  style?: string | null;
}): Promise<{ jpeg: Buffer; style: InviteCardStyle; name: string } | { error: string }> {
  const name = (opts.name || 'Builder').trim().slice(0, 32) || 'Builder';
  const style: InviteCardStyle = isInviteCardStyle(opts.style) ? opts.style : 'pass';
  const key = `${name}:${style}`;
  const hit = cache.get(key);
  if (hit) return { jpeg: hit, style, name };

  const jpeg = await sharp(Buffer.from(buildSvg(name, style)))
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  if (cache.size > 80) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, jpeg);
  return { jpeg, style, name };
}
