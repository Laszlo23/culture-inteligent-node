/**
 * Thin wallet adapter — Phantom + local keypair today; OKX provider slot next.
 */

import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { getPhantomProvider } from '../phantom';
import {
  normalizeWalletProvider,
  type SessionWalletType,
  type WalletProviderId,
  type WalletSessionSnapshot,
  type WalletSigner,
} from './types';

export const WALLET_SESSION_KEY = 'solana_current_user_session_v1';
export const LOCAL_SECRET_KEY = 'solana_local_secret';

export function readWalletSession(): WalletSessionSnapshot | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(WALLET_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as {
      walletAddress?: string;
      walletType?: SessionWalletType;
    };
    if (!session.walletAddress) return null;

    let localKeypair: Keypair | null = null;
    if (normalizeWalletProvider(session.walletType) === 'local') {
      const secret = localStorage.getItem(LOCAL_SECRET_KEY);
      if (secret) {
        localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
      }
    }

    return {
      walletAddress: session.walletAddress,
      walletType: session.walletType ?? 'phantom',
      localKeypair,
    };
  } catch {
    return null;
  }
}

export type SignMessageResult = {
  signatureBytes: Uint8Array;
  /** Jury / iframe fallback when no provider can sign */
  demoUnsigned: boolean;
};

/**
 * Sign a UTF-8 message with the active session wallet.
 * OKX path throws until a real provider is wired.
 */
export async function signMessageForSession(opts: {
  walletType: SessionWalletType | WalletProviderId;
  walletAddress: string;
  localKeypair?: Keypair | null;
  messageBytes: Uint8Array;
}): Promise<SignMessageResult> {
  const providerId = normalizeWalletProvider(opts.walletType);

  if (providerId === 'local') {
    const kp = opts.localKeypair;
    if (!kp) {
      throw new Error('Local wallet key missing — reload and continue again.');
    }
    return {
      signatureBytes: nacl.sign.detached(opts.messageBytes, kp.secretKey),
      demoUnsigned: false,
    };
  }

  if (providerId === 'okx') {
    throw new Error(
      'OKX Agentic Wallet is not connected yet. Use Phantom or Continue without app.'
    );
  }

  // Phantom (and legacy `extension`)
  const provider = getPhantomProvider();
  if (provider?.signMessage) {
    const signed = await provider.signMessage(opts.messageBytes, 'utf8');
    const sigBytes =
      signed.signature instanceof Uint8Array
        ? signed.signature
        : new Uint8Array(signed.signature);
    return { signatureBytes: sigBytes, demoUnsigned: false };
  }

  // Jury / iframe fallback
  return {
    signatureBytes: new TextEncoder().encode(`demo_${opts.walletAddress.slice(0, 8)}`),
    demoUnsigned: true,
  };
}

/** Build a WalletSigner from the current session (null if logged out). */
export function resolveWalletSigner(): WalletSigner | null {
  const snap = readWalletSession();
  if (!snap) return null;
  const providerId = normalizeWalletProvider(snap.walletType);

  return {
    providerId,
    address: snap.walletAddress,
    signMessage: async (message: Uint8Array) => {
      const { signatureBytes, demoUnsigned } = await signMessageForSession({
        walletType: snap.walletType,
        walletAddress: snap.walletAddress,
        localKeypair: snap.localKeypair,
        messageBytes: message,
      });
      if (demoUnsigned && providerId === 'phantom') {
        // Preserve prior demo path for JWT — callers encode as needed
      }
      return signatureBytes;
    },
  };
}

export function providerLabel(type?: string | null): string {
  switch (normalizeWalletProvider(type)) {
    case 'local':
      return 'Local keypair';
    case 'okx':
      return 'OKX';
    default:
      return 'Phantom';
  }
}
