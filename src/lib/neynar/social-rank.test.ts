import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  castUrl,
  engagementScore,
  pickMostEngaging,
  scorePercent,
  scoreTier,
} from './social-rank.ts';

describe('neynar social-rank', () => {
  it('scores engagement with recast weight', () => {
    assert.equal(engagementScore({ likes: 10, recasts: 5, replies: 2 }), 23);
  });

  it('picks hottest casts first', () => {
    const top = pickMostEngaging(
      [
        { hash: 'a', text: 'quiet', likes: 1, recasts: 0, replies: 0 },
        { hash: 'b', text: 'hot', likes: 4, recasts: 8, replies: 2 },
        { hash: 'c', text: 'mid', likes: 12, recasts: 1, replies: 1 },
      ],
      2
    );
    assert.deepEqual(
      top.map((c) => c.hash),
      ['b', 'c']
    );
    assert.ok(top[0]!.heat > top[1]!.heat);
  });

  it('maps score tiers and percent', () => {
    assert.equal(scoreTier(0.2).id, 'signal');
    assert.equal(scoreTier(0.55).id, 'voltage');
    assert.equal(scoreTier(0.91).id, 'legend');
    assert.equal(scorePercent(0.73), 73);
  });

  it('builds cast urls', () => {
    assert.match(castUrl('dwr', '0xabc'), /\/dwr\/0xabc/);
    assert.match(castUrl('@vitalik.eth', 'deadbeef'), /\/vitalik\.eth\/0xdeadbeef/);
  });
});
