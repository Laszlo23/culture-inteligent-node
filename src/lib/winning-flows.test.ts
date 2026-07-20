import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clearLoopWinningNext, winningDeepLinks } from './winning-flows.ts';

describe('clearLoopWinningNext', () => {
  it('keeps clear members in the prove-attention loop (Partner as rail)', () => {
    const next = clearLoopWinningNext({
      you: 'Ada',
      tollReady: true,
      hasPassport: true,
    });
    assert.equal(next.id, 'lab');
    assert.match(next.label, /Prove|attention/i);
    assert.ok(next.rails.some((r) => r.id === 'toll'));
    assert.ok(next.rails.some((r) => r.id === 'partner'));
  });

  it('sends passport-less users to claim passport first', () => {
    const next = clearLoopWinningNext({
      you: 'guest',
      tollReady: false,
      hasPassport: false,
    });
    assert.equal(next.id, 'passport');
  });
});

describe('winningDeepLinks', () => {
  it('includes partners and vault', () => {
    const links = winningDeepLinks('https://mining.buildingcultureid.space');
    assert.ok(links.some((l) => l.url.includes('partners')));
    assert.ok(links.some((l) => l.url.includes('treasury')));
  });
});
