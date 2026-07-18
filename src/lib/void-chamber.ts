/**
 * The Void — client helpers for anonymous asks.
 * Never attaches wallet JWT. Local fallback when API/DB unavailable.
 */

export type VoidAsk = {
  id: string;
  body: string;
  contentHash: string;
  createdAt: string;
  replyCount: number;
  local?: boolean;
};

export type VoidReply = {
  id: string;
  askId: string;
  body: string;
  contentHash: string;
  createdAt: string;
  local?: boolean;
};

export type AnonymityReceipt = {
  postId: string;
  contentHash: string;
  powNonce: string;
  authHeaderSent: false;
  walletTokenSent: false;
  storedFields: string[];
  forbiddenFieldsAbsent: string[];
  serverMode: 'live' | 'local-fallback';
  issuedAt: string;
};

const LOCAL_KEY = 'culture_void_asks_v1';
const LOCAL_REPLIES_KEY = 'culture_void_replies_v1';
/** One-shot draft seeded from Signal Desk → The Void */
export const VOID_DRAFT_KEY = 'culture_void_draft_v1';

export const VOID_MANIFEST = {
  name: 'The Void',
  claim:
    'Posts are accepted only without Authorization. Schema stores no user_id, wallet, email, or IP.',
  endpoint: '/api/void/asks',
  storedFields: ['id', 'body', 'content_hash', 'created_at', 'reply_count'],
  forbiddenFields: [
    'user_id',
    'uid',
    'wallet',
    'wallet_address',
    'email',
    'username',
    'ip',
    'authorization',
  ],
  authPolicy: 'reject-if-authorization-present',
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Light PoW so spam needs work — not identity. */
export async function mineVoidPow(body: string, difficulty = 3): Promise<{ nonce: string; hash: string }> {
  const prefix = '0'.repeat(difficulty);
  let nonce = 0;
  while (nonce < 2_000_000) {
    const hash = await sha256Hex(`${body}:${nonce}`);
    if (hash.startsWith(prefix)) return { nonce: String(nonce), hash };
    nonce += 1;
  }
  // Fallback: accept weaker work if device is slow
  const hash = await sha256Hex(`${body}:${nonce}`);
  return { nonce: String(nonce), hash };
}

export async function hashVoidBody(body: string): Promise<string> {
  return sha256Hex(body.trim());
}

function loadLocalAsks(): VoidAsk[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalAsks(asks: VoidAsk[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(asks.slice(0, 80)));
}

function loadLocalReplies(): VoidReply[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REPLIES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalReplies(replies: VoidReply[]) {
  localStorage.setItem(LOCAL_REPLIES_KEY, JSON.stringify(replies.slice(0, 200)));
}

/** Fetch with zero identity headers — strips Authorization deliberately. */
async function voidFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  headers.delete('Authorization');
  headers.delete('authorization');
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(path, { ...init, headers, credentials: 'omit' });
}

export async function fetchVoidManifest(): Promise<typeof VOID_MANIFEST & { ok: boolean }> {
  try {
    const res = await voidFetch('/api/void/manifest');
    if (!res.ok) return { ...VOID_MANIFEST, ok: false };
    const data = await res.json();
    return { ...VOID_MANIFEST, ...data, ok: true };
  } catch {
    return { ...VOID_MANIFEST, ok: false };
  }
}

export async function listVoidAsks(): Promise<VoidAsk[]> {
  try {
    const res = await voidFetch('/api/void/asks');
    if (!res.ok) throw new Error('void list failed');
    const rows = await res.json();
    const remote: VoidAsk[] = (rows || []).map((r: any) => ({
      id: r.id,
      body: r.body,
      contentHash: r.contentHash || r.content_hash,
      createdAt: r.createdAt || r.created_at || new Date().toISOString(),
      replyCount: r.replyCount ?? r.reply_count ?? 0,
    }));
    const local = loadLocalAsks().filter((a) => !remote.some((r) => r.id === a.id));
    return [...local, ...remote].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return loadLocalAsks();
  }
}

export async function listVoidReplies(askId: string): Promise<VoidReply[]> {
  try {
    const res = await voidFetch(`/api/void/asks/${encodeURIComponent(askId)}/replies`);
    if (!res.ok) throw new Error('void replies failed');
    const rows = await res.json();
    const remote: VoidReply[] = (rows || []).map((r: any) => ({
      id: r.id,
      askId: r.askId || r.ask_id,
      body: r.body,
      contentHash: r.contentHash || r.content_hash,
      createdAt: r.createdAt || r.created_at || new Date().toISOString(),
    }));
    const local = loadLocalReplies().filter((r) => r.askId === askId);
    return [...local, ...remote].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } catch {
    return loadLocalReplies().filter((r) => r.askId === askId);
  }
}

export async function postVoidAsk(
  body: string
): Promise<{ ask: VoidAsk; receipt: AnonymityReceipt }> {
  const trimmed = body.trim();
  if (trimmed.length < 8) throw new Error('Ask something real — at least a few words.');
  if (trimmed.length > 2000) throw new Error('Keep it under 2000 characters.');

  const contentHash = await hashVoidBody(trimmed);
  const { nonce } = await mineVoidPow(trimmed);

  try {
    const res = await voidFetch('/api/void/asks', {
      method: 'POST',
      body: JSON.stringify({ body: trimmed, contentHash, powNonce: nonce }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Void rejected the ask');
    }
    const data = await res.json();
    const ask: VoidAsk = {
      id: data.id || data.ask?.id,
      body: data.body || data.ask?.body || trimmed,
      contentHash: data.contentHash || data.ask?.contentHash || contentHash,
      createdAt:
        data.createdAt || data.ask?.createdAt || data.created_at || new Date().toISOString(),
      replyCount: 0,
    };
    const receipt: AnonymityReceipt = data.receipt || {
      postId: ask.id,
      contentHash: ask.contentHash,
      powNonce: nonce,
      authHeaderSent: false,
      walletTokenSent: false,
      storedFields: VOID_MANIFEST.storedFields,
      forbiddenFieldsAbsent: VOID_MANIFEST.forbiddenFields,
      serverMode: 'live',
      issuedAt: new Date().toISOString(),
    };
    return { ask, receipt };
  } catch {
    const ask: VoidAsk = {
      id: `void_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      body: trimmed,
      contentHash,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      local: true,
    };
    const asks = loadLocalAsks();
    asks.unshift(ask);
    saveLocalAsks(asks);
    return {
      ask,
      receipt: {
        postId: ask.id,
        contentHash,
        powNonce: nonce,
        authHeaderSent: false,
        walletTokenSent: false,
        storedFields: VOID_MANIFEST.storedFields,
        forbiddenFieldsAbsent: VOID_MANIFEST.forbiddenFields,
        serverMode: 'local-fallback',
        issuedAt: new Date().toISOString(),
      },
    };
  }
}

export async function postVoidReply(
  askId: string,
  body: string
): Promise<{ reply: VoidReply; receipt: AnonymityReceipt }> {
  const trimmed = body.trim();
  if (trimmed.length < 2) throw new Error('Reply is empty.');
  if (trimmed.length > 1500) throw new Error('Keep replies under 1500 characters.');

  const contentHash = await hashVoidBody(trimmed);
  const { nonce } = await mineVoidPow(trimmed);

  try {
    const res = await voidFetch(`/api/void/asks/${encodeURIComponent(askId)}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body: trimmed, contentHash, powNonce: nonce }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Void rejected the reply');
    }
    const data = await res.json();
    const reply: VoidReply = {
      id: data.id || data.reply?.id,
      askId,
      body: data.body || data.reply?.body || trimmed,
      contentHash: data.contentHash || data.reply?.contentHash || contentHash,
      createdAt:
        data.createdAt || data.reply?.createdAt || data.created_at || new Date().toISOString(),
    };
    return {
      reply,
      receipt: data.receipt || {
        postId: reply.id,
        contentHash,
        powNonce: nonce,
        authHeaderSent: false,
        walletTokenSent: false,
        storedFields: ['id', 'ask_id', 'body', 'content_hash', 'created_at'],
        forbiddenFieldsAbsent: VOID_MANIFEST.forbiddenFields,
        serverMode: 'live',
        issuedAt: new Date().toISOString(),
      },
    };
  } catch {
    const reply: VoidReply = {
      id: `void_r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      askId,
      body: trimmed,
      contentHash,
      createdAt: new Date().toISOString(),
      local: true,
    };
    const replies = loadLocalReplies();
    replies.push(reply);
    saveLocalReplies(replies);
    const asks = loadLocalAsks().map((a) =>
      a.id === askId ? { ...a, replyCount: (a.replyCount || 0) + 1 } : a
    );
    saveLocalAsks(asks);
    return {
      reply,
      receipt: {
        postId: reply.id,
        contentHash,
        powNonce: nonce,
        authHeaderSent: false,
        walletTokenSent: false,
        storedFields: ['id', 'ask_id', 'body', 'content_hash', 'created_at'],
        forbiddenFieldsAbsent: VOID_MANIFEST.forbiddenFields,
        serverMode: 'local-fallback',
        issuedAt: new Date().toISOString(),
      },
    };
  }
}
