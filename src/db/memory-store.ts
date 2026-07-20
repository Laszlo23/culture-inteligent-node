/** In-memory fallback when Postgres is unavailable — demo / jury safe */

import type { AttentionSession } from '../content/attention-intelligence.ts';

export type StoredAttentionVerification = {
  id: string;
  uid: string;
  walletAddress?: string;
  sessionId: string;
  title: string;
  score: number;
  passed: boolean;
  verification: string;
  reason: string;
  model?: string;
  attestSignature?: string;
  /** Set when /api/economy/grant-energy issued a partial tx for this proof. */
  energyGranted?: boolean;
  /** ISO time of last grant-energy build (allows client retry within window). */
  energyGrantedAt?: string;
  createdAt: string;
};

export type StoredKpiProof = {
  id: string;
  uid: string;
  walletAddress: string;
  signature: string;
  verified: boolean;
  slot?: string;
  createdAt: string;
};

const attentionStore: StoredAttentionVerification[] = [];
const kpiStore: StoredKpiProof[] = [];

export function saveAttentionVerification(
  row: Omit<StoredAttentionVerification, 'createdAt'> & { createdAt?: string }
) {
  const full: StoredAttentionVerification = {
    ...row,
    createdAt: row.createdAt || new Date().toISOString(),
  };
  attentionStore.unshift(full);
  return full;
}

export function updateAttentionAttest(id: string, attestSignature: string) {
  const row = attentionStore.find((r) => r.id === id);
  if (row) row.attestSignature = attestSignature;
  return row || null;
}

/** Mark proof as used for grant-energy (client may retry within GRANT_RETRY_MS). */
export const GRANT_RETRY_MS = 15 * 60 * 1000;

export function markAttentionEnergyGranted(id: string) {
  const row = attentionStore.find((r) => r.id === id);
  if (!row) return null;
  row.energyGranted = true;
  row.energyGrantedAt = new Date().toISOString();
  return row;
}

export function canReuseAttentionGrant(row: StoredAttentionVerification): boolean {
  if (!row.passed) return false;
  // Proofs older than 24h cannot mint more fuel
  const created = Date.parse(row.createdAt);
  if (!Number.isNaN(created) && Date.now() - created > 24 * 60 * 60 * 1000) {
    return false;
  }
  if (!row.energyGranted) return true;
  if (!row.energyGrantedAt) return true; // allow client retry after hydrate without timestamp
  const ts = Date.parse(row.energyGrantedAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts < GRANT_RETRY_MS;
}

export function listAttentionForUid(uid: string) {
  return attentionStore.filter((r) => r.uid === uid);
}

export function getAttentionById(id: string) {
  return attentionStore.find((r) => r.id === id) || null;
}

export function saveKpiProof(row: Omit<StoredKpiProof, 'createdAt'> & { createdAt?: string }) {
  const existing = kpiStore.find((k) => k.signature === row.signature);
  if (existing) return existing;
  const full: StoredKpiProof = {
    ...row,
    createdAt: row.createdAt || new Date().toISOString(),
  };
  kpiStore.unshift(full);
  return full;
}

export function getKpiBySignature(signature: string) {
  return kpiStore.find((k) => k.signature === signature) || null;
}

export function getKpiByWallet(walletAddress: string) {
  return kpiStore.filter((k) => k.walletAddress === walletAddress && k.verified);
}

const curriculumDrafts: AttentionSession[] = [];
const curriculumPublished: AttentionSession[] = [];

export function saveCurriculumDraft(session: AttentionSession) {
  const row = { ...session, status: 'draft' as const };
  curriculumDrafts.unshift(row);
  return row;
}

export function listCurriculumDrafts() {
  return curriculumDrafts.filter((d) => d.status === 'draft');
}

export function getCurriculumDraft(id: string) {
  return curriculumDrafts.find((d) => d.id === id) || null;
}

export function publishCurriculumDraft(id: string, week: string) {
  const idx = curriculumDrafts.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const [draft] = curriculumDrafts.splice(idx, 1);
  const published: AttentionSession = {
    ...draft,
    status: 'published',
    week,
    seriesOrder: 200 + curriculumPublished.length,
  };
  // Only one published weekly drop at a time for “this week”
  curriculumPublished.length = 0;
  curriculumPublished.push(published);
  return published;
}

export function rejectCurriculumDraft(id: string) {
  const idx = curriculumDrafts.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  curriculumDrafts.splice(idx, 1);
  return true;
}

export function listPublishedCurriculum() {
  return [...curriculumPublished];
}

export type StoredTollPayment = {
  id: string;
  uid: string;
  walletAddress: string;
  signature: string;
  sku: string;
  quantity: number;
  amountMicro: number;
  priceCents: number;
  verified: boolean;
  slot?: string;
  createdAt: string;
};

const tollStore: StoredTollPayment[] = [];

export function saveTollPayment(
  row: Omit<StoredTollPayment, 'createdAt'> & { createdAt?: string }
) {
  const existing = tollStore.find((t) => t.signature === row.signature);
  if (existing) return existing;
  const full: StoredTollPayment = {
    ...row,
    createdAt: row.createdAt || new Date().toISOString(),
  };
  tollStore.unshift(full);
  return full;
}

export function getTollBySignature(signature: string) {
  return tollStore.find((t) => t.signature === signature) || null;
}

export function listTollPayments() {
  return [...tollStore];
}

export function getTollStats() {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  let allTimeCents = 0;
  let todayCents = 0;
  let todayCount = 0;
  const bySku: Record<string, { count: number; cents: number }> = {};

  for (const t of tollStore) {
    if (!t.verified) continue;
    const cents = t.priceCents * Math.max(1, t.quantity);
    allTimeCents += cents;
    const ts = Date.parse(t.createdAt);
    if (!Number.isNaN(ts) && ts >= dayAgo) {
      todayCents += cents;
      todayCount += 1;
    }
    const bucket = bySku[t.sku] || { count: 0, cents: 0 };
    bucket.count += 1;
    bucket.cents += cents;
    bySku[t.sku] = bucket;
  }

  const topSkus = Object.entries(bySku)
    .map(([sku, v]) => ({ sku, count: v.count, cents: v.cents }))
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 8);

  const dailyRate = todayCents;
  const extrapolatedAnnualCents = dailyRate * 365;

  return {
    allTimeCents,
    todayCents,
    todayCount,
    allTimeCount: tollStore.filter((t) => t.verified).length,
    topSkus,
    extrapolatedAnnualCents,
    note: 'Extrapolated annual is a model from the last 24h rate — not a guarantee.',
  };
}

