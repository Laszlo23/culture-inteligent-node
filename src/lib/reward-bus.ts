/**
 * Global Reward Bus — every meaningful action celebrates.
 * XP + achievements + UI toasts + first moments.
 */

import {
  unlockAchievement,
  getAchievement,
  type AchievementId,
  type AchievementRarity,
} from './achievements';
import {
  grantXpAndNotify,
  markMoment,
  hasMoment,
  readLevelSnapshot,
  type LevelSnapshot,
  type PlayerMoments,
  notifyPlayerProgress,
} from './player-progress';

export type RewardKind = 'xp' | 'score' | 'badge' | 'level' | 'streak' | 'discovery' | 'moment';

export type RewardSound = 'xpTick' | 'levelUp' | 'rareDrop' | 'success' | 'soft';

export type RewardEvent = {
  id: string;
  kind: RewardKind;
  label: string;
  amount?: number;
  sound?: RewardSound;
  rarity?: AchievementRarity;
  /** Achievement id if badge */
  achievementId?: AchievementId;
  level?: number;
  moment?: keyof PlayerMoments;
  shareHint?: string;
};

export type RewardActionId =
  | 'spark'
  | 'neural_snap'
  | 'daily_claim'
  | 'streak_tick'
  | 'trap_id'
  | 'culture_name'
  | 'invite'
  | 'hook_mirror'
  | 'zen_mind'
  | 'zen_machine'
  | 'miner_pulse'
  | 'first_nft'
  | 'outer_circuit'
  | 'fuel_win'
  | 'generic';

type ActionSpec = {
  xp: number;
  label: string;
  achievements?: AchievementId[];
  kind?: RewardKind;
  sound?: RewardSound;
  moment?: keyof PlayerMoments;
};

const ACTIONS: Record<RewardActionId, ActionSpec> = {
  spark: {
    xp: 40,
    label: 'Proof of Attention',
    achievements: ['first_spark'],
    sound: 'success',
    moment: 'firstSpark',
  },
  neural_snap: {
    xp: 25,
    label: 'Neural Snap',
    achievements: ['neural_snap'],
    sound: 'xpTick',
  },
  daily_claim: {
    xp: 15,
    label: 'Daily Impact',
    sound: 'success',
    moment: 'firstStreak',
  },
  streak_tick: {
    xp: 10,
    label: 'Streak held',
    kind: 'streak',
    sound: 'soft',
    moment: 'firstStreak',
  },
  trap_id: {
    xp: 20,
    label: 'Trap ID revealed',
    achievements: ['trap_id'],
    sound: 'rareDrop',
  },
  culture_name: {
    xp: 35,
    label: 'Culture Name mined',
    achievements: ['culture_name'],
    sound: 'rareDrop',
  },
  invite: {
    xp: 20,
    label: 'Invite sent',
    achievements: ['first_invite'],
    sound: 'success',
    moment: 'firstInvite',
  },
  hook_mirror: {
    xp: 30,
    label: 'Hook Mirror',
    achievements: ['hook_mirror'],
    sound: 'success',
  },
  zen_mind: {
    xp: 12,
    label: 'Zen · Mind',
    achievements: ['zen_mind'],
    sound: 'soft',
  },
  zen_machine: {
    xp: 12,
    label: 'Zen · Machine',
    achievements: ['zen_machine'],
    sound: 'soft',
  },
  miner_pulse: {
    xp: 8,
    label: 'Reactor pulse',
    achievements: ['miner_pulse'],
    sound: 'xpTick',
  },
  first_nft: {
    xp: 25,
    label: 'Collectible claimed',
    achievements: ['first_nft'],
    sound: 'rareDrop',
  },
  outer_circuit: {
    xp: 50,
    label: 'Outer Circuit',
    achievements: ['outer_circuit'],
    sound: 'rareDrop',
  },
  fuel_win: {
    xp: 18,
    label: 'Fuel routed',
    sound: 'success',
  },
  generic: {
    xp: 5,
    label: 'Progress',
    sound: 'xpTick',
  },
};

type Listener = (event: RewardEvent) => void;

const listeners = new Set<Listener>();
let seq = 0;

function nextId(): string {
  seq += 1;
  return `rw_${Date.now().toString(36)}_${seq}`;
}

export function subscribeRewards(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitReward(partial: Omit<RewardEvent, 'id'> & { id?: string }): RewardEvent {
  const event: RewardEvent = { id: partial.id || nextId(), ...partial };
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      /* ignore listener errors */
    }
  });
  return event;
}

export type RewardActionResult = {
  xpGranted: number;
  leveledUp: boolean;
  level: number;
  snapshot: LevelSnapshot;
  unlocked: AchievementId[];
  moments: (keyof PlayerMoments)[];
};

/**
 * Canonical path: grant XP, unlock achievements, emit celebrations.
 */
