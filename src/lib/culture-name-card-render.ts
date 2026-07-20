/**
 * Server-only: render laszlo.culture share cards with Sharp (SVG → JPEG).
 */

import sharp from 'sharp';
import {
  formatCultureName,
  normalizeCultureLabel,
  validateCultureLabel,
} from './culture-names.ts';
import {
  isCultureCardStyle,
  type CultureCardStyle,
} from './culture-name-card.ts';

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

function nameFontSize(full: string): number {
  const n = full.length;
  if (n <= 10) return 92;
  if (n <= 14) return 78;
  if (n <= 18) return 64;
  return 52;
}

type Palette = {
  bg0: string;
  bg1: string;
  accent: string;
  accent2: string;
  ink: string;
  mute: string;
  eyebrow: string;
  footer: string;
  stamp?: string;
};

const PALETTES: Record<CultureCardStyle, Palette> = {
  mine: {
    bg0: '#0a0806',
    bg1: '#1a1208',
    accent: '#F59E0B',
    accent2: '#22D3EE',
    ink: '#F8FAFC',
    mute: '#94A3B8',
    eyebrow: 'I MINED THIS',
    footer: 'CULTURE NAME · FIRST COME',
  },
  flex: {
    bg0: '#050608',
    bg1: '#0c1520',
    accent: '#22D3EE',
    accent2: '#F59E0B',
    ink: '#FFFFFF',
    mute: '#94A3B8',
    eyebrow: 'HUMAN ECONOMY HANDLE',
    footer: 'BUILDING CULTURE · OWN YOUR NAME',
  },
  taken: {
    bg0: '#10060a',
    bg1: '#1a0a10',
    accent: '#FB7185',
    accent2: '#F59E0B',
    ink: '#F8FAFC',
    mute: '#CBD5E1',
    eyebrow: 'STATUS · TAKEN',
    footer: 'SORRY · MINE YOURS',
    stamp: 'CLAIMED',
  },
  signal: {
    bg0: '#04080c',
    bg1: '#061820',
    accent: '#22D3EE',
    accent2: '#34D399',
    ink: '#E2F8FF',
    mute: '#64748B',
    eyebrow: 'SIGNAL LOCKED',
    footer: 'PROOF OF IDENTITY · .CULTURE',
  },
};

function lattice(accent: string): string {
  const lines: string[] = [];
  for (let x = 0; x <= W; x += 48) {
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${accent}" stroke-opacity="0.07" stroke-width="1"/>`
    );
  }
  for (let y = 0; y <= H; y += 48) {
    lines.push(
      `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${accent}" stroke-opacity="0.07" stroke-width="1"/>`
    );
  }
  return lines.join('');
}

function buildSvg(label: string, style: CultureCardStyle): string {
  const full = formatCultureName(label);
  const p = PALETTES[style];
  const size = nameFontSize(full);
  const stamp =
    style === 'taken' && p.stamp
      ? `<g transform="translate(980,140) rotate(-18)">
          <rect x="-90" y="-36" width="180" height="72" rx="8" fill="none" stroke="${p.accent}" stroke-width="4"/>
          <text x="0" y="10" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="28" font-weight="900" fill="${p.accent}" letter-spacing="4">${esc(p.stamp)}</text>
        </g>`
      : '';

  const subtitle =
    style === 'mine'
      ? 'Bound to my wallet · Human Economy'
      : style === 'flex'
        ? 'Not Op_xxxx — a real Culture Name'
        : style === 'taken'
          ? 'You snooze · you lose the handle'
          : 'Identity online · attention has a name';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bg0}"/>
      <stop offset="55%" stop-color="${p.bg1}"/>
      <stop offset="100%" stop-color="${p.bg0}"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="20%" r="55%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="85%" cy="80%" r="45%">
      <stop offset="0%" stop-color="${p.accent2}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${p.accent2}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  ${lattice(p.accent2)}
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" rx="28" fill="none" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="2"/>
  <rect x="48" y="48" width="${W - 96}" height="${H - 96}" rx="22" fill="none" stroke="${p.accent2}" stroke-opacity="0.18" stroke-width="1"/>

  <text x="80" y="120" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="22" font-weight="700" fill="${p.accent}" letter-spacing="6">${esc(p.eyebrow)}</text>

  <text x="80" y="320" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="900" font-style="italic" fill="${p.ink}">${esc(full)}</text>

  <text x="80" y="390" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26" fill="${p.mute}">${esc(subtitle)}</text>

  ${stamp}

  <rect x="80" y="470" width="220" height="44" rx="12" fill="${p.accent}" fill-opacity="0.15" stroke="${p.accent}" stroke-opacity="0.5"/>
  <text x="190" y="499" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="16" font-weight="800" fill="${p.accent}" letter-spacing="3">.CULTURE</text>

  <text x="1120" y="560" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="16" fill="${p.mute}" letter-spacing="3">${esc(p.footer)}</text>
  <text x="80" y="560" font-family="ui-monospace, Menlo, monospace" font-size="14" fill="${p.mute}" letter-spacing="2">BUILDING CULTURE</text>
</svg>`;
}

const cache = new Map<string, Buffer>();
const CACHE_MAX = 80;

export async function renderCultureNameCard(opts: {
  name: string;
  style?: string | null;
}): Promise<{ jpeg: Buffer; full: string; style: CultureCardStyle } | { error: string }> {
  const v = validateCultureLabel(opts.name);
  if (v.ok === false) return { error: v.error };
  const style: CultureCardStyle = isCultureCardStyle(opts.style) ? opts.style : 'mine';
  const key = `${v.label}:${style}`;
  const hit = cache.get(key);
  if (hit) return { jpeg: hit, full: formatCultureName(v.label), style };

  const svg = buildSvg(v.label, style);
  const jpeg = await sharp(Buffer.from(svg))
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, jpeg);
  return { jpeg, full: formatCultureName(v.label), style };
}

export function parseCultureCardQuery(q: {
  name?: unknown;
  style?: unknown;
}): { name: string; style: string | null } {
  return {
    name: normalizeCultureLabel(String(q.name || '')),
    style: q.style != null ? String(q.style) : null,
  };
}
