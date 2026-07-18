import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { buildLoopRail, resolveMainLoopFlags } from './main-loop.ts';

beforeEach(() => {
  try {
    localStorage.removeItem('culture_zen_decision_v1');
    localStorage.removeItem('culture_loop_hear_touched_v1');
  } catch {
    // node without localStorage polyfill — ok
  }
});

describe('resolveMainLoopFlags', () => {
  it('ritual before hear → current hear', () => {
    const f = resolveMainLoopFlags({
      hearTouched: false,
      firstRitualPending: true,
      firstSparkDone: false,
      zenDone: false,
      spreadDone: false,
      returnTouched: false,
      dailyClaimReady: false,
      fuelWin: false,
      hookMirrorPending: false,
      energyLow: false,
    });
    assert.equal(f.current, 'hear');
  });

  it('after spark without zen → zen', () => {
    const f = resolveMainLoopFlags({
      hearTouched: true,
      firstRitualPending: false,
      firstSparkDone: true,
      zenDone: false,
      spreadDone: false,
      returnTouched: false,
      dailyClaimReady: false,
      fuelWin: false,
      hookMirrorPending: false,
      energyLow: false,
    });
    assert.equal(f.current, 'zen');
    assert.equal(f.firstSparkDone, true);
  });

  it('claim ready after spark → return', () => {
    const f = resolveMainLoopFlags({
      hearTouched: true,
      firstRitualPending: false,
      firstSparkDone: true,
      zenDone: true,
      spreadDone: true,
      returnTouched: false,
      dailyClaimReady: true,
      fuelWin: false,
      hookMirrorPending: false,
      energyLow: false,
    });
    assert.equal(f.current, 'return');
  });
});

describe('buildLoopRail', () => {
  it('marks current and done states', () => {
    const rail = buildLoopRail({
      hearTouched: true,
      firstSparkDone: true,
      zenDone: true,
      spreadDone: false,
      returnDone: false,
      current: 'spread',
    });
    assert.equal(rail.length, 5);
    assert.equal(rail.find((s) => s.id === 'spark')?.state, 'done');
    assert.equal(rail.find((s) => s.id === 'spread')?.state, 'current');
    assert.equal(rail.find((s) => s.id === 'return')?.state, 'locked');
  });
});
