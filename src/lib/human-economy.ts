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

export type HumanScoreKey = 'knowledge' | 'builder' | 'contribution';

export type HumanScores = {
  knowledge: number;
  builder: number;
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

export const JOURNEY_STEPS = [
  { id: 'discover', title: 'Discover', line: 'Why does my attention have value?' },
  { id: 'prove', title: 'Prove', line: 'Complete a Proof of Attention challenge.' },
  { id: 'passport', title: 'Passport', line: 'Own your Human Passport identity.' },
  { id: 'grow', title: 'Grow', line: 'Learn, build, contribute every day.' },
  { id: 'reputation', title: 'Reputation', line: 'Status, access, opportunities.' },
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

/** Derive Human Passport scores from existing local activity. */
export function computeHumanScores(opts: {
  academyCompletedCount: number;
  coreSessionTotal: number;
  missionsCompleted: number;
  missionsTotal: number;
  snapshot?: AttentionSnapshot;
}): HumanScores {
  const snap = opts.snapshot ?? buildAttentionSnapshot(30);
  const sessionRatio =
    opts.coreSessionTotal > 0
      ? opts.academyCompletedCount / opts.coreSessionTotal
      : 0;

  const knowledge = clampScore(
    sessionRatio * 55 +
      snap.firstSparkCompletes * 12 +
      snap.sessionCompletes * 6 +
      snap.neuralSnapPasses * 3 +
      snap.hookMirrors * 8
  );

  const builder = clampScore(
    (opts.missionsCompleted / Math.max(1, opts.missionsTotal)) * 40 +
      snap.zenMachine * 8 +
      snap.focusMinutesApprox * 1.2 +
      snap.fieldCardClaims * 5 +
      (opts.academyCompletedCount >= 2 ? 15 : 0)
  );

  const contribution = clampScore(
    snap.spreads * 14 +
      snap.broadcastShares * 10 +
      snap.hookLoopShares * 8 +
      snap.zenMind * 6 +
      snap.uniqueDaysActive * 4
  );

  const humanValue = clampScore(
    knowledge * 0.4 + builder * 0.3 + contribution * 0.3
  );

  return { knowledge, builder, contribution, humanValue };
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
  if (scores.knowledge >= 20) chips.push('Learning');
  if (scores.knowledge >= 50) chips.push('Focus');
  if (scores.builder >= 20) chips.push('Building');
  if (scores.builder >= 50) chips.push('Problem solving');
  if (scores.contribution >= 20) chips.push('Sharing');
  if (scores.contribution >= 50) chips.push('Community');
  if (scores.humanValue >= 60) chips.push('Rising contributor');
  if (chips.length === 0) chips.push('Getting started');
  return chips.slice(0, 6);
}

export function landingMetaDescription(): string {
  return `${SLOGANS.hero} ${BRAND.parent} — ${BRAND.product}. Build your ${BRAND.passport}.`;
}
