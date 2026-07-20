/**
 * Shared wallet provider types for Culture Node.
 * Phantom remains the live default; OKX is scaffolded for a later connect path.
 */

import type { Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';

export type WalletProviderId = 'phantom' | 'local' | 'okx';

/** Stored session may still say `extension` (legacy Phantom). */
export type SessionWalletType = WalletProviderId | 'extension';

export type WalletSigner = {
  providerId: WalletProviderId;
  address: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: (
    tx: Transaction | VersionedTransaction
  ) => Promise<Transaction | VersionedTransaction>;
};

export type WalletSessionSnapshot = {
  walletAddress: string;
  walletType: SessionWalletType;
  localKeypair: Keypair | null;
};

export function normalizeWalletProvider(
  type?: string | null
): WalletProviderId {
  if (type === 'local') return 'local';
  if (type === 'okx') return 'okx';
  // `extension` and `phantom` both mean Phantom today
  return 'phantom';
}

export function isLocalWallet(type?: string | null): boolean {
  return normalizeWalletProvider(type) === 'local';
}
