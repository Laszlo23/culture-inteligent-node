/**
 * Resolve wallet signing context from the current Culture Node session.
 */

import { Keypair } from '@solana/web3.js';

export type EconomyWalletCtx = {
  walletAddress: string;
  walletType: 'extension' | 'local';
  localKeypair: Keypair | null;
};

export function resolveEconomyWallet(): EconomyWalletCtx | null {
  try {
    const raw = localStorage.getItem('solana_current_user_session_v1');
    if (!raw) return null;
    const session = JSON.parse(raw) as {
      walletAddress?: string;
      walletType?: 'extension' | 'local';
    };
    if (!session.walletAddress) return null;

    let localKeypair: Keypair | null = null;
    if (session.walletType === 'local') {
      const secret = localStorage.getItem('solana_local_secret');
      if (secret) {
        localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
      }
    }

    return {
      walletAddress: session.walletAddress,
      walletType: session.walletType === 'local' ? 'local' : 'extension',
      localKeypair,
    };
  } catch {
    return null;
  }
}
