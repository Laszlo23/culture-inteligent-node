/**
 * Culture Club oath — signed membership ritual.
 * Hook → sign → love spreading knowledge. Fight Club energy, Building Culture heart.
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

export const CLUB_OATH_VERSION = 'culture_club_oath_v2';
/** Prior versions still count as members (no forced re-sign). */
const ACCEPTED_OATH_VERSIONS = new Set(['culture_club_oath_v1', 'culture_club_oath_v2']);
export const CLUB_OATH_STORAGE_KEY = 'building_culture_club_oath_v1';
export const CLUB_SPREAD_KEY = 'building_culture_club_spread_v1';

/** Numbered rules — storytelling gate, not a legal contract. */
export const CLUB_RULES = [
  {
    n: 1,
    line: 'You do not sleepwalk through Culture Club.',
    sub: 'We are here for attention. Empty scrolling does not count — Proof of Attention is the cover charge.',
  },
  {
    n: 2,
    line: 'Humanity can ride the failure curve — you do not have to.',
    sub: 'Take what works. Retire what failed. No gold-digging for dead grades.',
  },
  {
    n: 3,
    line: 'When science drops, you learn it now.',
    sub: 'Knowledge does not wait for the next textbook edition.',
  },
  {
    n: 4,
    line: 'You make it fun enough to stick in the soul.',
    sub: 'If it does not help us grow, it does not belong here.',
  },
  {
    n: 5,
    line: 'You spread love and knowledge — that is how we win.',
    sub: 'Once you are hooked, you bring someone with you. Culture compounds.',
  },
  {
    n: 6,
    line: 'If this is your first night at Culture Club…',
    sub: 'You have to sign. Then you help the next soul in.',
  },
] as const;

export type ClubOathRecord = {
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

function allRecords(): Record<string, ClubOathRecord> {
  try {
    const raw = storage()?.getItem(CLUB_OATH_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getClubOath(walletAddress: string): ClubOathRecord | null {
  if (!walletAddress) return null;
  const rec = allRecords()[walletAddress];
  if (!rec || !ACCEPTED_OATH_VERSIONS.has(rec.version)) return null;
  return rec;
}

export function hasClubOath(walletAddress: string): boolean {
  return Boolean(getClubOath(walletAddress));
}

export function saveClubOath(record: ClubOathRecord): void {
  const map = allRecords();
  map[record.walletAddress] = record;
  storage()?.setItem(CLUB_OATH_STORAGE_KEY, JSON.stringify(map));
}

export function clearClubOath(walletAddress?: string): void {
  if (!walletAddress) {
    storage()?.removeItem(CLUB_OATH_STORAGE_KEY);
    return;
  }
  const map = allRecords();
  delete map[walletAddress];
  storage()?.setItem(CLUB_OATH_STORAGE_KEY, JSON.stringify(map));
}

/** Canonical message every member signs — must stay stable for a given version. */
export function buildClubOathMessage(walletAddress: string): string {
  const rules = CLUB_RULES.map((r) => `${r.n}. ${r.line}`).join('\n');
  return [
    'CULTURE CLUB — MEMBERSHIP OATH',
    'Building Culture LLC · Culture Node',
    '',
    rules,
    '',
    'I sign this with my wallet. I am in.',
    'I will spread love and knowledge.',
    'Their failure curve is optional.',
    `Wallet: ${walletAddress}`,
    `Version: ${CLUB_OATH_VERSION}`,
  ].join('\n');
}

const APP_URL = 'https://mining.buildingcultureid.space/';

/** Personal invite — the hook members love to pass on. */
export function buildMemberInvitePost(opts: {
  displayName?: string;
  walletAddress: string;
}): string {
  const who = opts.displayName?.trim() || `Op_${opts.walletAddress.slice(0, 4)}`;
  const code = opts.walletAddress.slice(0, 6);
  return [
    `${who} pulled me into Culture Club.`,
    '',
    'We\'re here for attention — Proof of Attention, not empty hashes.',
    'Just because humanity wants the same failure curve does not mean you have to.',
    '',
    'It\'s about time to mine some culture.',
    'First Spark → Hook Mirror → fuel. Love + knowledge that works now.',
    '',
    'Sign the oath. Prove attention. Bring the next soul with you.',
    '',
    `${APP_URL}?club=${code}`,
  ].join('\n');
}

export function hasSpreadLove(walletAddress: string): boolean {
  try {
    const raw = storage()?.getItem(CLUB_SPREAD_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(map[walletAddress]);
  } catch {
    return false;
  }
}

export function markSpreadLove(walletAddress: string): void {
  try {
    const raw = storage()?.getItem(CLUB_SPREAD_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[walletAddress] = true;
    storage()?.setItem(CLUB_SPREAD_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export async function signClubOath(opts: {
  walletAddress: string;
  walletType: 'extension' | 'local';
  localKeypair?: Keypair | null;
}): Promise<ClubOathRecord> {
  const message = buildClubOathMessage(opts.walletAddress);
  const messageBytes = new TextEncoder().encode(message);

  let signature: string;
  let demoUnsigned = false;

  if (opts.walletType === 'local' && opts.localKeypair) {
    const sig = nacl.sign.detached(messageBytes, opts.localKeypair.secretKey);
    signature = bs58.encode(sig);
  } else {
    const provider = (
      window as unknown as {
        solana?: {
          signMessage?: (
            m: Uint8Array,
            enc: string
          ) => Promise<{ signature: Uint8Array }>;
        };
      }
    ).solana;
    if (provider?.signMessage) {
      const signed = await provider.signMessage(messageBytes, 'utf8');
      const sigBytes =
        signed.signature instanceof Uint8Array
          ? signed.signature
          : new Uint8Array(signed.signature);
      signature = bs58.encode(sigBytes);
    } else if (opts.walletType === 'local') {
      throw new Error('Local key missing — reload and restore your Devnet wallet to sign.');
    } else {
      signature = `demo_oath_${opts.walletAddress.slice(0, 8)}`;
      demoUnsigned = true;
    }
  }

  const record: ClubOathRecord = {
    version: CLUB_OATH_VERSION,
    walletAddress: opts.walletAddress,
    message,
    signature,
    signedAt: new Date().toISOString(),
    ...(demoUnsigned ? { demoUnsigned: true } : {}),
  };
  saveClubOath(record);
  return record;
}
