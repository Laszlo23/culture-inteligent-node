/**
 * ZKPassport client adapter — uniqueness for soulbound reputation.
 * Live: @zkpassport/sdk when installed. Dev: mock nullifier for Devnet demos.
 */

import { BRAND, SLOGANS } from '../brand-slogans';
import { hashNullifier, mockUniqueIdentifier, zkPassportScope } from './nullifier';
import type { ZkVerifyPayload } from './types';

export type ZkPassportRequestResult = {
  mode: 'live' | 'mock';
  url?: string;
  uniqueIdentifier?: string;
  nullifierHash?: string;
  verified: boolean;
  /** Cancel / cleanup live bridge if any */
  cancel?: () => void;
};

function domain(): string {
  const fromEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.VITE_ZKPASSPORT_DOMAIN
      : undefined;
  if (fromEnv) return String(fromEnv);
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return 'mining.buildingcultureid.space';
}

function clientDevMode(): boolean {
  const v =
    typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.VITE_ZKPASSPORT_DEV_MODE
      : undefined;
  if (v === '0' || v === 'false') return false;
  if (v === '1' || v === 'true') return true;
  // Default: allow mock on localhost / when SDK missing
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  }
  return true;
}

/**
 * Start ZKPassport uniqueness proof (or mock).
 * For live: resolves when onResult fires. For mock: resolves immediately with wallet-scoped id.
 */
export async function requestZkPassportUniqueness(opts: {
  walletAddress: string;
  /** Prefer mock even if SDK present (jury / Hearing demos). */
  forceMock?: boolean;
  onUrl?: (url: string) => void;
  onStatus?: (line: string) => void;
}): Promise<ZkPassportRequestResult> {
  const scope = zkPassportScope();
  const useMock = opts.forceMock || clientDevMode();

  if (!useMock) {
    try {
      // Optional peer — not in package.json until live NFC is configured.
      // @vite-ignore keeps Vite/Rollup from failing when the package is absent.
      const sdk = '@zkpassport/sdk';
      const mod = await import(/* @vite-ignore */ sdk);
      const ZKPassport = (mod as any).ZKPassport;
      if (!ZKPassport) throw new Error('ZKPassport export missing');

      opts.onStatus?.('Opening ZKPassport — scan your ID in the app…');
      const zkPassport = new ZKPassport(domain());
      const queryBuilder = await zkPassport.request({
        name: BRAND.product,
        logo: `${BRAND.url.replace(/\/?$/, '/') }favicon.ico`,
        purpose: `${SLOGANS.attention} Prove unique human for soulbound reputation — no name stored.`,
        scope,
        devMode: false,
      });

      const { url, onResult, onError, onReject } = queryBuilder
        .gte('age', 16)
        .done();

      opts.onUrl?.(url);
      opts.onStatus?.('Scan the QR with ZKPassport. NFC government ID — data stays on your phone.');

      return await new Promise<ZkPassportRequestResult>((resolve, reject) => {
        let settled = false;
        const finish = (r: ZkPassportRequestResult) => {
          if (settled) return;
          settled = true;
          resolve(r);
        };

        onResult?.(async (response: any) => {
          if (!response?.verified || !response?.uniqueIdentifier) {
            reject(new Error('ZKPassport proof not verified'));
            return;
          }
          const nullifierHash = await hashNullifier(String(response.uniqueIdentifier));
          opts.onStatus?.('Proof verified — unique human locked to this scope.');
          finish({
            mode: 'live',
            url,
            uniqueIdentifier: String(response.uniqueIdentifier),
            nullifierHash,
            verified: true,
          });
        });
        onError?.((msg: string) => {
          if (!settled) reject(new Error(msg || 'ZKPassport error'));
        });
        onReject?.(() => {
          if (!settled) reject(new Error('ZKPassport request rejected'));
        });
      });
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      const missing =
        err?.code === 'ERR_MODULE_NOT_FOUND' ||
        /Cannot find module|Failed to resolve|Cannot find package/i.test(msg);
      // Always fall back to mock when SDK is missing or forceMock path requested.
      // Live-only hard fail only when forceMock is false AND env forbids mock.
      const allowMockFallback =
        opts.forceMock === true ||
        clientDevMode() ||
        missing ||
        (typeof import.meta !== 'undefined' &&
          String((import.meta as any).env?.VITE_ZKPASSPORT_DEV_MODE || '') !== '0');
      if (missing) {
        opts.onStatus?.('SDK unavailable — Devnet mock uniqueness (still ZK-gated on server).');
      } else if (!allowMockFallback) {
        throw err;
      } else {
        opts.onStatus?.(`Live verify unavailable (${msg}) — mock path.`);
      }
    }
  }

  // Mock uniqueness (Devnet / demo) — wallet-scoped, not real passport
  opts.onStatus?.('Dev mode: mock ZKPassport nullifier (not real government ID).');
  const uniqueIdentifier = mockUniqueIdentifier(opts.walletAddress, scope);
  const nullifierHash = await hashNullifier(uniqueIdentifier);
  return {
    mode: 'mock',
    uniqueIdentifier,
    nullifierHash,
    verified: true,
  };
}

export function buildVerifyPayload(result: ZkPassportRequestResult): ZkVerifyPayload {
  return {
    uniqueIdentifier: result.uniqueIdentifier || '',
    verified: result.verified,
    mode: result.mode,
  };
}

export { zkPassportScope, hashNullifier, mockUniqueIdentifier };
