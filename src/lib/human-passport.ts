/**
 * Human Passport — claim & ownership record.
 * Migrates prior Culture Club oath records so returning users stay unlocked.
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { BRAND, SLOGANS } from './brand-slogans';
import { PASSPORT_PRINCIPLES } from './human-economy';
import type { SessionWalletType } from './wallet/types';

export const HUMAN_PASSPORT_VERSION = 'human_passport_v1';
export const HUMAN_PASSPORT_STORAGE_KEY = 'building_culture_human_passport_v1';
/** Legacy oath storage — still accepted as passport claimed */
export const LEGACY_CLUB_OATH_STORAGE_KEY = 'building_culture_club_oath_v1';
export const PASSPORT_INVITE_KEY = 'building_culture_club_spread_v1';

const LEGACY_OATH_VERSIONS = new Set(['culture_club_oath_v1', 'culture_club_oath_v2']);

export type HumanPassportRecord = {
  version: string;
  walletAddress: string;
  message: string;
  signature: string;
  signedAt: string;
  demoUnsigned?: boolean;
};

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readMap(key: string): Record<string, HumanPassportRecord> {
  try {
    const raw = storage()?.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePassportMap(map: Record<string, HumanPassportRecord>): void {
  storage()?.setItem(HUMAN_PASSPORT_STORAGE_KEY, JSON.stringify(map));
}

export function getHumanPassport(walletAddress: string): HumanPassportRecord | null {
  if (!walletAddress) return null;
  const modern = readMap(HUMAN_PASSPORT_STORAGE_KEY)[walletAddress];
  if (modern && modern.version === HUMAN_PASSPORT_VERSION) return modern;

  const legacy = readMap(LEGACY_CLUB_OATH_STORAGE_KEY)[walletAddress];
  if (legacy && LEGACY_OATH_VERSIONS.has(legacy.version)) {
    return {
      ...legacy,
      version: HUMAN_PASSPORT_VERSION,
    };
  }
  return null;
}

export function hasHumanPassport(walletAddress: string): boolean {
  return Boolean(getHumanPassport(walletAddress));
}

/** @deprecated use hasHumanPassport */
export function hasClubOath(walletAddress: string): boolean {
  return hasHumanPassport(walletAddress);
}

export function saveHumanPassport(record: HumanPassportRecord): void {
  const map = readMap(HUMAN_PASSPORT_STORAGE_KEY);
  map[record.walletAddress] = record;
  writePassportMap(map);
}

export function buildPassportMessage(walletAddress: string): string {
  const principles = PASSPORT_PRINCIPLES.map(
    (p, i) => `${i + 1}. ${p.title} — ${p.line}`
  ).join('\n');
  return [
    'HUMAN PASSPORT — BUILDING CULTURE',
    `${BRAND.parent} · ${BRAND.product}`,
    '',
    SLOGANS.equation,
    '',
    principles,
    '',
    'I claim this passport. I own my digital reputation.',
    'I will learn, create, and contribute.',
    `Identity: ${walletAddress}`,
    `Version: ${HUMAN_PASSPORT_VERSION}`,
  ].join('\n');
}

export function buildMemberInvitePost(opts: {
  displayName?: string;
  walletAddress: string;
}): string {
  const raw = opts.displayName?.trim();
  const who =
    raw && !/^op_/i.test(raw)
      ? raw.replace(/^@/, '')
      : `Builder_${opts.walletAddress.slice(0, 4)}`;
  const code = opts.walletAddress.slice(0, 6);
  return [
    `${who} invited you to the Human Economy.`,
    '',
    SLOGANS.hero,
    SLOGANS.equation,
    '',
    'Build a Human Passport — reputation from learning, creating, contributing.',
    '',
    `${BRAND.url}?invite=${code}&fc=1`,
    '',
    'Telegram · https://t.me/+4zFH7-2tyW0yOTBk',
    'Discord · https://discord.gg/geUpHt3eSb',
  ].join('\n');
}

export function hasSpreadLove(walletAddress: string): boolean {
  try {
    const raw = storage()?.getItem(PASSPORT_INVITE_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(map[walletAddress]);
  } catch {
    return false;
  }
}

export function markSpreadLove(walletAddress: string): boolean {
  try {
    const raw = storage()?.getItem(PASSPORT_INVITE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    const first = !map[walletAddress];
    map[walletAddress] = true;
    storage()?.setItem(PASSPORT_INVITE_KEY, JSON.stringify(map));
    return first;
  } catch {
    return false;
  }
}

export async function claimHumanPassport(opts: {
  walletAddress: string;
  walletType: SessionWalletType;
  localKeypair?: Keypair | null;
}): Promise<HumanPassportRecord> {
  const message = buildPassportMessage(opts.walletAddress);
  const messageBytes = new TextEncoder().encode(message);

  const { signMessageForSession } = await import('./wallet/adapter');
  const signed = await signMessageForSession({
    walletType: opts.walletType,
    walletAddress: opts.walletAddress,
    localKeypair: opts.localKeypair,
    messageBytes,
  });
  const signature = signed.demoUnsigned
    ? `demo_passport_${opts.walletAddress.slice(0, 8)}`
    : bs58.encode(signed.signatureBytes);
  const demoUnsigned = signed.demoUnsigned;

  const record: HumanPassportRecord = {
    version: HUMAN_PASSPORT_VERSION,
    walletAddress: opts.walletAddress,
    message,
    signature,
    signedAt: new Date().toISOString(),
    ...(demoUnsigned ? { demoUnsigned: true } : {}),
  };
  saveHumanPassport(record);
  return record;
}
