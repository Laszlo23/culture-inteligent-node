/**
 * Scoped nullifier hashing — never store raw passport fields.
 */

const SCOPE_DEFAULT = 'culture-node-soulbound-v1';

export function zkPassportScope(): string {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ZKPASSPORT_SCOPE) {
    return String((import.meta as any).env.VITE_ZKPASSPORT_SCOPE);
  }
  return process.env.ZKPASSPORT_SCOPE || SCOPE_DEFAULT;
}

/** Hex SHA-256 of uniqueIdentifier (UTF-8). Browser + Node. */
export async function hashNullifier(uniqueIdentifier: string): Promise<string> {
  const data = new TextEncoder().encode(uniqueIdentifier.trim());
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
    return bufferToHex(digest);
  }
  // Node fallback
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(Buffer.from(data)).digest('hex');
}

/** 32-byte buffer for PDA seeds from hex nullifier hash. */
export function nullifierHashToBytes(nullifierHash: string): Uint8Array {
  const hex = nullifierHash.replace(/^0x/i, '').padStart(64, '0').slice(0, 64);
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Deterministic mock uniqueIdentifier for Devnet demos (not real uniqueness). */
export function mockUniqueIdentifier(walletAddress: string, scope = zkPassportScope()): string {
  return `mock:zkpassport:${scope}:${walletAddress}`;
}
