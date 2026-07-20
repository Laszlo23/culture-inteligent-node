/**
 * Real daily quests — verified against product state, not fake progress bars.
 */

import type { GameState, DailyMission } from '../types';
import {
  isHearTouched,
  hasAnyZenDecision,
  hasZenForFirstSpark,
} from './main-loop';
import { hasSpreadLove } from './human-passport';

export type QuestRoom =
  | 'lab'
  | 'map'
  | 'treasury'
  | 'profile'
  | 'passport'
  | 'missions';

export type RealQuestDef = {
  id: string;
  label: string;
  hint: string;
  category: DailyMission['category'];
  energyReward: number;
  powerReward: number;
  /** Where “Go” sends the member */
  room: QuestRoom;
  /** Optional hear deep-link after navigation */
  openHearing?: boolean;
  /** How to verify completion from live state */
  isDone: (state: GameState, wallet?: string | null) => boolean;
};

function claimedDailyToday(): boolean {
  try {
    const last = Number(localStorage.getItem('solana_daily_last_claim_v1') || '0');
    if (!last) return false;
    const d = new Date(last);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

function hasAcademyProof(state: GameState): boolean {
  return (state.proofOfAttentions || []).some(
    (p) =>
      (p.verification &&
        (p.verification.includes('Gemini') ||
          p.verification.includes('agent') ||
          p.verification.includes('verified'))) ||
      (p.score != null && p.score >= 60)
  );
}

/** Canonical daily set — order = member path */
export const REAL_DAILY_QUESTS: RealQuestDef[] = [
  {
    id: 'm_spark',
    label: 'Prove attention once',
    hint: 'Finish a short Academy challenge — grows Knowledge.',
    category: 'build',
    energyReward: 30,
    powerReward: 12,
    room: 'lab',
    isDone: (s) => hasAcademyProof(s),
  },
  {
    id: 'm_zen',
    label: 'Mind or Machine',
    hint: 'After a Spark — hold in Mind or convert on Machine.',
    category: 'quest',
    energyReward: 15,
    powerReward: 8,
    room: 'lab',
    isDone: () => hasZenForFirstSpark() || hasAnyZenDecision(),
  },
  {
    id: 'm_spread',
    label: 'Pass an invite',
    hint: 'Copy or cast your invite — help someone start.',
    category: 'community',
    energyReward: 20,
    powerReward: 10,
    room: 'map',
    isDone: (_s, wallet) => Boolean(wallet && hasSpreadLove(wallet)),
  },
  {
    id: 'm_claim',
    label: 'Claim today’s Impact',
    hint: 'Vault → free daily refill (+15 Impact · +50 BCC).',
    category: 'quest',
    energyReward: 15,
    powerReward: 8,
    room: 'treasury',
    isDone: () => claimedDailyToday(),
  },
  {
    id: 'm_card',
    label: 'Complete your member card',
    hint: 'You → Card · bio + one social · claim +200 BCC.',
    category: 'community',
    energyReward: 20,
    powerReward: 10,
    room: 'profile',
    isDone: (s) => Boolean(s.profile?.profileCompletedRewardClaimed),
  },
  {
    id: 'm_hear',
    label: 'Try Hearing Mode',
    hint: 'Ears-first path — toggle Hearing once.',
    category: 'video',
    energyReward: 15,
    powerReward: 6,
    room: 'map',
    openHearing: true,
    isDone: () => isHearTouched(),
  },
];

/** Quests required before the Daily Signal wheel unlocks */
export const WHEEL_UNLOCK_COMPLETED = 2;

export function questDefsToMissions(): DailyMission[] {
  return REAL_DAILY_QUESTS.map((q) => ({
    id: q.id,
    label: q.label,
    completed: false,
    energyReward: q.energyReward,
    powerReward: q.powerReward,
    category: q.category,
  }));
}

export function syncMissionCompletion(
  missions: DailyMission[],
  state: GameState,
  wallet?: string | null
): DailyMission[] {
  const byId = new Map(REAL_DAILY_QUESTS.map((q) => [q.id, q]));
  return missions.map((m) => {
    const def = byId.get(m.id);
    if (!def) return m;
    return { ...m, completed: def.isDone(state, wallet) };
  });
}

export function mergeRealMissions(existing: DailyMission[] | undefined): DailyMission[] {
  const prev = new Map((existing || []).map((m) => [m.id, m]));
  return REAL_DAILY_QUESTS.map((q) => {
    const old = prev.get(q.id);
    return {
      id: q.id,
      label: q.label,
      completed: old?.completed ?? false,
      energyReward: q.energyReward,
      powerReward: q.powerReward,
      category: q.category,
    };
  });
}

export function completedQuestCount(
  state: GameState,
  wallet?: string | null
): number {
  return REAL_DAILY_QUESTS.filter((q) => q.isDone(state, wallet)).length;
}

export function wheelUnlocked(state: GameState, wallet?: string | null): boolean {
  return completedQuestCount(state, wallet) >= WHEEL_UNLOCK_COMPLETED;
}

/** Real wheel prizes — settled via rewardOnChain when economy ready */
export type WheelPrizeDef = {
  label: string;
  bcc: number;
  energyPercent: number;
  powerBoost: number;
  logMessage: string;
};

export const REAL_WHEEL_PRIZES: WheelPrizeDef[] = [
  {
    label: '50 BCC',
    bcc: 50,
    energyPercent: 0,
    powerBoost: 0,
    logMessage: 'Daily Signal: +50 BCC',
  },
  {
    label: '+15% fuel',
    bcc: 0,
    energyPercent: 15,
    powerBoost: 0,
    logMessage: 'Daily Signal: +15% energy',
  },
  {
    label: '100 BCC',
    bcc: 100,
    energyPercent: 0,
    powerBoost: 0,
    logMessage: 'Daily Signal: +100 BCC',
  },
  {
    label: '+8 Builder',
    bcc: 25,
    energyPercent: 0,
    powerBoost: 8,
    logMessage: 'Daily Signal: Builder boost + BCC',
  },
  {
    label: '75 BCC',
    bcc: 75,
    energyPercent: 5,
    powerBoost: 0,
    logMessage: 'Daily Signal: +75 BCC · +5% fuel',
  },
  {
    label: '+25% fuel',
    bcc: 0,
    energyPercent: 25,
    powerBoost: 0,
    logMessage: 'Daily Signal: +25% energy',
  },
  {
    label: '150 BCC',
    bcc: 150,
    energyPercent: 0,
    powerBoost: 0,
    logMessage: 'Daily Signal: +150 BCC',
  },
  {
    label: 'JACKPOT',
    bcc: 200,
    energyPercent: 20,
    powerBoost: 5,
    logMessage: 'Daily Signal ★ JACKPOT ★ +200 BCC · +20% fuel',
  },
];

/** Free Impact claim cooldown (Vault). */
export const CLAIM_COOLDOWN_MS = 20 * 60 * 60 * 1000;

export type DailyClaimStatus = {
  ready: boolean;
  msUntilNext: number;
  streak: number;
  lastClaimAt: number;
};

export function getDailyClaimStatus(now = Date.now()): DailyClaimStatus {
  try {
    const lastClaimAt = Number(localStorage.getItem('solana_daily_last_claim_v1') || '0');
    const streak = Number(localStorage.getItem('solana_daily_streak_v1') || '0');
    if (!lastClaimAt) {
      return { ready: true, msUntilNext: 0, streak, lastClaimAt: 0 };
    }
    const elapsed = now - lastClaimAt;
    const ready = elapsed >= CLAIM_COOLDOWN_MS;
    return {
      ready,
      msUntilNext: ready ? 0 : Math.max(0, CLAIM_COOLDOWN_MS - elapsed),
      streak,
      lastClaimAt,
    };
  } catch {
    return { ready: true, msUntilNext: 0, streak: 0, lastClaimAt: 0 };
  }
}

export function formatClaimCountdown(ms: number): string {
  if (ms <= 0) return 'ready';
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function nextIncompleteQuest(
  state: GameState,
  wallet?: string | null
): RealQuestDef | null {
  return REAL_DAILY_QUESTS.find((q) => !q.isDone(state, wallet)) ?? null;
}
