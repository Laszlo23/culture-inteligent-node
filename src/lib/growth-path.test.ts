import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orderCoreSessions, type SessionLane } from './growth-path.ts';

type S = { id: string; seriesOrder: number; lane?: SessionLane };

const sample: S[] = [
  { id: 'ai_first_spark', seriesOrder: 0, lane: 'both' },
  { id: 'ai_hook_mirror', seriesOrder: 0.5, lane: 'reflection' },
  { id: 'ai_s01', seriesOrder: 1, lane: 'science' },
  { id: 'ai_s03', seriesOrder: 3, lane: 'reflection' },
  { id: 'ai_s02', seriesOrder: 2, lane: 'science' },
];

test('curious path puts science before Hook Mirror', () => {
  const ordered = orderCoreSessions(sample, 'curious').map((s) => s.id);
  assert.equal(ordered[0], 'ai_first_spark');
  const hookIdx = ordered.indexOf('ai_hook_mirror');
  const s01 = ordered.indexOf('ai_s01');
  assert.ok(s01 < hookIdx);
});

test('reflective path puts Hook Mirror before science cores', () => {
  const ordered = orderCoreSessions(sample, 'reflective').map((s) => s.id);
  assert.equal(ordered[0], 'ai_first_spark');
  const hookIdx = ordered.indexOf('ai_hook_mirror');
  const s01 = ordered.indexOf('ai_s01');
  assert.ok(hookIdx < s01);
});

test('balanced keeps seriesOrder among non-spark', () => {
  const ordered = orderCoreSessions(sample, 'balanced').map((s) => s.id);
  assert.deepEqual(ordered, [
    'ai_first_spark',
    'ai_hook_mirror',
    'ai_s01',
    'ai_s02',
    'ai_s03',
  ]);
});
