import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashNullifier,
  mockUniqueIdentifier,
  nullifierHashToBytes,
} from './nullifier.ts';

describe('zk nullifier', () => {
  it('hashes stably and yields 32-byte PDA seed', async () => {
    const a = await hashNullifier('mock:zkpassport:scope:walletA');
    const b = await hashNullifier('mock:zkpassport:scope:walletA');
    const c = await hashNullifier('mock:zkpassport:scope:walletB');
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.equal(a.length, 64);
    assert.equal(nullifierHashToBytes(a).length, 32);
  });

  it('mock unique identifiers differ by wallet', () => {
    const u1 = mockUniqueIdentifier('Wallet111', 'culture-node-soulbound-v1');
    const u2 = mockUniqueIdentifier('Wallet222', 'culture-node-soulbound-v1');
    assert.notEqual(u1, u2);
  });
});
