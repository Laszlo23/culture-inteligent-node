/**
 * Server-only: Trap ID share cards — photo-backed meme posters that hook hard.
 * Bundled Anton face + fat outline so Linux VPS matches local punch.
 */

import path from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { CULTURE_BROADCAST } from './culture-broadcast.ts';
import { getTrapById, type TrapArchetype } from './trap-id.ts';
import { isTrapCardStyle, type TrapCardStyle } from './trap-id-card.ts';

const W = 1200;
const H = 630;
/** Bump when art/layout changes so CDN/browser caches die. */
const RENDER_VERSION = '3';

const ART_FILE: Record<string, string> = {
  failureCurve: 'failure-curve.webp',
  spreadLove: 'spread-love.webp',
  cultureClub: 'culture-club.webp',
  mineCulture: 'mine-culture.webp',
};

const FONT_CANDIDATES = [
  path.join(process.cwd(), 'assets/fonts/Anton-Regular.ttf'),
  path.join(process.cwd(), 'dist/assets/fonts/Anton-Regular.ttf'),
];

type Palette = {
  accent: string;
  accent2: string;
  ink: string;
  warn: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (words.join(' ').length > lines.join(' ').length) {
    const last = lines[lines.length - 1];
    if (last && last.length > 3) lines[lines.length - 1] = `${last.slice(0, -1)}…`;
  }
  return lines;
}

function paletteFor(trap: TrapArchetype): Palette {
  const byTrap: Record<string, Palette> = {
    TID01: { accent: '#FDE047', accent2: '#22D3EE', ink: '#FFFFFF', warn: '#FB7185' },
    TID02: { accent: '#FDA4AF', accent2: '#FDE047', ink: '#FFFFFF', warn: '#FB7185' },
    TID03: { accent: '#DDD6FE', accent2: '#22D3EE', ink: '#FFFFFF', warn: '#FDE047' },
    TID04: { accent: '#6EE7B7', accent2: '#FDE047', ink: '#FFFFFF', warn: '#FB7185' },
    TID05: { accent: '#F9A8D4', accent2: '#22D3EE', ink: '#FFFFFF', warn: '#FDE047' },
    TID06: { accent: '#FDE047', accent2: '#FB7185', ink: '#FFFFFF', warn: '#FB7185' },
  };
  return byTrap[trap.id] || byTrap.TID01;
}

function resolveFontUrl(): string | null {
  const hit = FONT_CANDIDATES.find((p) => existsSync(p));
  return hit ? pathToFileURL(hit).href : null;
}

function fontFaceCss(): string {
  const url = resolveFontUrl();
  if (!url) return '';
  return `@font-face { font-family: 'TrapMeme'; src: url('${url}') format('truetype'); font-weight: 400 900; font-style: normal; }`;
}

const MEME_FACE = "TrapMeme, Impact, 'Arial Black', Haettenschweiler, sans-serif";

/** Fat meme outline: 8-direction black offsets + fill (librsvg-safe). */
function memeLine(
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  opts?: { anchor?: string }
): string {
  const anchor = opts?.anchor || 'middle';
  const t = esc(text.toUpperCase());
  const o = Math.max(5, Math.round(size * 0.09));
  const offsets = [
    [-o, 0],
    [o, 0],
    [0, -o],
    [0, o],
    [-o, -o],
    [o, -o],
    [-o, o],
    [o, o],
  ];
  const outline = offsets
    .map(
      ([dx, dy]) =>
        `<text x="${x + dx}" y="${y + dy}" text-anchor="${anchor}"
          font-family="${MEME_FACE}" font-size="${size}" font-weight="900"
          letter-spacing="2" fill="#000000">${t}</text>`
    )
    .join('');
  return `${outline}
    <text x="${x}" y="${y}" text-anchor="${anchor}"
      font-family="${MEME_FACE}" font-size="${size}" font-weight="900"
      letter-spacing="2" fill="${fill}">${t}</text>`;
}

