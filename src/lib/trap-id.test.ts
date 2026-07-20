import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TRAP_QUESTIONS,
  buildTrapCast,
  buildTrapSharePost,
  getTrapById,
  scoreTrapId,
  trapIdDeepLink,
  type TrapArchetypeId,
} from './trap-id';

describe('trap-id', () => {
  it('has three questions with four options each', () => {
    assert.equal(TRAP_QUESTIONS.length, 3);
    for (const q of TRAP_QUESTIONS) {
      assert.equal(q.options.length, 4);
    }
  });

  it('scores majority; last answer breaks ties', () => {
    const majority: TrapArchetypeId[] = ['TID01', 'TID01', 'TID02'];
    assert.equal(scoreTrapId(majority).id, 'TID01');

    const tie: TrapArchetypeId[] = ['TID05', 'TID03', 'TID03'];
    // TID03 appears twice → majority
    assert.equal(scoreTrapId(tie).id, 'TID03');

    const threeWay: TrapArchetypeId[] = ['TID02', 'TID04', 'TID06'];
    // all unique → last answer wins
    assert.equal(scoreTrapId(threeWay).id, 'TID06');
  });

  it('resolves deep-link trap ids', () => {
    assert.equal(getTrapById('tid01')?.handle, 'SLOT THUMB');
    assert.equal(getTrapById('nope'), null);
  });

  it('builds shareable challenge posts', () => {
    const trap = getTrapById('TID01')!;
    const post = buildTrapSharePost(trap);
    assert.match(post, /SLOT THUMB/);
    assert.match(post, /Find your Scroll Trap ID/);
    assert.match(post, /room=trap-id&trap=TID01/);
    assert.equal(trapIdDeepLink('TID01').includes('trap=TID01'), true);

    const cast = buildTrapCast(trap);
    assert.match(cast.text, /I'm a SLOT THUMB/);
    assert.match(cast.embedUrl, /fc=1/);
  });
});
