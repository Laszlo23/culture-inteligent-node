/**
 * Resolve wallet signing context from the current Culture Node session.
 */

import { Keypair } from '@solana/web3.js';
import { readWalletSession } from './wallet/adapter';
import { normalizeWalletProvider, type SessionWalletType } from './wallet/types';

export type EconomyWalletCtx = {
  walletAddress: string;
  /**
   * Legacy-compatible type for existing call sites.
   * Phantom sessions surface as `extension`; OKX as `okx`.
   */
  walletType: 'extension' | 'local' | 'okx';
  localKeypair: Keypair | null;
};

function toEconomyWalletType(type?: SessionWalletType | string | null): 'extension' | 'local' | 'okx' {
  const id = normalizeWalletProvider(type);
  if (id === 'local') return 'local';
  if (id === 'okx') return 'okx';
  return 'extension';
}

export function resolveEconomyWallet(): EconomyWalletCtx | null {
  const snap = readWalletSession();
  if (!snap) return null;
  return {
    walletAddress: snap.walletAddress,
    walletType: toEconomyWalletType(snap.walletType),
    localKeypair: snap.localKeypair,
  };
}