function quoteBlock(
  lines: string[],
  x: number,
  startY: number,
  size: number,
  fill: string,
  gap = 38
): string {
  return lines
    .map((line, i) => {
      const y = startY + i * gap;
      // Soft black halo for readability on photo
      return `
        <text x="${x + 2}" y="${y + 2}" text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="${size}" font-style="italic" font-weight="700"
          fill="#000000" fill-opacity="0.75">${esc(line)}</text>
        <text x="${x}" y="${y}" text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="${size}" font-style="italic" font-weight="700"
          fill="${fill}">${esc(line)}</text>`;
    })
    .join('');
}

function resolveArtPath(trap: TrapArchetype): string | null {
  const key = trap.art as keyof typeof CULTURE_BROADCAST.art;
  const rel = CULTURE_BROADCAST.art[key];
  if (!rel || typeof rel !== 'string') return null;
  const file = ART_FILE[trap.art] || path.basename(rel);
  const candidates = [
    path.join(process.cwd(), 'public', 'campaign', file),
    path.join(process.cwd(), 'dist', 'campaign', file),
  ];
  return candidates.find((p) => existsSync(p)) || null;
}

function buildOverlaySvg(trap: TrapArchetype, style: TrapCardStyle): string {
  const p = paletteFor(trap);
  const handle = trap.handle.toUpperCase();
  const face = fontFaceCss();

  const topHook = `
    <rect x="0" y="0" width="${W}" height="78" fill="#FDE047"/>
    <text x="600" y="52" text-anchor="middle"
      font-family="${MEME_FACE}" font-size="34" font-weight="900" letter-spacing="7"
      fill="#0A0A0A">WHAT&apos;S YOUR BAIT?</text>`;

  const bottomBar = `
    <rect x="0" y="${H - 86}" width="${W}" height="86" fill="#0A0A0A"/>
    <rect x="0" y="${H - 86}" width="${W}" height="6" fill="${p.accent}"/>
    <text x="80" y="${H - 32}"
      font-family="${MEME_FACE}" font-size="30" font-weight="900" letter-spacing="3"
      fill="#FFFFFF">FIND YOURS · 30 SEC</text>
    <text x="1120" y="${H - 32}" text-anchor="end"
      font-family="ui-monospace, Menlo, monospace"
      font-size="18" font-weight="700" letter-spacing="2"
      fill="${p.accent2}">TRAP ID · ${esc(trap.id)}</text>`;

  // Keep photo visible — light center, darker edges
  const vignette = `
    <defs>
      <radialGradient id="vig" cx="50%" cy="48%" r="78%">
        <stop offset="0%" stop-color="#000" stop-opacity="0.05"/>
        <stop offset="55%" stop-color="#000" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.72"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#vig)"/>`;

  let body = '';

  if (style === 'meme') {
    body = `
      ${memeLine(trap.memeTop, 600, 220, 72, '#FFFFFF')}
      ${memeLine(trap.memeBottom, 600, 310, 64, p.accent)}
      <g transform="translate(600, 420)">
        <rect x="-300" y="-42" width="600" height="84" rx="14"
          fill="#0A0A0A" stroke="${p.accent}" stroke-width="5"/>
        <text y="14" text-anchor="middle"
          font-family="${MEME_FACE}" font-size="40" font-weight="900" letter-spacing="3"
          fill="${p.accent}">I&apos;M A ${esc(handle)}</text>
      </g>`;
  } else if (style === 'dare') {
    const dareLines = wrapLines(trap.challenge, 34, 3);
    body = `
      <text x="600" y="155" text-anchor="middle"
        font-family="${MEME_FACE}" font-size="26" font-weight="900" letter-spacing="6"
        fill="${p.warn}">⚠ CHALLENGE DROP ⚠</text>
      ${memeLine(`I'M A ${handle}`, 600, 235, 58, p.accent)}
      ${quoteBlock(dareLines, 600, 320, 32, '#FFFFFF', 40)}
      <rect x="220" y="448" width="760" height="52" rx="10" fill="${p.warn}"/>
      <text x="600" y="484" text-anchor="middle"
        font-family="${MEME_FACE}" font-size="26" font-weight="900" letter-spacing="3"
        fill="#0A0A0A">TAG SOMEONE · PROVE ME WRONG</text>`;
  } else if (style === 'mirror') {
    const truthLines = wrapLines(trap.truth, 38, 3);
    const flipLines = wrapLines(trap.flip, 40, 2);
    body = `
      ${memeLine(handle, 600, 175, 54, p.accent)}
      ${quoteBlock(truthLines.map((l, i, arr) => {
        if (arr.length === 1) return `"${l}"`;
        if (i === 0) return `"${l}`;
        if (i === arr.length - 1) return `${l}"`;
        return l;
      }), 600, 250, 30, '#FFFFFF', 38)}
      <rect x="200" y="375" width="800" height="5" fill="${p.accent2}"/>
      ${quoteBlock(flipLines, 600, 430, 26, p.accent2, 34)}`;
  } else {
    const roastRaw = wrapLines(trap.roast, 34, 3);
    const roastLines = roastRaw.map((line, i) => {
      if (roastRaw.length === 1) return `"${line}"`;
      if (i === 0) return `"${line}`;
      if (i === roastRaw.length - 1) return `${line}"`;
      return line;
    });
    body = `
      <text x="600" y="155" text-anchor="middle"
        font-family="ui-monospace, Menlo, monospace"
        font-size="18" font-weight="700" letter-spacing="6"
        fill="${p.accent2}">SCROLL TRAP REVEALED</text>
      ${memeLine(`I'M A ${handle}`, 600, 240, 62, p.accent)}
      ${quoteBlock(roastLines, 600, 320, 34, '#FFFFFF', 42)}
      ${memeLine(trap.memeBottom, 600, 470, 40, p.warn)}`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><style type="text/css"><![CDATA[
    ${face}
  ]]></style></defs>
  ${vignette}
  ${topHook}
  ${body}
  ${bottomBar}
</svg>`;
}