export function rewardAction(
  action: RewardActionId,
  opts?: { xpBonus?: number; label?: string; streakDays?: number }
): RewardActionResult {
  const spec = ACTIONS[action] || ACTIONS.generic;
  const xp = Math.max(0, spec.xp + (opts?.xpBonus || 0));
  const label = opts?.label || spec.label;
  const unlocked: AchievementId[] = [];
  const moments: (keyof PlayerMoments)[] = [];

  let xpGranted = 0;
  let leveledUp = false;
  let snapshot = readLevelSnapshot();
  let level = snapshot.level;

  if (xp > 0) {
    const grant = grantXpAndNotify(xp);
    xpGranted = grant.granted;
    leveledUp = grant.leveledUp;
    level = grant.level;
    snapshot = grant.snapshot;

    if (grant.isFirstXp) {
      const u = unlockAchievement('first_xp');
      if (u.newlyUnlocked) {
        unlocked.push('first_xp');
        emitReward({
          kind: 'badge',
          label: u.def.title,
          achievementId: 'first_xp',
          rarity: u.def.rarity,
          // Quiet — XP toast carries the beat; avoid stacking fanfares
          sound: undefined,
        });
      }
      if (markMoment('firstXp')) moments.push('firstXp');
    }

    emitReward({
      kind: 'xp',
      label,
      amount: xpGranted,
      sound: leveledUp ? undefined : spec.sound || 'xpTick',
    });

    if (leveledUp) {
      const u = unlockAchievement('first_level_up');
      if (u.newlyUnlocked) unlocked.push('first_level_up');
      if (markMoment('firstLevelUp')) moments.push('firstLevelUp');
      notifyPlayerProgress();
      emitReward({
        kind: 'level',
        label: `Level ${level}`,
        amount: level,
        level,
        sound: 'levelUp',
        rarity: 'rare',
      });
      // Badge unlock is implied by level fanfare — skip second sound/toast
    }
  }

  // Action moments (Spark / invite / streak) — skip if we already leveled (level owns the stage)
  if (spec.moment && !leveledUp && markMoment(spec.moment)) {
    moments.push(spec.moment);
    emitReward({
      kind: 'moment',
      label: momentLabel(spec.moment),
      moment: spec.moment,
      sound: 'success',
    });
  } else if (spec.moment && leveledUp && markMoment(spec.moment)) {
    moments.push(spec.moment);
  }

  for (const achId of spec.achievements || []) {
    const u = unlockAchievement(achId);
    if (u.newlyUnlocked) {
      unlocked.push(achId);
      emitReward({
        kind: 'badge',
        label: u.def.title,
        achievementId: achId,
        rarity: u.def.rarity,
        sound: u.def.rarity === 'common' ? 'success' : 'rareDrop',
        shareHint: u.def.blurb,
      });
    }
  }

  // Streak thresholds (daily_claim carries streakDays — do not also call streak_tick)
  if (action === 'streak_tick' || action === 'daily_claim') {
    const days = opts?.streakDays ?? 0;
    if (days >= 1) {
      const u = unlockAchievement('first_streak');
      if (u.newlyUnlocked) {
        unlocked.push('first_streak');
        emitReward({
          kind: 'badge',
          label: u.def.title,
          achievementId: 'first_streak',
          rarity: u.def.rarity,
          sound: undefined,
        });
      }
      if (!hasMoment('firstStreak') && markMoment('firstStreak')) {
        moments.push('firstStreak');
        if (!leveledUp && spec.moment !== 'firstStreak') {
          emitReward({
            kind: 'moment',
            label: momentLabel('firstStreak'),
            moment: 'firstStreak',
            sound: 'success',
          });
        }
      }
    }
    if (days >= 3) {
      const u = unlockAchievement('streak_3');
      if (u.newlyUnlocked) {
        unlocked.push('streak_3');
        emitReward({
          kind: 'badge',
          label: u.def.title,
          achievementId: 'streak_3',
          rarity: u.def.rarity,
          sound: 'rareDrop',
        });
      }
    }
    if (days >= 7) {
      const u = unlockAchievement('streak_7');
      if (u.newlyUnlocked) {
        unlocked.push('streak_7');
        emitReward({
          kind: 'badge',
          label: u.def.title,
          achievementId: 'streak_7',
          rarity: u.def.rarity,
          sound: 'rareDrop',
        });
      }
    }
  }

  if (
    (spec.kind === 'streak' || action === 'streak_tick' || action === 'daily_claim') &&
    (opts?.streakDays ?? 0) > 0
  ) {
    emitReward({
      kind: 'streak',
      label: opts?.label || `Day ${opts!.streakDays}`,
      amount: opts?.streakDays,
      sound: action === 'daily_claim' ? undefined : 'soft',
    });
  }

  return { xpGranted, leveledUp, level, snapshot, unlocked, moments };
}

function momentLabel(m: keyof PlayerMoments): string {
  switch (m) {
    case 'firstXp':
      return 'First XP';
    case 'firstSpark':
      return 'First Spark sealed';
    case 'firstLevelUp':
      return 'First level-up';
    case 'firstInvite':
      return 'First invite';
    case 'firstStreak':
      return 'First streak day';
    default:
      return 'Moment';
  }
}

export function rarityGlow(rarity?: AchievementRarity): string {
  if (rarity === 'legendary') return 'border-amber-300/70 shadow-[0_0_40px_rgba(251,191,36,0.45)]';
  if (rarity === 'rare') return 'border-cyan-400/55 shadow-[0_0_32px_rgba(34,211,238,0.35)]';
  return 'border-emerald-400/40 shadow-[0_0_24px_rgba(52,211,153,0.25)]';
}

export { getAchievement };
