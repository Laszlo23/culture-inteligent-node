/**
 * Single place to resolve what humans see as “you” in the UI.
 * Culture Name (laszlo.culture) always wins the headline once mined.
 */

import {
  CULTURE_NAME_SUFFIX,
  formatCultureName,
  normalizeCultureLabel,
  readLocalCultureName,
} from './culture-names';

export type DisplayIdentity = {
  /** Headline — culture name preferred */
  primary: string;
  /** Clean handle without leading @ */
  handle: string;
  /** @handle */
  atHandle: string;
  /** True when primary is a .culture name */
  isCultureName: boolean;
  /** True when still on Op_ default */
  isOperatorDefault: boolean;
  /** Optional earned title (Quiet Spark…) — never overrides culture name */
  progressTitle: string | null;
};

export function isCultureNameString(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const s = raw.trim().toLowerCase();
  return s.endsWith(CULTURE_NAME_SUFFIX) && normalizeCultureLabel(s).length >= 3;
}

export function isOperatorDefault(raw: string | null | undefined): boolean {
  return Boolean(raw && /^op_/i.test(raw.trim()));
}

export function cleanHandle(raw: string | null | undefined): string {
  return (raw || '').replace(/^@+/, '').trim();
}

/**
 * Resolve display identity for chrome / heroes / passport.
 * Priority: culture name → session username if .culture → progress title → handle.
 */
export function resolveDisplayIdentity(opts: {
  username?: string | null;
  walletAddress?: string | null;
  cultureName?: string | null;
  progressTitle?: string | null;
}): DisplayIdentity {
  const local =
    opts.walletAddress && !opts.cultureName
      ? readLocalCultureName(opts.walletAddress)
      : null;
  const cultureRaw =
    opts.cultureName ||
    (local ? formatCultureName(local.name) : null) ||
    (isCultureNameString(opts.username) ? cleanHandle(opts.username) : null);

  const culture = cultureRaw
    ? formatCultureName(normalizeCultureLabel(cultureRaw))
    : null;

  const handle = culture || cleanHandle(opts.username) || 'builder';
  const progressTitle = opts.progressTitle?.trim() || null;
  const primary = culture || progressTitle || handle;

  return {
    primary,
    handle,
    atHandle: `@${handle}`,
    isCultureName: Boolean(culture),
    isOperatorDefault: !culture && isOperatorDefault(opts.username),
    progressTitle: culture ? progressTitle : progressTitle,
  };
}

/** Share / invite display — never lead with Op_ if culture name exists. */
export function shareDisplayName(opts: {
  username?: string | null;
  walletAddress?: string | null;
  cultureName?: string | null;
}): string {
  const id = resolveDisplayIdentity(opts);
  if (id.isCultureName) return id.handle;
  if (id.isOperatorDefault && opts.walletAddress) {
    return `Builder_${opts.walletAddress.slice(0, 4)}`;
  }
  return id.handle;
}
