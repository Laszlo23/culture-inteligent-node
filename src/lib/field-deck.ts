/**
 * Field Deck — physical card claims (hunt → story → trade).
 * Prototype: localStorage bound to operator/wallet. Print QR: ?card=HOOK-BAIT
 */

import { BRAND } from './brand-slogans';

export const FIELD_DECK_STORAGE_KEY = 'culture_field_deck_claims_v1';

export type FieldCardId = 'HOOK-BAIT' | 'HOOK-NOTICE' | 'HOOK-WHY';

export type FieldCard = {
  id: FieldCardId;
  setId: 'hook_cycle';
  order: number;
  title: string;
  chapter: string;
  hook: string;
  story: string;
  nextAsk: string;
  artHint: 'amber' | 'cyan' | 'rose';
};

export const HOOK_CYCLE: FieldCard[] = [
  {
    id: 'HOOK-BAIT',
    setId: 'hook_cycle',
    order: 1,
    title: 'Bait',
    chapter: '01',
    hook: 'What pulled you in?',
    story:
      'Every scroll starts with a flash of bait — a face, a fight, a promise. Naming it is the first act of Attention Intelligence. You found this card in the wild. That already counts.',
    nextAsk: 'When you open your phone next, pause one beat and name the bait out loud.',
    artHint: 'amber',
  },
  {
    id: 'HOOK-NOTICE',
    setId: 'hook_cycle',
    order: 2,
    title: 'Notice',
    chapter: '02',
    hook: 'What do you notice when you scroll again?',
    story:
      'The second pull is quieter. Same feed, new bait, old habit. Notice is the mirror — not guilt, telemetry. Culture Club collects notice, not empty flex.',
    nextAsk: 'Write one sentence: what changed in your body when you scrolled again?',
    artHint: 'cyan',
  },
  {
    id: 'HOOK-WHY',
    setId: 'hook_cycle',
    order: 3,
    title: 'Why you stay',
    chapter: '03',
    hook: 'Why do you keep going?',
    story:
      'Staying is the real hook. Boredom, loneliness, hope, spite — all valid data. Proof of Hook Awareness starts when you can say why without lying to yourself.',
    nextAsk: 'Bring this line into Hook Mirror in the Academy — then decide Mind or Machine.',
    artHint: 'rose',
  },
];

export type FieldClaim = {
  cardId: FieldCardId;
  claimedAt: string;
  by: string;
  channel: 'qr' | 'manual' | 'trade';
};

type Store = {
  claims: FieldClaim[];
};

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readStore(): Store {
  try {
    const raw = storage()?.getItem(FIELD_DECK_STORAGE_KEY);
    if (!raw) return { claims: [] };
    const parsed = JSON.parse(raw) as Partial<Store>;
    return { claims: Array.isArray(parsed.claims) ? (parsed.claims as FieldClaim[]) : [] };
  } catch {
    return { claims: [] };
  }
}

function writeStore(store: Store): void {
  try {
    storage()?.setItem(FIELD_DECK_STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function normalizeCardCode(raw: string | null | undefined): FieldCardId | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase().replace(/\s+/g, '-');
  const hit = HOOK_CYCLE.find((c) => c.id === code);
  return hit ? hit.id : null;
}

export function getFieldCard(id: FieldCardId): FieldCard | undefined {
  return HOOK_CYCLE.find((c) => c.id === id);
}

export function cardClaimUrl(id: FieldCardId): string {
  const base = BRAND.url.replace(/\/?$/, '/');
  return `${base}?card=${id}`;
}

export function listClaims(): FieldClaim[] {
  return readStore().claims.slice();
}

export function hasClaimed(cardId: FieldCardId): boolean {
  return readStore().claims.some((c) => c.cardId === cardId);
}

export function claimedHookCycleIds(): FieldCardId[] {
  const set = new Set(readStore().claims.map((c) => c.cardId));
  return HOOK_CYCLE.map((c) => c.id).filter((id) => set.has(id));
}

export function hookCycleProgress(): { have: number; total: number; complete: boolean } {
  const have = claimedHookCycleIds().length;
  const total = HOOK_CYCLE.length;
  return { have, total, complete: have >= total };
}

export function missingHookCycle(): FieldCard[] {
  const have = new Set(claimedHookCycleIds());
  return HOOK_CYCLE.filter((c) => !have.has(c.id));
}

export type ClaimResult =
  | { ok: true; card: FieldCard; firstTime: boolean; setComplete: boolean }
  | { ok: false; reason: 'unknown' | 'already' };

export function claimFieldCard(
  code: string,
  by: string,
  channel: FieldClaim['channel'] = 'qr'
): ClaimResult {
  const id = normalizeCardCode(code);
  if (!id) return { ok: false, reason: 'unknown' };
  const card = getFieldCard(id);
  if (!card) return { ok: false, reason: 'unknown' };

  const store = readStore();
  if (store.claims.some((c) => c.cardId === id)) {
    return { ok: false, reason: 'already' };
  }

  store.claims.push({
    cardId: id,
    claimedAt: new Date().toISOString(),
    by: by || 'operator',
    channel,
  });
  writeStore(store);

  const setComplete = hookCycleProgress().complete;
  return { ok: true, card, firstTime: true, setComplete };
}

/** Phase 2 stub — records a local “trade intent” so UI can teach the loop. */
export function recordTradeIntent(cardId: FieldCardId, partnerHint: string): void {
  try {
    const key = 'culture_field_deck_trades_v1';
    const raw = storage()?.getItem(key);
    const list: Array<{ cardId: string; partner: string; at: string }> = raw
      ? JSON.parse(raw)
      : [];
    list.push({
      cardId,
      partner: partnerHint.slice(0, 48) || 'trader',
      at: new Date().toISOString(),
    });
    storage()?.setItem(key, JSON.stringify(list.slice(-40)));
  } catch {
    /* ignore */
  }
}
