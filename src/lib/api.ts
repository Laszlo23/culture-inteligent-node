import { Keypair, PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

const DEVNET_RPC = 'https://api.devnet.solana.com';
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
export const WALLET_TOKEN_KEY = 'building_culture_wallet_jwt_v1';

export function getWalletToken(): string | null {
  return localStorage.getItem(WALLET_TOKEN_KEY);
}

export function setWalletToken(token: string) {
  localStorage.setItem(WALLET_TOKEN_KEY, token);
}

export function clearWalletToken() {
  localStorage.removeItem(WALLET_TOKEN_KEY);
}

async function authHeaders(): Promise<HeadersInit> {
  const token = getWalletToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function ensureWalletApiSession(opts: {
  walletAddress: string;
  walletType: 'extension' | 'local';
  localKeypair?: Keypair | null;
}): Promise<string> {
  const existing = getWalletToken();
  if (existing) return existing;

  const challengeRes = await fetch('/api/wallet/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: opts.walletAddress }),
  });
  if (!challengeRes.ok) {
    throw new Error('Failed to get wallet challenge');
  }
  const { message } = await challengeRes.json();
  const messageBytes = new TextEncoder().encode(message);

  let signature: string;
  let demoUnsigned = false;

  if (opts.walletType === 'local' && opts.localKeypair) {
    const sig = nacl.sign.detached(messageBytes, opts.localKeypair.secretKey);
    signature = bs58.encode(sig);
  } else {
    const provider = (window as any).solana;
    if (provider?.signMessage) {
      const signed = await provider.signMessage(messageBytes, 'utf8');
      const sigBytes = signed.signature instanceof Uint8Array
        ? signed.signature
        : new Uint8Array(signed.signature);
      signature = bs58.encode(sigBytes);
    } else {
      // Jury / iframe fallback — server accepts demoUnsigned in non-prod
      signature = 'demo';
      demoUnsigned = true;
    }
  }

  const loginRes = await fetch('/api/wallet/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: opts.walletAddress,
      signature,
      message,
      demoUnsigned,
    }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}));
    throw new Error(err.error || 'Wallet API login failed');
  }

  const data = await loginRes.json();
  setWalletToken(data.token);
  return data.token as string;
}

export async function verifyAttentionSession(payload: {
  sessionId: string;
  title: string;
  artifacts?: string;
  quizScore?: number;
  quizTotal?: number;
  topic?: string;
  summary?: string;
}) {
  const headers = await authHeaders();
  const response = await fetch('/api/attention/verify', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Attention verification failed');
  }
  return response.json();
}

export async function attestAttentionProof(payload: {
  verificationId: string;
  signature: string;
  sessionId?: string;
  score?: number;
}) {
  const headers = await authHeaders();
  const response = await fetch('/api/attention/attest', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Attest failed');
  }
  return response.json();
}

