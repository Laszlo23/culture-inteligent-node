/**
 * Phantom + Solana wallet helpers — desktop extension + mobile in-app browser.
 * All-in on Phantom for Culture Node (Devnet-ready).
 */

import { BRAND } from './brand-slogans';

export type PhantomProvider = {
  isPhantom?: boolean;
  isConnected?: boolean;
  publicKey?: { toString(): string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  signMessage?: (
    message: Uint8Array,
    display?: string
  ) => Promise<{ signature: Uint8Array }>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    solana?: PhantomProvider;
    phantom?: { solana?: PhantomProvider };
  }
}

/** Prefer window.phantom.solana (multi-wallet safe), fall back to window.solana. */
export function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === 'undefined') return null;
  const fromPhantom = window.phantom?.solana;
  if (fromPhantom?.isPhantom) return fromPhantom;
  const fromSolana = window.solana;
  if (fromSolana?.isPhantom) return fromSolana;
  return null;
}

export function isLikelyMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/** True when running inside Phantom's in-app browser (provider injected). */
export function isInsidePhantomBrowser(): boolean {
  return Boolean(getPhantomProvider());
}

/**
 * Open this dApp inside Phantom mobile browser.
 * Use when desktop extension is missing and user is on a phone.
 */
export function openInPhantomBrowse(targetUrl?: string): void {
  if (typeof window === 'undefined') return;
  const url = encodeURIComponent(targetUrl || window.location.href);
  const ref = encodeURIComponent(BRAND.url.replace(/\/?$/, '/'));
  // Universal link — works on iOS/Android when Phantom is installed
  window.location.href = `https://phantom.app/ul/browse/${url}?ref=${ref}`;
}

export function phantomInstallUrl(): string {
  return 'https://phantom.app/download';
}

/**
 * Connect Phantom: extension/in-app provider, or hand off to mobile browse deeplink.
 * Returns 'connected' | 'redirected' | 'unavailable'
 */
export async function connectPhantomWallet(): Promise<
  | { status: 'connected'; address: string; provider: PhantomProvider }
  | { status: 'redirected' }
  | { status: 'unavailable'; reason: string }
> {
  const provider = getPhantomProvider();
  if (provider) {
    const response = await provider.connect();
    const address = response.publicKey.toString();
    return { status: 'connected', address, provider };
  }

  if (isLikelyMobile()) {
    openInPhantomBrowse();
    return { status: 'redirected' };
  }

  return {
    status: 'unavailable',
    reason:
      'Phantom extension not found. Install Phantom for Chrome/Brave/Firefox, or open this site on your phone in Phantom.',
  };
}
