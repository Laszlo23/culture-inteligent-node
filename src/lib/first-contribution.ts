/**
 * First Contribution — magical first 5 minutes for Human Passport.
 * Welcome → reflection → seeded scores → share.
 */

import type { HumanScores } from './human-economy';

export const FIRST_CONTRIBUTION_KEY = 'culture_first_contribution_v1';
export const FIRST_CONTRIBUTION_SHARED_KEY = 'culture_first_contribution_shared_v1';

export const FIRST_CONTRIBUTION_PROMPTS = [
  'What is something you learned recently that changed your perspective?',
  'What problem have you been curious about that most people ignore?',
  'Describe something you made or helped with that felt like a real contribution.',
] as const;

export type ContributionDims = {
  curiosity: number;
  creativity: number;
  reflection: number;
};

export type FirstContributionRecord = {
  prompt: string;
  answer: string;
  dims: ContributionDims;
  coachLine: string;
  scores: HumanScores;
  /** Alias: creativity mirrors builder for share/UI */
  at: string;
  guestId?: string;
  walletAddress?: string;
};

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function pickFirstContributionPrompt(seed?: string): string {
  if (!seed) return FIRST_CONTRIBUTION_PROMPTS[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FIRST_CONTRIBUTION_PROMPTS[h % FIRST_CONTRIBUTION_PROMPTS.length];
}

/**
 * Map AI dims into first-reveal band (~12 / 8 / 5 style), then Human Value.
 * Keeps first reveal meaningful without looking maxed.
 */
export function seedFromFirstContribution(dims: ContributionDims): HumanScores {
  const scale = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, Math.round(lo + (n / 100) * (hi - lo))));

  const knowledge = scale(dims.curiosity, 8, 28);
  const creativity = scale(dims.creativity, 5, 22);
  const contribution = scale(dims.reflection, 3, 18);
  const humanValue = Math.max(
    1,
    Math.min(100, Math.round(knowledge * 0.4 + creativity * 0.3 + contribution * 0.3))
  );

  return {
    knowledge,
    builder: creativity,
    creativity,
    contribution,
    humanValue,
  };
}

export function readFirstContribution(): FirstContributionRecord | null {
  try {
    const raw = storage()?.getItem(FIRST_CONTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FirstContributionRecord;
    if (!parsed?.scores || !parsed?.dims) return null;
    // Normalize creativity alias
    const creativity = parsed.scores.creativity ?? parsed.scores.builder ?? 0;
    parsed.scores = {
      ...parsed.scores,
      builder: creativity,
      creativity,
    };
    return parsed;
  } catch {
    return null;
  }
}

export function hasCompletedFirstContribution(): boolean {
  return readFirstContribution() != null;
}

export function saveFirstContribution(record: FirstContributionRecord): void {
  try {
    storage()?.setItem(FIRST_CONTRIBUTION_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

export function hasSharedPassport(): boolean {
  return storage()?.getItem(FIRST_CONTRIBUTION_SHARED_KEY) === '1';
}

export function markPassportShared(): void {
  storage()?.setItem(FIRST_CONTRIBUTION_SHARED_KEY, '1');
}

export function ensureGuestId(): string {
  const key = 'culture_guest_id_v1';
  try {
    const existing = storage()?.getItem(key);
    if (existing) return existing;
    const id = `guest_${Math.random().toString(36).slice(2, 10)}`;
    storage()?.setItem(key, id);
    return id;
  } catch {
    return `guest_${Date.now().toString(36)}`;
  }
}
