import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PublicKey } from '@solana/web3.js';
import {
  ensureDiscriminators,
  decodePlayer,
  decodeConfig,
  playerPda,
  configPda,
  minerPda,
  getEconomyProgramId,
} from './solana-economy.ts';

test('ensureDiscriminators produces 8-byte non-zero discs', async () => {
  await ensureDiscriminators();
  // rebuild a grant_energy disc via side effect — init_player must work
  const { buildInitPlayerIx } = await import('./solana-economy.ts');
  const ix = await buildInitPlayerIx(PublicKey.unique());
  assert.equal(ix.data.length, 8);
  assert.ok(ix.data.some((b) => b !== 0));
});

test('PDA seeds are stable', () => {
  const program = getEconomyProgramId();
  assert.equal(program.toBase58(), 'AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ');
  const owner = new PublicKey('11111111111111111111111111111112');
  const a = playerPda(owner).toBase58();
  const b = playerPda(owner).toBase58();
  assert.equal(a, b);
  assert.ok(configPda().toBase58().length > 30);
  assert.ok(minerPda(0).toBase58() !== minerPda(1).toBase58());
});

test('decodePlayer / decodeConfig layout', () => {
  const buf = Buffer.alloc(8 + 32 + 2 + 8 + 4 + 8 + 1);
  // disc zeros
  const owner = PublicKey.unique();
  owner.toBuffer().copy(buf, 8);
  buf.writeUInt16LE(3800, 40);
  buf.writeBigUInt64LE(150n, 42);
  buf.writeUInt32LE(3, 50);
  buf.writeBigInt64LE(1_700_000_000n, 54);
  buf.writeUInt8(255, 62);

  const player = decodePlayer(buf);
  assert.equal(player.owner, owner.toBase58());
  assert.equal(player.energyBps, 3800);
  assert.equal(player.energyPercent, 38);
  assert.equal(player.miningPower, 150);
  assert.equal(player.streak, 3);

  const cfg = Buffer.alloc(8 + 32 + 32 + 32 + 2 + 2 + 8 + 1);
  const auth = PublicKey.unique();
  const bcc = PublicKey.unique();
  const cgt = PublicKey.unique();
  auth.toBuffer().copy(cfg, 8);
  bcc.toBuffer().copy(cfg, 40);
  cgt.toBuffer().copy(cfg, 72);
  cfg.writeUInt16LE(10000, 104);
  cfg.writeUInt16LE(10000, 106);
  cfg.writeBigUInt64LE(7n, 108);
  const decoded = decodeConfig(cfg);
  assert.equal(decoded.authority, auth.toBase58());
  assert.equal(decoded.bccMint, bcc.toBase58());
  assert.equal(decoded.minerCount, 7);
  assert.equal(decoded.marketplaceFeeBps, 250);
  assert.equal(decoded.feeTreasury, auth.toBase58());

  const treasury = PublicKey.unique();
  const cfgFee = Buffer.alloc(8 + 32 + 32 + 32 + 2 + 2 + 8 + 1 + 2 + 32);
  auth.toBuffer().copy(cfgFee, 8);
  bcc.toBuffer().copy(cfgFee, 40);
  cgt.toBuffer().copy(cfgFee, 72);
  cfgFee.writeUInt16LE(10000, 104);
  cfgFee.writeUInt16LE(10000, 106);
  cfgFee.writeBigUInt64LE(7n, 108);
  cfgFee.writeUInt8(1, 116);
  cfgFee.writeUInt16LE(250, 117);
  treasury.toBuffer().copy(cfgFee, 119);
  const decodedFee = decodeConfig(cfgFee);
  assert.equal(decodedFee.marketplaceFeeBps, 250);
  assert.equal(decodedFee.feeTreasury, treasury.toBase58());
});
