/**
 * High-level economy actions for React components.
 */

import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import {
  fetchEconomyStatus,
  requestGrantEnergy,
  requestEconomyReward,
  sendPartialEconomyTx,
} from './api';
import {
  fetchLedger,
  initPlayerIfNeeded,
  getConnection,
  buildSwapIx,
  buildClaimDailyIx,
  buildMintMinerIx,
  buildListMinerIx,
  buildCancelListIx,
  buildBuyMinerIx,
  buildDrainEnergyIx,
  fetchConfig,
  minerPda,
  solscanTx,
  isEconomyConfigured,
  fetchMinersOwnedBy,
  fetchOpenListings,
  minerToGameNft,
} from './solana-economy';
import { resolveEconomyWallet } from './economy-wallet';
import { energyPercentToBps } from './economy-rewards';
import { buildMemoIx, formatAttentionMemo } from './poa-chain';
import type { MinerNFT } from '../types';

/** Accumulated UI energy decay awaiting drain_energy flush (percent points). */
let pendingDrainPercent = 0;
let drainFlushInFlight = false;
let lastDrainFlushAt = 0;

async function signAndSend(tx: Transaction): Promise<string> {
  const ctx = resolveEconomyWallet();
  if (!ctx) throw new Error('No wallet session');
  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = new PublicKey(ctx.walletAddress);

  if (ctx.walletType === 'local' && ctx.localKeypair) {
    tx.sign(ctx.localKeypair);
    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    return signature;
  }

  const provider = (window as any).solana;
  if (!provider) throw new Error('Phantom missing');
  const result = await provider.signAndSendTransaction(tx);
  const signature = result.signature as string;
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  return signature;
}

async function sendIxs(ixs: TransactionInstruction[]): Promise<string> {
  const tx = new Transaction();
  for (const ix of ixs) tx.add(ix);
  return signAndSend(tx);
}

export async function syncLedgerToState(setState: (fn: (prev: any) => any) => void) {
  const ctx = resolveEconomyWallet();
  if (!ctx || !isEconomyConfigured()) return null;
  const owner = new PublicKey(ctx.walletAddress);
  const ledger = await fetchLedger(owner);
  if (!ledger.player) return ledger;
  setState((prev) => ({
    ...prev,
    energy: ledger.player!.energyPercent,
    credits: ledger.bcc,
    cognitiveTokens: ledger.cgt,
    miningPower: Math.max(prev.miningPower, 4.8 + ledger.player!.miningPower),
  }));
  return ledger;
}

/**
 * Merge on-chain MinerAssets + open listings into game state.
 * When settlement is ready, drop local demo skins so only settleable onchain_* inventory shows.
 */
export async function syncMinersToState(setState: (fn: (prev: any) => any) => void) {
  const ctx = resolveEconomyWallet();
  if (!ctx || !isEconomyConfigured()) return null;
  const owner = new PublicKey(ctx.walletAddress);
  const me = ctx.walletAddress;
  const [owned, market, status] = await Promise.all([
    fetchMinersOwnedBy(owner),
    fetchOpenListings(),
    fetchEconomyStatus().catch(() => ({ ready: false })),
  ]);

  const ownedNfts = owned.map((m) => minerToGameNft(m, me));
  const marketNfts: MinerNFT[] = market
    .filter((m) => m.owner !== me)
    .map((m) => {
      const nft = minerToGameNft(m, me);
      nft.owner = m.seller;
      nft.isListed = true;
      nft.listingPrice = m.listingPrice;
      return nft;
    });

  const settlementReady = Boolean(status?.ready);

  setState((prev) => {
    const demoLocal = settlementReady
      ? []
      : (prev.minerNFTs || []).filter((n: MinerNFT) => !String(n.id).startsWith('onchain_'));
    const byId = new Map<string, MinerNFT>();
    for (const n of demoLocal) byId.set(n.id, n);
    for (const n of ownedNfts) byId.set(n.id, n);
    for (const n of marketNfts) byId.set(n.id, n);
    const minerNFTs = [...byId.values()];
    const ownedPower = ownedNfts.reduce((s, n) => s + (n.hashrate || 0) / 1000, 0);
    return {
      ...prev,
      minerNFTs,
      miningPower: Math.max(prev.miningPower, 4.8 + ownedPower),
    };
  });

  return { owned: ownedNfts, market: marketNfts };
}

