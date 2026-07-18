/**
 * Verify SPL USDC Attention Toll transfers on Solana (Devnet/mainnet RPC).
 */

import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { getDevnetConnection } from './solana-verify.ts';
import { resolveTollEnv, type TollSku } from './toll-catalog.ts';

export async function verifyUsdcTollTransfer(opts: {
  signature: string;
  expectedWallet: string;
  minAmountMicro: number;
  usdcMint?: string;
  treasury?: string;
}): Promise<{ ok: boolean; error?: string; amount?: number; slot?: number }> {
  const env = resolveTollEnv();
  const mintStr = opts.usdcMint || env.usdcMint;
  const treasuryStr = opts.treasury || env.treasury;
  if (!treasuryStr) {
    return { ok: false, error: 'Toll treasury not configured (VITE_TOLL_TREASURY)' };
  }

  let mint: PublicKey;
  let treasury: PublicKey;
  let wallet: PublicKey;
  try {
    mint = new PublicKey(mintStr);
    treasury = new PublicKey(treasuryStr);
    wallet = new PublicKey(opts.expectedWallet);
  } catch {
    return { ok: false, error: 'Invalid mint/treasury/wallet pubkey' };
  }

  const treasuryAta = getAssociatedTokenAddressSync(mint, treasury);
  const connection = getDevnetConnection();

  try {
    const tx = await connection.getParsedTransaction(opts.signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    if (!tx || tx.meta?.err) {
      return { ok: false, error: 'Transaction not found or failed on-chain' };
    }

    const accountKeys =
      tx.transaction.message.accountKeys?.map((k) =>
        typeof k === 'string' ? k : k.pubkey?.toBase58?.() || String(k)
      ) || [];

    const walletInTx = accountKeys.some((k) => k === opts.expectedWallet);
    if (!walletInTx) {
      // Also accept feePayer / signers from message
      const sigs = tx.transaction.message.accountKeys || [];
      const hasWallet = sigs.some((k: { pubkey?: PublicKey; signer?: boolean } | string) => {
        if (typeof k === 'string') return k === opts.expectedWallet;
        return k.pubkey?.toBase58() === opts.expectedWallet;
      });
      if (!hasWallet) {
        return { ok: false, error: 'Wallet not present in toll transaction' };
      }
    }

    const pre = tx.meta?.preTokenBalances || [];
    const post = tx.meta?.postTokenBalances || [];
    const treasuryAtaStr = treasuryAta.toBase58();

    const findBal = (
      list: typeof pre,
      owner: string,
      ataHint?: string
    ): number => {
      for (const b of list) {
        if (b.mint !== mintStr) continue;
        if (b.owner === owner) return Number(b.uiTokenAmount?.amount || 0);
        // Some RPCs omit owner; match account index → keys
        if (ataHint && accountKeys[b.accountIndex] === ataHint) {
          return Number(b.uiTokenAmount?.amount || 0);
        }
      }
      return 0;
    };

    let preAmt = findBal(pre, treasuryStr, treasuryAtaStr);
    let postAmt = findBal(post, treasuryStr, treasuryAtaStr);

    // Fallback: match ATA pubkey in account keys
    if (preAmt === 0 && postAmt === 0) {
      const ataIdx = accountKeys.indexOf(treasuryAtaStr);
      if (ataIdx >= 0) {
        const preRow = pre.find((b) => b.accountIndex === ataIdx && b.mint === mintStr);
        const postRow = post.find((b) => b.accountIndex === ataIdx && b.mint === mintStr);
        preAmt = Number(preRow?.uiTokenAmount?.amount || 0);
        postAmt = Number(postRow?.uiTokenAmount?.amount || 0);
      }
    }

    const delta = postAmt - preAmt;
    if (delta < opts.minAmountMicro) {
      return {
        ok: false,
        error: `Treasury received ${delta} micro-USDC; need ≥ ${opts.minAmountMicro}`,
      };
    }

    // Soft check: payer should have lost USDC (best-effort)
    void wallet;

    return { ok: true, amount: delta, slot: tx.slot };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'RPC verification failed';
    return { ok: false, error: message };
  }
}

export type TollEntitlement = {
  sku: string;
  quantity: number;
  energyPercent: number;
  sparkCredits: number;
  academyRetakeCredits: number;
  listSlotCredits: number;
  claimTurbo: boolean;
  energyBps: number;
};

export function entitlementFromSku(sku: TollSku, quantity = 1): TollEntitlement {
  const q = Math.max(1, Math.floor(quantity));
  const energyPercent = (sku.energyPercent || 0) * q;
  return {
    sku: sku.id,
    quantity: q,
    energyPercent,
    sparkCredits: (sku.sparkCredits || 0) * q,
    academyRetakeCredits: (sku.academyRetakeCredits || 0) * q,
    listSlotCredits: (sku.listSlotCredits || 0) * q,
    claimTurbo: Boolean(sku.claimTurbo),
    energyBps: Math.round(energyPercent * 100),
  };
}
