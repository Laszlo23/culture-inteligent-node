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
