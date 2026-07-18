/**
 * Server-side ZKPassport verification + nullifier hashing.
 */

import { createHash } from 'node:crypto';
import { mockUniqueIdentifier } from './nullifier.ts';

export function serverZkScope(): string {
  return process.env.ZKPASSPORT_SCOPE || 'culture-node-soulbound-v1';
}

export function serverZkDevMode(): boolean {
  const v = process.env.ZKPASSPORT_DEV_MODE;
  if (v === '0' || v === 'false') return false;
  if (v === '1' || v === 'true') return true;
  // Safe default for Devnet until live project is configured
  return true;
}

export function hashNullifierSync(uniqueIdentifier: string): string {
  return createHash('sha256').update(uniqueIdentifier.trim(), 'utf8').digest('hex');
}

export type ServerVerifyInput = {
  uniqueIdentifier?: string;
  verified?: boolean;
  mode?: 'live' | 'mock';
  proofs?: unknown[];
  originalQuery?: unknown;
  queryResult?: unknown;
  walletAddress: string;
};

export type ServerVerifyResult = {
  ok: boolean;
  nullifierHash?: string;
  mode: 'live' | 'mock';
  error?: string;
};

/**
 * Verify uniqueness payload. Dev mode accepts mock identifiers.
 * Live mode re-verifies via @zkpassport/sdk when proofs are present.
 */
export async function verifyZkPassportPayload(
  input: ServerVerifyInput
): Promise<ServerVerifyResult> {
  const scope = serverZkScope();
  const dev = serverZkDevMode();

  if (input.mode === 'mock' || (!input.proofs?.length && dev)) {
    const uid =
      input.uniqueIdentifier?.trim() ||
      mockUniqueIdentifier(input.walletAddress, scope);
    if (!uid.startsWith('mock:') && !dev) {
      return { ok: false, mode: 'mock', error: 'Mock uniqueness rejected outside DEV mode' };
    }
    // In dev, allow mock:* or any uniqueIdentifier from client when verified flag set
    if (input.verified === false) {
      return { ok: false, mode: 'mock', error: 'Client reported unverified' };
    }
    return {
      ok: true,
      nullifierHash: hashNullifierSync(uid),
      mode: 'mock',
    };
  }

  if (!input.uniqueIdentifier || !input.verified) {
    return { ok: false, mode: 'live', error: 'Missing verified uniqueIdentifier' };
  }

  if (input.proofs?.length && input.originalQuery && input.queryResult) {
    try {
      const sdk = '@zkpassport/sdk';
      const mod = await import(/* @vite-ignore */ sdk);
      const ZKPassport = (mod as any).ZKPassport;
      const domain =
        process.env.VITE_ZKPASSPORT_DOMAIN ||
        process.env.ZKPASSPORT_DOMAIN ||
        'mining.buildingcultureid.space';
      const zk = new ZKPassport(domain);
      const result = await zk.verify({
        proofs: input.proofs,
        originalQuery: input.originalQuery,
        queryResult: input.queryResult,
        scope,
        devMode: false,
      });
      if (!result.verified || !result.uniqueIdentifier) {
        return { ok: false, mode: 'live', error: 'ZKPassport server verify failed' };
      }
      return {
        ok: true,
        nullifierHash: hashNullifierSync(String(result.uniqueIdentifier)),
        mode: 'live',
      };
    } catch (err: any) {
      if (dev) {
        // SDK missing — accept client uniqueIdentifier in dev only
        return {
          ok: true,
          nullifierHash: hashNullifierSync(input.uniqueIdentifier),
          mode: 'mock',
        };
      }
      return {
        ok: false,
        mode: 'live',
        error: err?.message || 'ZKPassport SDK verify unavailable',
      };
    }
  }

  if (dev) {
    return {
      ok: true,
      nullifierHash: hashNullifierSync(input.uniqueIdentifier),
      mode: 'mock',
    };
  }

  return {
    ok: false,
    mode: 'live',
    error: 'Live mode requires proofs + originalQuery + queryResult for server verify',
  };
}