export async function verifyKpiOnServer(signature: string) {
  const headers = await authHeaders();
  const response = await fetch('/api/kpi/verify', {
    method: 'POST',
    headers,
    body: JSON.stringify({ signature }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'KPI server verify failed');
  }
  return response.json();
}

export type TollCatalogResponse = {
  skus: Array<{
    id: string;
    name: string;
    description: string;
    priceCents: number;
    priceMicroUsdc: number;
    energyPercent?: number;
    sparkCredits?: number;
    academyRetakeCredits?: number;
    listSlotCredits?: number;
    claimTurbo?: boolean;
  }>;
  usdcMint: string;
  treasury: string | null;
  configured: boolean;
  note?: string;
};

export async function fetchTollCatalog(): Promise<TollCatalogResponse> {
  const response = await fetch('/api/toll/catalog');
  if (!response.ok) throw new Error('Toll catalog failed');
  return response.json();
}

export type TollStatsResponse = {
  ok: boolean;
  allTimeCents: number;
  todayCents: number;
  todayCount: number;
  allTimeCount: number;
  topSkus: Array<{ sku: string; count: number; cents: number }>;
  extrapolatedAnnualCents: number;
  note?: string;
  marketplaceFeeBps?: number;
};

export async function fetchTollStats(): Promise<TollStatsResponse> {
  const response = await fetch('/api/toll/stats');
  if (!response.ok) throw new Error('Toll stats failed');
  return response.json();
}

export async function verifyTollOnServer(opts: {
  signature?: string;
  sku: string;
  quantity?: number;
  practice?: boolean;
}) {
  const headers = await authHeaders();
  const response = await fetch('/api/toll/verify', {
    method: 'POST',
    headers,
    body: JSON.stringify(opts),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Toll verify failed');
  }
  return data as {
    ok: true;
    alreadyVerified?: boolean;
    practice?: boolean;
    payment: unknown;
    entitlement: {
      sku: string;
      quantity: number;
      energyPercent: number;
      sparkCredits: number;
      academyRetakeCredits: number;
      listSlotCredits: number;
      claimTurbo: boolean;
      energyBps: number;
    };
    economyTx?: string;
    economyReady?: boolean;
    solscan?: string | null;
  };
}

/** Fetch economy program status (mints configured + authority ready). */
export async function fetchEconomyStatus() {
  const response = await fetch('/api/economy/status');
  if (!response.ok) throw new Error('Economy status failed');
  return response.json() as Promise<{
    ready: boolean;
    configured?: boolean;
    hasAuthority?: boolean;
    programId: string;
    bccMint: string | null;
    cgtMint: string | null;
    reasons?: string[];
    bootstrapHint?: string;
  }>;
}

/** Request authority-cosigned grant_energy (+ optional BCC). */
export async function requestGrantEnergy(opts: {
  energyBps: number;
  bccReward?: number;
  verificationId?: string;
}) {
  const headers = await authHeaders();
  const response = await fetch('/api/economy/grant-energy', {
    method: 'POST',
    headers,
    body: JSON.stringify(opts),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'grant-energy failed');
  }
  return data as { ok: true; serialized: string; energyBps: number; bccReward: number };
}

/** Request authority-cosigned BCC/CGT/energy reward. */
export async function requestEconomyReward(opts: {
  bcc?: number;
  cgt?: number;
  energyBps?: number;
  reason?: string;
}) {
  const headers = await authHeaders();
  const response = await fetch('/api/economy/reward', {
    method: 'POST',
    headers,
    body: JSON.stringify(opts),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'economy reward failed');
  }
  return data as { ok: true; serialized: string; reason: string };
}

/** Sign (as fee payer) and send a partially-signed economy tx from the server. */
export async function sendPartialEconomyTx(opts: {
  serializedBase64: string;
  walletType: 'extension' | 'local';
  localKeypair?: Keypair | null;
}): Promise<string> {
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const tx = Transaction.from(Buffer.from(opts.serializedBase64, 'base64'));

  let signature: string;
  if (opts.walletType === 'local' && opts.localKeypair) {
    tx.partialSign(opts.localKeypair);
    signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  } else {
    const provider = (window as any).solana;
    if (!provider) throw new Error('Phantom provider missing');
    const signed = await provider.signTransaction(tx);
    signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  return signature;
}

export async function fetchCurriculum() {
  const headers = await authHeaders();
  const response = await fetch('/api/curriculum', { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load curriculum');
  }
  return response.json() as Promise<{
    core: unknown[];
    published: any[];
    isAdmin: boolean;
    geminiConfigured: boolean;
  }>;
}

export async function fetchCurriculumDrafts() {
  const headers = await authHeaders();
  const response = await fetch('/api/curriculum/drafts', { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load drafts');
  }
  return response.json() as Promise<{ drafts: any[] }>;
}

export async function researchCurriculumDraft() {
  const headers = await authHeaders();
  const response = await fetch('/api/curriculum/research', {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Curriculum research failed');
  }
  return response.json() as Promise<{ draft: any }>;
}

export async function publishCurriculumDraft(draftId: string) {
  const headers = await authHeaders();
  const response = await fetch('/api/curriculum/publish', {
    method: 'POST',
    headers,
    body: JSON.stringify({ draftId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Publish failed');
  }
  return response.json();
}

export async function rejectCurriculumDraft(draftId: string) {
  const headers = await authHeaders();
  const response = await fetch('/api/curriculum/reject', {
    method: 'POST',
    headers,
    body: JSON.stringify({ draftId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Reject failed');
  }
  return response.json();
}

/** Send Devnet memo attestation for a PoA */
export async function sendPoaMemoAttestation(opts: {
  walletAddress: string;
  walletType: 'extension' | 'local';
  localKeypair?: Keypair | null;
  memo: string;
}): Promise<string> {
  const connection = new Connection(DEVNET_RPC, 'confirmed');
  const payer = new PublicKey(opts.walletAddress);

  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(opts.memo, 'utf8'),
  });

  const tx = new Transaction().add(memoIx);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer;

  let signature: string;
  if (opts.walletType === 'local' && opts.localKeypair) {
    tx.sign(opts.localKeypair);
    signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  } else {
    const provider = (window as any).solana;
    if (!provider) throw new Error('Phantom provider missing');
    const result = await provider.signAndSendTransaction(tx);
    signature = result.signature;
  }

  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  return signature;
}

// Re-export legacy api surface used by Admin/Feedback (Firebase)
import { auth } from './firebase.ts';

async function getAuthHeaders(): Promise<HeadersInit> {
  const walletToken = getWalletToken();
  if (walletToken) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${walletToken}`,
    };
  }
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { 'Content-Type': 'application/json' };
  }
  try {
    const token = await currentUser.getIdToken(true);
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
}

export interface ApiUser {
  uid: string;
  email: string;
  username: string;
  walletAddress?: string;
  isAdmin: boolean;
}

export interface ApiMessage {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ApiTicket {
  id: string;
  userId: string;
  type: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'Open' | 'Resolved';
  reply?: string;
}

export const api = {
  async syncUser(username: string, walletAddress?: string): Promise<ApiUser> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, walletAddress }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to synchronize user session with the database');
    }
    const data = await response.json();
    return data.user;
  },

  async getProfile(): Promise<ApiUser> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/profile', { method: 'GET', headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch user profile');
    }
    return response.json();
  },

  async getAllUsers(): Promise<ApiUser[]> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/users', { method: 'GET', headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch registered ecosystem users');
    }
    return response.json();
  },

  async getMessages() {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/messages', { method: 'GET', headers });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async broadcastMessage(recipient: string, subject: string, content: string) {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipient,
        subject,
        content,
        timestamp: new Date().toLocaleString(),
      }),
    });
    if (!response.ok) throw new Error('Failed to broadcast');
    return response.json();
  },

  async markMessageAsRead(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/messages/${id}/read`, { method: 'POST', headers });
    if (!response.ok) throw new Error('Failed to update message');
    return response.json();
  },

  async getTickets() {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/feedback', { method: 'GET', headers });
    if (!response.ok) throw new Error('Failed to fetch tickets');
    return response.json();
  },

  async submitTicket(type: string, subject: string, message: string) {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type,
        subject,
        message,
        timestamp: new Date().toLocaleString(),
      }),
    });
    if (!response.ok) throw new Error('Failed to submit feedback');
    return response.json();
  },

  async resolveTicket(id: string, reply: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/feedback/${id}/resolve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reply }),
    });
    if (!response.ok) throw new Error('Failed to resolve ticket');
    return response.json();
  },
};

export type MarketPulseHotToken = {
  symbol: string;
  address: string;
  priceUsd?: number;
  name?: string;
};

export type MarketPulseResponse =
  | {
      available: true;
      sol: { priceUsd: number; change24h?: number };
      hot: MarketPulseHotToken[];
      source: string;
      fetchedAt: string;
    }
  | {
      available: false;
      reason: string;
      source: string;
      fetchedAt: string;
    };

/** Live Solana market pulse from OKX OnchainOS (server-side CLI). */
export async function fetchMarketPulse(): Promise<MarketPulseResponse> {
  const response = await fetch('/api/market/pulse');
  const body = (await response.json().catch(() => null)) as MarketPulseResponse | null;
  if (body && typeof body === 'object' && 'available' in body) {
    return body;
  }
  return {
    available: false,
    reason: response.ok ? 'Invalid market pulse response' : `HTTP ${response.status}`,
    source: 'okx-onchainos',
    fetchedAt: new Date().toISOString(),
  };
}
