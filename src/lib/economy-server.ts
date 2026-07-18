/**
 * Server-side economy authority: build + partial-sign grant/reward txs.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
} from '@solana/web3.js';
import {
  ensureDiscriminators,
  buildGrantEnergyIx,
  buildMintBccIx,
  buildMintCgtIx,
  buildInitPlayerIx,
  fetchPlayer,
  getConnection,
  loadEconomyAuthorityFromEnv,
  isEconomyConfigured,
  ataIx,
  getBccMint,
  getCgtMint,
  solscanTx,
} from './solana-economy';

export function getEconomyAuthority(): Keypair | null {
  return loadEconomyAuthorityFromEnv();
}

export function economyReady(): boolean {
  return isEconomyConfigured() && Boolean(getEconomyAuthority());
}

async function prepareTx(
  feePayer: PublicKey,
  ixs: TransactionInstruction[],
  authority: Keypair,
  connection: Connection
): Promise<{ serialized: string; solscanHint: string }> {
  const tx = new Transaction();
  for (const ix of ixs) tx.add(ix);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = feePayer;
  tx.partialSign(authority);
  const serialized = tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString('base64');
  return { serialized, solscanHint: 'sign-and-send-then-check-solscan' };
}

export async function buildGrantEnergyTransaction(opts: {
  walletAddress: string;
  energyBps: number;
  bccReward?: number;
  ensurePlayer?: boolean;
}): Promise<{
  ok: boolean;
  error?: string;
  serialized?: string;
  energyBps?: number;
  bccReward?: number;
}> {
  await ensureDiscriminators();
  const authority = getEconomyAuthority();
  if (!authority || !isEconomyConfigured()) {
    return {
      ok: false,
      error: 'Economy not configured (VITE_BCC_MINT / VITE_CGT_MINT / ECONOMY_AUTHORITY_SECRET)',
    };
  }

  const owner = new PublicKey(opts.walletAddress);
  const connection = getConnection(process.env.SOLANA_RPC_URL);
  const ixs = [];

  const player = await fetchPlayer(owner, connection);
  if (!player && opts.ensurePlayer !== false) {
    ixs.push(await buildInitPlayerIx(owner));
    const bcc = getBccMint();
    const cgt = getCgtMint();
    if (bcc) ixs.push(ataIx(bcc, owner, owner));
    if (cgt) ixs.push(ataIx(cgt, owner, owner));
  } else if (!player) {
    return { ok: false, error: 'Player PDA missing — call init_player first' };
  }

  ixs.push(await buildGrantEnergyIx(authority.publicKey, owner, opts.energyBps));

  if (opts.bccReward && opts.bccReward > 0) {
    ixs.push(...(await buildMintBccIx(authority.publicKey, owner, opts.bccReward)));
  }

  const { serialized } = await prepareTx(owner, ixs, authority, connection);
  return {
    ok: true,
    serialized,
    energyBps: opts.energyBps,
    bccReward: opts.bccReward || 0,
  };
}

export async function buildRewardTransaction(opts: {
  walletAddress: string;
  bcc?: number;
  cgt?: number;
  energyBps?: number;
}): Promise<{ ok: boolean; error?: string; serialized?: string }> {
  await ensureDiscriminators();
  const authority = getEconomyAuthority();
  if (!authority || !isEconomyConfigured()) {
    return { ok: false, error: 'Economy not configured' };
  }

  const owner = new PublicKey(opts.walletAddress);
  const connection = getConnection(process.env.SOLANA_RPC_URL);
  const ixs = [];

  const player = await fetchPlayer(owner, connection);
  if (!player) {
    ixs.push(await buildInitPlayerIx(owner));
  }

  if (opts.energyBps && opts.energyBps > 0) {
    ixs.push(await buildGrantEnergyIx(authority.publicKey, owner, opts.energyBps));
  }
  if (opts.bcc && opts.bcc > 0) {
    ixs.push(...(await buildMintBccIx(authority.publicKey, owner, opts.bcc)));
  }
  if (opts.cgt && opts.cgt > 0) {
    ixs.push(...(await buildMintCgtIx(authority.publicKey, owner, opts.cgt, owner)));
  }

  if (ixs.length === 0) {
    return { ok: false, error: 'No reward amounts provided' };
  }

  const { serialized } = await prepareTx(owner, ixs, authority, connection);
  return { ok: true, serialized };
}

export { solscanTx };
