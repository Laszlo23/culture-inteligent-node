/**
 * Human Economy — scores, pricing, waitlist, reputation series.
 */

import {
  buildAttentionSnapshot,
  getAttentionEvents,
  type AttentionSnapshot,
} from './attention-metrics';
import { BRAND, SLOGANS } from './brand-slogans';

export const HUMAN_ECONOMY_WAITLIST_KEY = 'building_culture_he_waitlist_v1';

export type HumanScoreKey = 'knowledge' | 'builder' | 'creativity' | 'contribution';

export type HumanScores = {
  knowledge: number;
  /** @deprecated Prefer creativity — kept for persistence compat */
  builder: number;
  /** Public passport axis (alias of builder) */
  creativity: number;
  contribution: number;
  /** 0–100 composite */
  humanValue: number;
};

export type PricingTierId = 'pro' | 'company' | 'creator';

export type PricingTier = {
  id: PricingTierId;
  name: string;
  price: string;
  audience: string;
  includes: string[];
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'pro',
    name: 'Human Passport Pro',
    price: '$9.99/mo',
    audience: 'Individuals',
    includes: [
      'AI mentor',
      'Advanced quests',
      'Premium learning paths',
      'Reputation analytics',
    ],
  },
  {
    id: 'company',
    name: 'Human Intelligence Platform',
    price: '$999–$5,000/mo',
    audience: 'Companies',
    includes: [
      'Employee AI education',
      'Skill tracking',
      'Internal challenges',
      'Verified learning records',
    ],
  },
  {
    id: 'creator',
    name: 'Knowledge Marketplace',
    price: 'Platform fee',
    audience: 'Creators',
    includes: [
      'Publish courses & quests',
      'Build communities',
      'Creator rewards',
      'Building Culture takes a platform fee',
    ],
  },
];

export const PASSPORT_PRINCIPLES = [
  {
    id: 'learn',
    title: 'Learn',
    line: 'Curiosity is currency. Finish what you start.',
  },
  {
    id: 'create',
    title: 'Create',
    line: 'Build something others can use — even a small piece.',
  },
  {
    id: 'contribute',
    title: 'Contribute',
    line: 'Help someone else level up. Reputation is shared light.',
  },
] as const;

/** Passport score dimensions — discovery, not class-select. */
export const PASSPORT_DIMENSIONS = [
  { id: 'knowledge', title: 'Knowledge', line: 'What you learn and understand.' },
  { id: 'builder', title: 'Builder', line: 'What you create and ship.' },
  { id: 'contribution', title: 'Contribution', line: 'How you help others grow.' },
] as const;

/**
 * Cold-start cinematic chapters — civilization story before any dashboard chrome.
 * Keep in sync with HumanEconomyLanding story mode.
 */
export const STORY_CHAPTERS = [
  {
    id: 'opening',
    eyebrow: 'Opening',
    title: SLOGANS.hero,
    body: SLOGANS.openingLede,
    accent: SLOGANS.openingInvite,
  },
  {
    id: 'problem',
    eyebrow: 'Chapter 0 — The Problem',
    title: 'The old system measured the wrong thing.',
    body: 'The current economy says: your value = your time. Building Culture says: your value = your contribution.',
    accent: SLOGANS.equation,
  },
  {
    id: 'awakening',
    eyebrow: 'Chapter 1 — Awakening',
    title: 'Your Human Passport',
    body: 'This is character creation for a new economy — not warrior or mage. You discover Knowledge, Builder, and Contribution. Your first score starts at zero.',
    accent: SLOGANS.awakeningZero,
  },
  {
    id: 'spark',
    eyebrow: 'Chapter 2 — The First Spark',
    title: 'Potential becomes visible',
    body: SLOGANS.firstSpark,
    accent: SLOGANS.firstSparkSupport,
  },
  {
    id: 'evolution',
    eyebrow: 'Chapter 3 — Growth',
    title: 'How you evolve',
    body: 'Not a control panel — a journey of becoming.',
    accent: SLOGANS.potential,
  },
] as const;

export type StoryChapterId = (typeof STORY_CHAPTERS)[number]['id'];

/** Evolution framing for the Human Economy journey (member-facing). */
export const JOURNEY_STEPS = [
  { id: 'discover', title: 'Discover', line: 'I learn something new.' },
  { id: 'spark', title: 'Spark', line: 'I prove understanding.' },
  { id: 'build', title: 'Build', line: 'I create something.' },
  { id: 'share', title: 'Share', line: 'I help others grow.' },
  { id: 'reputation', title: 'Reputation', line: 'My contribution becomes visible.' },
] as const;

