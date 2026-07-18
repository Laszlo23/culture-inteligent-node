/**
 * Server-side growth loop ledger — invite codes → connections.
 * File-backed so the network keeps growing across browsers.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type GrowthEventType = 'land' | 'claim' | 'spread' | 'spark' | 'return';

export type GrowthEdge = {
  from: string;
  to: string;
  at: string;
  kind: GrowthEventType;
};

export type GrowthNode = {
  code: string;
  spreads: number;
  landsIn: number;
  claimsIn: number;
  sparks: number;
  lastAt: string;
};

export type GrowthStore = {
  nodes: Record<string, GrowthNode>;
  edges: GrowthEdge[];
  totals: {
    lands: number;
    claims: number;
    spreads: number;
    sparks: number;
    returns: number;
    connections: number;
  };
  seen: string[];
};

const STORE_PATH =
  process.env.GROWTH_NETWORK_PATH?.trim() ||
  path.join(process.cwd(), 'data', 'growth-network.json');

const MAX_EDGES = 2_000;
const MAX_SEEN = 8_000;

function emptyStore(): GrowthStore {
  return {
    nodes: {},
    edges: [],
    totals: {
      lands: 0,
      claims: 0,
      spreads: 0,
      sparks: 0,
      returns: 0,
      connections: 0,
    },
    seen: [],
  };
}

function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = String(raw).trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  return code.length >= 4 ? code : null;
}

async function loadStore(): Promise<GrowthStore> {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as GrowthStore;
    if (!parsed?.nodes || !parsed?.totals) return emptyStore();
    return {
      ...emptyStore(),
      ...parsed,
      nodes: parsed.nodes || {},
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      seen: Array.isArray(parsed.seen) ? parsed.seen : [],
      totals: { ...emptyStore().totals, ...parsed.totals },
    };
  } catch {
    return emptyStore();
  }
}

async function saveStore(store: GrowthStore): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function ensureNode(store: GrowthStore, code: string): GrowthNode {
  if (!store.nodes[code]) {
    store.nodes[code] = {
      code,
      spreads: 0,
      landsIn: 0,
      claimsIn: 0,
      sparks: 0,
      lastAt: new Date().toISOString(),
    };
  }
  return store.nodes[code];
}

function eventId(parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24);
}

export type IngestGrowthInput = {
  type: GrowthEventType;
  /** Invite code that brought someone (inviter) */
  inviteCode?: string | null;
  /** Actor’s own invite code (claimer / spreader) */
  actorCode?: string | null;
  /** Optional client nonce for dedupe */
  nonce?: string | null;
};

export type GrowthPulse = {
  lands: number;
  claims: number;
  spreads: number;
  sparks: number;
  returns: number;
  connections: number;
  nodes: number;
  recent: Array<{ from: string; to: string; kind: GrowthEventType; at: string }>;
};

export type GrowthMemberStats = {
  code: string;
  connections: number;
  landsIn: number;
  claimsIn: number;
  spreads: number;
  sparks: number;
  network: GrowthPulse;
  loop: {
    discovered: boolean;
    claimed: boolean;
    sparked: boolean;
    spread: boolean;
    returned: boolean;
  };
};

export async function ingestGrowthEvent(input: IngestGrowthInput): Promise<{
  ok: boolean;
  duplicate?: boolean;
  pulse: GrowthPulse;
}> {
  const type = input.type;
  const inviteCode = normalizeCode(input.inviteCode);
  const actorCode = normalizeCode(input.actorCode);
  const store = await loadStore();

  const id = eventId([
    type,
    inviteCode || '-',
    actorCode || '-',
    input.nonce || new Date().toISOString().slice(0, 13), // hour bucket default
  ]);

  if (store.seen.includes(id)) {
    return { ok: true, duplicate: true, pulse: toPulse(store) };
  }

  const now = new Date().toISOString();

  switch (type) {
    case 'land': {
      if (!inviteCode) break;
      const n = ensureNode(store, inviteCode);
      n.landsIn += 1;
      n.lastAt = now;
      store.totals.lands += 1;
      break;
    }
    case 'claim': {
      if (!inviteCode) break;
      const inviter = ensureNode(store, inviteCode);
      inviter.claimsIn += 1;
      inviter.lastAt = now;
      store.totals.claims += 1;
      if (actorCode && actorCode !== inviteCode) {
        ensureNode(store, actorCode).lastAt = now;
        store.edges.push({ from: inviteCode, to: actorCode, at: now, kind: 'claim' });
        store.totals.connections = countUniqueConnections(store);
      }
      break;
    }
    case 'spread': {
      const code = actorCode || inviteCode;
      if (!code) break;
      const n = ensureNode(store, code);
      n.spreads += 1;
      n.lastAt = now;
      store.totals.spreads += 1;
      break;
    }
    case 'spark': {
      const code = actorCode || inviteCode;
      if (!code) break;
      const n = ensureNode(store, code);
      n.sparks += 1;
      n.lastAt = now;
      store.totals.sparks += 1;
      break;
    }
    case 'return': {
      store.totals.returns += 1;
      if (actorCode) ensureNode(store, actorCode).lastAt = now;
      break;
    }
    default: {
      const _never: never = type;
      void _never;
    }
  }

  store.seen.push(id);
  if (store.seen.length > MAX_SEEN) store.seen = store.seen.slice(-MAX_SEEN);
  if (store.edges.length > MAX_EDGES) store.edges = store.edges.slice(-MAX_EDGES);

  await saveStore(store);
  return { ok: true, pulse: toPulse(store) };
}

function countUniqueConnections(store: GrowthStore): number {
  const pairs = new Set(store.edges.map((e) => `${e.from}->${e.to}`));
  return pairs.size;
}

function toPulse(store: GrowthStore): GrowthPulse {
  return {
    lands: store.totals.lands,
    claims: store.totals.claims,
    spreads: store.totals.spreads,
    sparks: store.totals.sparks,
    returns: store.totals.returns,
    connections: store.totals.connections || countUniqueConnections(store),
    nodes: Object.keys(store.nodes).length,
    recent: store.edges
      .slice(-12)
      .reverse()
      .map((e) => ({ from: e.from, to: e.to, kind: e.kind, at: e.at })),
  };
}

export async function getGrowthPulse(): Promise<GrowthPulse> {
  const store = await loadStore();
  return toPulse(store);
}

export async function getMemberGrowthStats(codeRaw: string): Promise<GrowthMemberStats | null> {
  const code = normalizeCode(codeRaw);
  if (!code) return null;
  const store = await loadStore();
  const node = store.nodes[code] || {
    code,
    spreads: 0,
    landsIn: 0,
    claimsIn: 0,
    sparks: 0,
    lastAt: '',
  };
  const connections = store.edges.filter((e) => e.from === code).length;
  const network = toPulse(store);
  return {
    code,
    connections,
    landsIn: node.landsIn,
    claimsIn: node.claimsIn,
    spreads: node.spreads,
    sparks: node.sparks,
    network,
    loop: {
      discovered: node.landsIn > 0 || connections > 0 || node.spreads > 0,
      claimed: node.claimsIn > 0 || connections > 0,
      sparked: node.sparks > 0,
      spread: node.spreads > 0,
      /** Someone you invited claimed — a connection edge exists */
      returned: connections > 0,
    },
  };
}