export async function ensurePlayerOnChain(): Promise<{ signature?: string; created: boolean } | null> {
  const ctx = resolveEconomyWallet();
  if (!ctx || !isEconomyConfigured()) return null;
  const owner = new PublicKey(ctx.walletAddress);
  return initPlayerIfNeeded(owner, signAndSend);
}

export async function grantEnergyOnChain(opts: {
  energyPercent: number;
  bccReward?: number;
  verificationId?: string;
}): Promise<{ signature: string; solscan: string } | { skipped: true; reason: string }> {
  const status = await fetchEconomyStatus();
  if (!status.ready) {
    return { skipped: true, reason: 'Economy authority/mints not configured' };
  }
  const ctx = resolveEconomyWallet();
  if (!ctx) return { skipped: true, reason: 'No wallet session' };

  await ensurePlayerOnChain();
  const energyBps = Math.min(10000, Math.max(1, Math.round(opts.energyPercent * 100)));
  const grant = await requestGrantEnergy({
    energyBps,
    bccReward: opts.bccReward,
    verificationId: opts.verificationId,
  });
  const signature = await sendPartialEconomyTx({
    serializedBase64: grant.serialized,
    walletType: ctx.walletType,
    localKeypair: ctx.localKeypair,
  });
  return { signature, solscan: solscanTx(signature) };
}

export async function rewardOnChain(opts: {
  bcc?: number;
  cgt?: number;
  energyPercent?: number;
  reason?: string;
}): Promise<{ signature: string; solscan: string } | { skipped: true; reason: string }> {
  const status = await fetchEconomyStatus();
  if (!status.ready) return { skipped: true, reason: 'Economy not configured' };
  const ctx = resolveEconomyWallet();
  if (!ctx) return { skipped: true, reason: 'No wallet session' };

  const reward = await requestEconomyReward({
    bcc: opts.bcc,
    cgt: opts.cgt,
    energyBps: opts.energyPercent != null ? Math.round(opts.energyPercent * 100) : 0,
    reason: opts.reason,
  });
  const signature = await sendPartialEconomyTx({
    serializedBase64: reward.serialized,
    walletType: ctx.walletType,
    localKeypair: ctx.localKeypair,
  });
  return { signature, solscan: solscanTx(signature) };
}

export async function swapBccToCgtOnChain(bccAmount: number): Promise<string> {
  const ctx = resolveEconomyWallet();
  if (!ctx) throw new Error('No wallet');
  const owner = new PublicKey(ctx.walletAddress);
  const ixs = await buildSwapIx(owner, bccAmount);
  // PoA: Mind↔Machine crystallize — same signature as swap
  ixs.push(
    buildMemoIx(
      owner,
      formatAttentionMemo('duality_swap', { bcc: bccAmount, t: Date.now() })
    )
  );
  return sendIxs(ixs);
}

export async function claimDailyOnChain(): Promise<string> {
  const ctx = resolveEconomyWallet();
  if (!ctx) throw new Error('No wallet');
  const owner = new PublicKey(ctx.walletAddress);
  const ixs = await buildClaimDailyIx(owner);
  // PoA: daily attention refill receipt — bundled, one wallet signature
  ixs.push(
    buildMemoIx(owner, formatAttentionMemo('claim_daily', { energy: 15, bcc: 50, t: Date.now() }))
  );
  return sendIxs(ixs);
}

