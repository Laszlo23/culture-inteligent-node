import type { ZkIdProvider } from '../../types';

export type ZkVerifyPayload = {
  /** Raw uniqueIdentifier from ZKPassport (or mock). */
  uniqueIdentifier: string;
  verified: boolean;
  /** Optional SDK proofs for server re-verify when not in dev mode. */
  proofs?: unknown[];
  originalQuery?: unknown;
  queryResult?: unknown;
  mode?: 'live' | 'mock';
};

export type ZkBindingRecord = {
  nullifierHash: string;
  walletAddress: string;
  zkProvider: ZkIdProvider;
  verifiedAt: string;
  boundAt: string;
  mintAddress?: string;
  mintSignature?: string;
  badgePda?: string;
  soulboundMinted: boolean;
};

export type ZkStatusResponse = {
  bound: boolean;
  mintable: boolean;
  soulboundMinted: boolean;
  nullifierHash?: string;
  mintAddress?: string;
  mintSignature?: string;
  badgePda?: string;
  verifiedAt?: string;
  zkProvider?: ZkIdProvider;
  devMode: boolean;
  scope: string;
};