/** ZKPassport nullifier ↔ wallet bindings for soulbound reputation. */
export type StoredZkBinding = {
  nullifierHash: string;
  walletAddress: string;
  zkProvider: 'zkpassport' | 'world_id';
  verifiedAt: string;
  boundAt: string;
  mintAddress?: string;
  mintSignature?: string;
  badgePda?: string;
  soulboundMinted: boolean;
};

const zkBindingStore: StoredZkBinding[] = [];

export function getZkBindingByNullifier(nullifierHash: string) {
  return zkBindingStore.find((b) => b.nullifierHash === nullifierHash) || null;
}

export function getZkBindingByWallet(walletAddress: string) {
  return (
    zkBindingStore.find(
      (b) => b.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    ) || null
  );
}

export function upsertZkBinding(row: StoredZkBinding) {
  const byN = zkBindingStore.findIndex((b) => b.nullifierHash === row.nullifierHash);
  if (byN >= 0) {
    zkBindingStore[byN] = { ...zkBindingStore[byN], ...row };
    return zkBindingStore[byN];
  }
  const byW = zkBindingStore.findIndex(
    (b) => b.walletAddress.toLowerCase() === row.walletAddress.toLowerCase()
  );
  if (byW >= 0) {
    zkBindingStore[byW] = { ...zkBindingStore[byW], ...row };
    return zkBindingStore[byW];
  }
  zkBindingStore.unshift(row);
  return row;
}

export function markZkMinted(
  nullifierHash: string,
  patch: {
    mintAddress: string;
    mintSignature?: string;
    badgePda?: string;
  }
) {
  const row = getZkBindingByNullifier(nullifierHash);
  if (!row) return null;
  row.mintAddress = patch.mintAddress;
  row.mintSignature = patch.mintSignature;
  row.badgePda = patch.badgePda;
  row.soulboundMinted = true;
  return row;
}

/** Culture Names — in-memory fallback */
export type StoredCultureName = {
  name: string;
  walletAddress: string;
  uid?: string;
  claimedAt: string;
};

const cultureNameStore: StoredCultureName[] = [];

export function getCultureNameByLabel(name: string): StoredCultureName | null {
  const key = name.trim().toLowerCase();
  return cultureNameStore.find((r) => r.name === key) || null;
}

export function getCultureNameByWallet(walletAddress: string): StoredCultureName | null {
  const w = walletAddress.trim();
  return (
    cultureNameStore.find((r) => r.walletAddress.toLowerCase() === w.toLowerCase()) || null
  );
}

export function claimCultureNameMem(row: StoredCultureName): StoredCultureName {
  const byName = cultureNameStore.findIndex((r) => r.name === row.name);
  if (byName >= 0) {
    throw new Error('NAME_TAKEN');
  }
  const byWallet = cultureNameStore.findIndex(
    (r) => r.walletAddress.toLowerCase() === row.walletAddress.toLowerCase()
  );
  if (byWallet >= 0) {
    throw new Error('WALLET_HAS_NAME');
  }
  cultureNameStore.unshift(row);
  return row;
}
