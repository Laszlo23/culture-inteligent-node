/**
 * First Contribution — magical first 5 minutes for Human Passport.
 * Personal hook → welcome → reflection → seeded scores → share.
 */

import type { HumanScores } from './human-economy';
import { readGrowthPath, type GrowthPathId } from './growth-path';

export const FIRST_CONTRIBUTION_KEY = 'culture_first_contribution_v1';
export const FIRST_CONTRIBUTION_SHARED_KEY = 'culture_first_contribution_shared_v1';

/** Default / balanced mix */
export const FIRST_CONTRIBUTION_PROMPTS = [
  'What is something you learned recently that changed your perspective?',
  'What problem have you been curious about that most people ignore?',
  'Describe something you made or helped with that felt like a real contribution.',
] as const;

const CURIOUS_PROMPTS = [
  'What is something you learned recently that changed how you see a problem?',
  'What unanswered question keeps pulling at your curiosity?',
  'What do you most want to understand about how your mind works?',
] as const;

const REFLECTIVE_PROMPTS = [
  'What did you notice about yourself the last time you got pulled into a habit?',
  'Why do you think you return to something even when you know better?',
  'Describe something you made or helped with that felt like a real contribution.',
] as const;

const PROMPTS_BY_PATH: Record<GrowthPathId, readonly string[]> = {
  curious: CURIOUS_PROMPTS,
  reflective: REFLECTIVE_PROMPTS,
  balanced: FIRST_CONTRIBUTION_PROMPTS,
};

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
  /** Scoring model id (gemini-… or heuristic-…) */
  model?: string;
  /** True when Gemini scored via server */
  liveFeedback?: boolean;
};

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function pickFirstContributionPrompt(
  seed?: string,
  path?: GrowthPathId | null
): string {
  const bank = PROMPTS_BY_PATH[path ?? readGrowthPath() ?? 'balanced'];
  if (!seed) return bank[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return bank[h % bank.length];
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