export async function mintMinerOnChain(opts: {
  skin: string;
  hashrate: number;
  rarity: string;
}): Promise<{ signature: string; assetId: number; mintAddress: string }> {
  const ctx = resolveEconomyWallet();
  if (!ctx) throw new Error('No wallet');
  const owner = new PublicKey(ctx.walletAddress);

  const attempt = async (assetId: number) => {
    const mintIxs = await buildMintMinerIx(owner, assetId, opts.skin, opts.hashrate, opts.rarity);
    mintIxs.push(
      buildMemoIx(
        owner,
        formatAttentionMemo('mint_miner', {
          asset: assetId,
          skin: opts.skin,
          rarity: opts.rarity,
          t: Date.now(),
        })
      )
    );
    const signature = await sendIxs(mintIxs);
    return { signature, assetId, mintAddress: minerPda(assetId).toBase58() };
  };

  const config = await fetchConfig();
  if (!config) throw new Error('Config PDA missing — run bootstrap');
  try {
    return await attempt(config.minerCount);
  } catch (firstErr: unknown) {
    // Race: re-fetch minerCount and retry once
    const refreshed = await fetchConfig();
    if (!refreshed || refreshed.minerCount === config.minerCount) throw firstErr;
    return await attempt(refreshed.minerCount);
  }
}

export async function listMinerOnChain(assetId: number, priceCgt: number): Promise<string> {
  const ctx = resolveEconomyWallet();
  if (!ctx) throw new Error('No wallet');
  const seller = new PublicKey(ctx.walletAddress);
  const miner = minerPda(assetId);
  return sendIxs([await buildListMinerIx(seller, miner, assetId, priceCgt)]);
}

export async function cancelListOnChain(assetId: number): Promise<string> {
  const ctx = resolveEconomyWallet();
  if (!ctx) throw new Error('No wallet');
  const seller = new PublicKey(ctx.walletAddress);
  return sendIxs([await buildCancelListIx(seller, minerPda(assetId))]);
}

export async function buyMinerOnChain(assetId: number, sellerAddress: string): Promise<string> {
  const ctx = resolveEconomyWallet();
  if (!ctx) throw new Error('No wallet');
  const buyer = new PublicKey(ctx.walletAddress);
  const seller = new PublicKey(sellerAddress);
  const miner = minerPda(assetId);
  return sendIxs(await buildBuyMinerIx(buyer, seller, assetId, miner));
}

/** Immediate drain_energy for energyBps on Player PDA. */
export async function drainEnergyOnChain(energyBps: number): Promise<string> {
  const ctx = resolveEconomyWallet();
  if (!ctx) throw new Error('No wallet');
  const owner = new PublicKey(ctx.walletAddress);
  return sendIxs([await buildDrainEnergyIx(owner, energyBps)]);
}

/**
 * Queue local reactor decay and flush drain_energy when ≥2% accumulated
 * or at least 45s since last flush (avoids spam).
 */
export async function queueEnergyDrainPercent(decayPercent: number): Promise<string | null> {
  if (!(decayPercent > 0)) return null;
  pendingDrainPercent += decayPercent;

  const now = Date.now();
  const shouldFlush =
    pendingDrainPercent >= 2 || (pendingDrainPercent > 0 && now - lastDrainFlushAt > 45_000);
  if (!shouldFlush || drainFlushInFlight) return null;

  const status = await fetchEconomyStatus().catch(() => ({ ready: false }));
  if (!status.ready) {
    pendingDrainPercent = 0;
    return null;
  }

  const bps = energyPercentToBps(pendingDrainPercent);
  if (bps < 1) return null;

  drainFlushInFlight = true;
  try {
    const sig = await drainEnergyOnChain(bps);
    pendingDrainPercent = 0;
    lastDrainFlushAt = Date.now();
    return sig;
  } catch (err: unknown) {
    // Keep pending for next tick; do not invent local fuel.
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[economy] drain_energy flush failed (${bps} bps pending): ${msg}`);
    return null;
  } finally {
    drainFlushInFlight = false;
  }
}
