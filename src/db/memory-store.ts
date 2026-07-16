/** In-memory fallback when Postgres is unavailable — demo / jury safe */

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

export function listAttentionForUid(uid: string) {
  return attentionStore.filter((r) => r.uid === uid);
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