export const PROOF_TYPES = [
  { id: 'knowledge', label: 'Knowledge', hint: 'Short tests that stick' },
  { id: 'creativity', label: 'Creativity', hint: 'Make something real' },
  { id: 'problem', label: 'Problem solving', hint: 'Think under constraint' },
  { id: 'reflection', label: 'Reflection', hint: 'Name what you notice' },
] as const;

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Derive Human Passport scores from existing local activity (+ optional first-contribution seed). */
export function computeHumanScores(opts: {
  academyCompletedCount: number;
  coreSessionTotal: number;
  missionsCompleted: number;
  missionsTotal: number;
  snapshot?: AttentionSnapshot;
  /** Seed from First Contribution ritual — floors early scores */
  seed?: Partial<HumanScores> | null;
}): HumanScores {
  const snap = opts.snapshot ?? buildAttentionSnapshot(30);
  const sessionRatio =
    opts.coreSessionTotal > 0
      ? opts.academyCompletedCount / opts.coreSessionTotal
      : 0;

  let knowledge = clampScore(
    sessionRatio * 55 +
      snap.firstSparkCompletes * 12 +
      snap.sessionCompletes * 6 +
      snap.neuralSnapPasses * 3 +
      snap.hookMirrors * 8
  );

  let builder = clampScore(
    (opts.missionsCompleted / Math.max(1, opts.missionsTotal)) * 40 +
      snap.zenMachine * 8 +
      snap.focusMinutesApprox * 1.2 +
      snap.fieldCardClaims * 5 +
      (opts.academyCompletedCount >= 2 ? 15 : 0)
  );

  let contribution = clampScore(
    snap.spreads * 14 +
      snap.broadcastShares * 10 +
      snap.hookLoopShares * 8 +
      snap.zenMind * 6 +
      snap.uniqueDaysActive * 4
  );

  const seed = opts.seed;
  if (seed) {
    const seedCreativity = seed.creativity ?? seed.builder ?? 0;
    knowledge = clampScore(Math.max(knowledge, seed.knowledge ?? 0));
    builder = clampScore(Math.max(builder, seedCreativity));
    contribution = clampScore(Math.max(contribution, seed.contribution ?? 0));
  }

  const humanValue = clampScore(
    knowledge * 0.4 + builder * 0.3 + contribution * 0.3
  );

  return {
    knowledge,
    builder,
    creativity: builder,
    contribution,
    humanValue,
  };
}

export type ReputationDay = {
  day: string;
  /** Relative activity 0–100 */
  value: number;
};

/** Last N days of local event intensity for sparkline. */
export function buildReputationSeries(days = 14): ReputationDay[] {
  const since = Date.now() - days * 86_400_000;
  const events = getAttentionEvents(since);
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const e of events) {
    const key = new Date(e.at).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }
  const values = [...buckets.values()];
  const max = Math.max(1, ...values);
  return [...buckets.entries()].map(([day, count]) => ({
    day,
    value: Math.round((count / max) * 100),
  }));
}

export type WaitlistEntry = {
  tier: PricingTierId;
  email?: string;
  at: string;
};

export function readWaitlist(): WaitlistEntry[] {
  try {
    const raw = localStorage.getItem(HUMAN_ECONOMY_WAITLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function joinWaitlist(tier: PricingTierId, email?: string): WaitlistEntry {
  const entry: WaitlistEntry = {
    tier,
    email: email?.trim() || undefined,
    at: new Date().toISOString(),
  };
  const list = readWaitlist();
  list.push(entry);
  try {
    localStorage.setItem(HUMAN_ECONOMY_WAITLIST_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    // ignore
  }
  return entry;
}

export function skillChipsFromScores(scores: HumanScores): string[] {
  const chips: string[] = [];
  const creativity = scores.creativity ?? scores.builder;
  if (scores.knowledge >= 20) chips.push('Learning');
  if (scores.knowledge >= 50) chips.push('Focus');
  if (creativity >= 20) chips.push('Creativity');
  if (creativity >= 50) chips.push('Problem solving');
  if (scores.contribution >= 20) chips.push('Sharing');
  if (scores.contribution >= 50) chips.push('Community');
  if (scores.humanValue >= 60) chips.push('Rising contributor');
  if (chips.length === 0) chips.push('Getting started');
  return chips.slice(0, 6);
}

export function landingMetaDescription(): string {
  return `${SLOGANS.hero} ${BRAND.parent} — ${BRAND.product}. Build your ${BRAND.passport}.`;
}