function buildFallbackBgSvg(trap: TrapArchetype): string {
  const p = paletteFor(trap);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12080c"/>
      <stop offset="50%" stop-color="#1c1020"/>
      <stop offset="100%" stop-color="#081018"/>
    </linearGradient>
    <radialGradient id="g1" cx="20%" cy="25%" r="55%">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="85%" cy="75%" r="50%">
      <stop offset="0%" stop-color="${p.accent2}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${p.accent2}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
</svg>`;
}

const cache = new Map<string, Buffer>();
const CACHE_MAX = 80;

export async function renderTrapIdCard(opts: {
  trap: string;
  style?: string | null;
}): Promise<{ jpeg: Buffer; trap: TrapArchetype; style: TrapCardStyle } | { error: string }> {
  const trap = getTrapById(opts.trap);
  if (!trap) return { error: 'Unknown trap id.' };
  const style: TrapCardStyle = isTrapCardStyle(opts.style) ? opts.style : 'meme';
  const key = `${RENDER_VERSION}:${trap.id}:${style}`;
  const hit = cache.get(key);
  if (hit) return { jpeg: hit, trap, style };

  const overlayPng = await sharp(Buffer.from(buildOverlaySvg(trap, style))).png().toBuffer();

  let base: Buffer;
  const artPath = resolveArtPath(trap);
  if (artPath) {
    // Keep campaign color alive — don't crush to mud
    base = await sharp(artPath)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .modulate({ brightness: 0.78, saturation: 1.25 })
      .toBuffer();
  } else {
    base = await sharp(Buffer.from(buildFallbackBgSvg(trap))).png().toBuffer();
  }

  const jpeg = await sharp(base)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(key, jpeg);
  return { jpeg, trap, style };
}
