import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  REAL_DAILY_QUESTS,
  mergeRealMissions,
  syncMissionCompletion,
  wheelUnlocked,
  WHEEL_UNLOCK_COMPLETED,
  getDailyClaimStatus,
  formatClaimCountdown,
  CLAIM_COOLDOWN_MS,
} from './daily-quests.ts';
import type { GameState } from '../types.ts';

const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, String(v));
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
};

function bareState(over: Partial<GameState> = {}): GameState {
  return {
    credits: 0,
    miningPower: 0,
    energy: 50,
    efficiency: 1,
    facilityLevel: 1,
    currentSeason: 't',
    hardware: [],
    workers: [],
    rooms: [],
    guilds: [],
    dailyMissions: mergeRealMissions([]),
    lastMaintenanceDate: '',
    ecosystemRewards: 0,
    accumulatedRewards: 0,
    ...over,
  } as GameState;
}

describe('daily-quests', () => {
  beforeEach(() => {
    mem.clear();
  });

  it('merges to the real quest set', () => {
    const m = mergeRealMissions([{ id: 'm1', label: 'old', completed: true, energyReward: 1, powerReward: 1, category: 'quest' }]);
    assert.equal(m.length, REAL_DAILY_QUESTS.length);
    assert.ok(m.every((x) => REAL_DAILY_QUESTS.some((q) => q.id === x.id)));
    assert.ok(!m.some((x) => x.id === 'm1'));
  });

  it('syncs spark from academy proofs', () => {
    const state = bareState({
      proofOfAttentions: [
        {
          id: 'p1',
          walletAddress: 'w',
          activity: 'spark',
          duration: 120,
          verification: 'Gemini agent verified',
          rewardEnergy: 10,
          rewardBcc: 0,
          timestamp: new Date().toISOString(),
          minted: false,
          score: 80,
        },
      ],
    });
    const synced = syncMissionCompletion(state.dailyMissions, state, 'Wallet111');
    assert.equal(synced.find((m) => m.id === 'm_spark')?.completed, true);
  });

  it('reports claim cooldown countdown', () => {
    mem.clear();
    assert.equal(getDailyClaimStatus(1_000).ready, true);
    mem.set('solana_daily_last_claim_v1', String(1_000));
    mem.set('solana_daily_streak_v1', '3');
    const mid = getDailyClaimStatus(1_000 + CLAIM_COOLDOWN_MS / 2);
    assert.equal(mid.ready, false);
    assert.equal(mid.streak, 3);
    assert.ok(mid.msUntilNext > 0);
    assert.match(formatClaimCountdown(mid.msUntilNext), /h|m/);
    const done = getDailyClaimStatus(1_000 + CLAIM_COOLDOWN_MS + 1);
    assert.equal(done.ready, true);
  });

  it('unlocks wheel after enough real quests', () => {
    assert.equal(WHEEL_UNLOCK_COMPLETED, 2);
    const state = bareState({
      profile: {
        avatarUrl: '',
        aboutMe: 'x',
        xUsername: 'a',
        telegramUsername: '',
        discordUsername: '',
        profileCompletedRewardClaimed: true,
        xFollowClaimed: false,
        telegramJoinClaimed: false,
        discordJoinClaimed: false,
        xPostInteractionClaimed: false,
      },
      proofOfAttentions: [
        {
          id: 'p1',
          walletAddress: 'w',
          activity: 'spark',
          duration: 1,
          verification: 'agent',
          rewardEnergy: 1,
          rewardBcc: 0,
          timestamp: new Date().toISOString(),
          minted: false,
          score: 70,
        },
      ],
    });
    assert.equal(wheelUnlocked(state, null), true);
  });
});
