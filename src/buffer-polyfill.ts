import { Buffer } from 'buffer';

/** Load this module first from main.tsx — @solana/spl-token expects global Buffer. */
if (typeof globalThis !== 'undefined' && !(globalThis as { Buffer?: typeof Buffer }).Buffer) {
  (globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
}

export {};
