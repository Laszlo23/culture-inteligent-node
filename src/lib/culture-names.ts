/**
 * Culture Names — wallet handles like laszlo.culture
 * First-come claim. One name per wallet. Resolve by name or wallet.
 */

import { BRAND, SLOGANS } from './brand-slogans';

export const CULTURE_NAME_SUFFIX = '.culture' as const;
export const CULTURE_NAME_ROOM = 'culture-name' as const;
export const CULTURE_NAME_STORAGE_KEY = 'culture_name_mine_v1';

/** Label only (no suffix): laszlo */
export type CultureLabel = string;

export type CultureNameRecord = {
  name: CultureLabel;
  walletAddress: string;
  claimedAt: string;
};

const RESERVED = new Set([
  'admin',
  'building',
  'culture',
  'node',
  'passport',
  'official',
  'support',
  'help',
  'api',
  'www',
  'null',
  'undefined',
  'system',
  'treasury',
  'human',
  'economy',
  'hearing',
  'spark',
  'zen',
  'void',
  'root',
  'owner',
  'mod',
  'moderator',
  'team',
  'staff',
  'test',
  'demo',
  'guest',
]);

export type CultureNameValidation =
  | { ok: true; label: CultureLabel; full: string }
  | { ok: false; error: string };

/** Strip .culture / @ / whitespace; lowercase. */
export function normalizeCultureLabel(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^@+/, '');
  if (s.endsWith(CULTURE_NAME_SUFFIX)) {
    s = s.slice(0, -CULTURE_NAME_SUFFIX.length);
  }
  s = s.replace(/[^a-z0-9-]/g, '');
  s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return s;
}

export function validateCultureLabel(raw: string): CultureNameValidation {
  const label = normalizeCultureLabel(raw);
  if (label.length < 3) {
    return { ok: false, error: 'At least 3 characters.' };
  }
  if (label.length > 16) {
    return { ok: false, error: 'Max 16 characters.' };
  }
  if (!/^[a-z][a-z0-9-]*$/.test(label)) {
    return { ok: false, error: 'Start with a letter. Use a–z, 0–9, hyphen.' };
  }
  if (label.includes('--')) {
    return { ok: false, error: 'No double hyphens.' };
  }
  if (RESERVED.has(label)) {
    return { ok: false, error: 'That name is reserved.' };
  }
  return { ok: true, label, full: formatCultureName(label) };
}

export function formatCultureName(label: CultureLabel): string {
  return `${normalizeCultureLabel(label)}${CULTURE_NAME_SUFFIX}`;
}

export function cultureNameDeepLink(label: CultureLabel): string {
  const base = BRAND.url.replace(/\/?$/, '/');
  return `${base}?room=culture-name&name=${encodeURIComponent(normalizeCultureLabel(label))}`;
}

export function buildCultureNameSharePost(label: CultureLabel): string {
  const full = formatCultureName(label);
  const link = cultureNameDeepLink(label);
  return [
    `I mined ${full}`,
    '',
    'My wallet has a Culture Name — human identity in the Human Economy.',
    '',
    SLOGANS.cultureNameShare,
    '',
    `Mine yours:`,
    `${BRAND.url.replace(/\/?$/, '/')}?room=culture-name`,
    '',
    link,
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    '#CultureName #HumanEconomy',
  ].join('\n');
}

/** Local cache of *this* wallet’s claim (server is source of truth). */
export function readLocalCultureName(walletAddress: string): CultureNameRecord | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CULTURE_NAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CultureNameRecord;
    if (
      parsed?.name &&
      parsed?.walletAddress &&
      parsed.walletAddress === walletAddress
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeLocalCultureName(record: CultureNameRecord): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CULTURE_NAME_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

/** Suggest labels from a display seed + wallet. */
export function suggestCultureLabels(seed: string, walletAddress: string): string[] {
  const base = normalizeCultureLabel(seed.replace(/^op_/i, '')) || 'builder';
  const short = walletAddress.slice(0, 4).toLowerCase();
  const tail = walletAddress.slice(-3).toLowerCase();
  const candidates = [
    base,
    `${base}${tail}`,
    `${base}-${short}`,
    `node-${base}`.slice(0, 16),
    `${base}0`,
  ];
  const out: string[] = [];
  for (const c of candidates) {
    const v = validateCultureLabel(c);
    if (v.ok && !out.includes(v.label)) out.push(v.label);
    if (out.length >= 4) break;
  }
  return out;
}
