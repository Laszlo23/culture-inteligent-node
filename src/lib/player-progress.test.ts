import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  xpToAdvance,
  levelFromXp,
  snapshotFromXp,
  grantXp,
  xpForLevel,
} from './player-progress.ts';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
});

describe('player-progress', () => {
  it('starts at level 1 with 0 xp', () => {
    assert.equal(levelFromXp(0), 1);
    assert.equal(xpForLevel(1), 0);
  });

  it('levels fast early then climbs', () => {
    assert.ok(xpToAdvance(1) < xpToAdvance(15));
    const mid = snapshotFromXp(200);
    assert.ok(mid.level > 1);
    assert.ok(mid.pct >= 0 && mid.pct <= 100);
  });

  it('grants xp and levels up', () => {
    const first = grantXp(25);
    assert.equal(first.granted, 25);
    assert.equal(first.isFirstXp, true);
    assert.equal(first.totalXp, 25);
    const again = grantXp(500);
    assert.equal(again.leveledUp, true);
    assert.ok(again.level > first.level);
  });
});
