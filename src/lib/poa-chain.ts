/**
 * Proof of Attention on-chain receipts — SPL Memo + economy ix bundling.
 * Every attention moment that can settle should leave a Devnet signature.
 */

import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { MEMO_PROGRAM_ID, sendPoaMemoAttestation } from './api';
import type { SessionWalletType } from './wallet/types';

export type AttentionProofKind =
  | 'academy'
  | 'first_spark'
  | 'hook_mirror'
  | 'claim_daily'
  | 'duality_swap'
  | 'club_oath'
  | 'spread'
  | 'mint_miner'
  | 'zen_machine'
  | 'presence';

const MEMO_MAX = 500;

export function formatAttentionMemo(
  kind: AttentionProofKind,
  parts: Record<string, string | number | undefined | null> = {}
): string {
  const extras = Object.entries(parts)
    .filter(([, v]) => v != null && String(v).length > 0)
    .map(([k, v]) => `${k}=${String(v).replace(/[|:]/g, '_')}`)
    .join('|');
  const raw = extras ? `poa:${kind}|${extras}` : `poa:${kind}`;
  return raw.length > MEMO_MAX ? raw.slice(0, MEMO_MAX) : raw;
}

export function buildMemoIx(payer: PublicKey, memo: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf8'),
  });
}

type WalletSession = {
  walletAddress: string;
  walletType: SessionWalletType;
  localKeypair?: Keypair | null;
};

export function resolvePoaWallet(): WalletSession | null {
  try {
    const sessionRaw = localStorage.getItem('solana_current_user_session_v1');
    const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
    if (!sessionUser?.walletAddress) return null;
    let localKeypair: Keypair | null = null;
    if (sessionUser.walletType === 'local') {
      const secret = localStorage.getItem('solana_local_secret');
      if (secret) localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
    }
    return {
      walletAddress: sessionUser.walletAddress,
      walletType: sessionUser.walletType === 'extension' ? 'extension' : 'local',
      localKeypair,
    };
  } catch {
    return null;
  }
}

/**
 * Standalone PoA memo tx (second signature after grant_energy, or for oath/spread).
 * Skips cleanly when no wallet — never throws for missing session.
 */
export async function sendAttentionProofMemo(opts: {
  kind: AttentionProofKind;
  parts?: Record<string, string | number | undefined | null>;
}): Promise<{ signature: string; memo: string; solscan: string } | { skipped: true; reason: string }> {
  const wallet = resolvePoaWallet();
  if (!wallet) return { skipped: true, reason: 'No wallet session' };

  const memo = formatAttentionMemo(opts.kind, {
    ...opts.parts,
    t: Date.now(),
  });

  try {
    const signature = await sendPoaMemoAttestation({
      walletAddress: wallet.walletAddress,
      walletType: wallet.walletType,
      localKeypair: wallet.localKeypair,
      memo,
    });
    return {
      signature,
      memo,
      solscan: `https://solscan.io/tx/${signature}?cluster=devnet`,
    };
  } catch (err: any) {
    return { skipped: true, reason: err?.message || String(err) };
  }
}

/** True when member should be prompted / auto-settled on-chain for PoA. */
export function shouldForceOnChainPoa(economyReady: boolean): boolean {
  return economyReady && Boolean(resolvePoaWallet());
}
