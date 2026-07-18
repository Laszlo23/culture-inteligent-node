/**
 * Client growth loop — report events + fetch network pulse / my connections.
 */

import { normalizeInviteCode, readInvite } from './community-invite';
import { buildAttentionSnapshot, getAttentionEvents } from './attention-metrics';

export type GrowthEventType = 'land' | 'claim' | 'spread' | 'spark' | 'return';

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

export type LocalLoopProgress = {
  discovered: boolean;
  claimed: boolean;
  sparked: boolean;
  spread: boolean;
  returned: boolean;
  inviteLands: number;
  inviteClaims: number;
  inviteSpreads: number;
  spreads: number;
  sparks: number;
};

export function inviteCodeFromWallet(walletAddress: string | null | undefined): string | null {
  return normalizeInviteCode(walletAddress?.slice(0, 6));
}

export function buildLocalLoopProgress(): LocalLoopProgress {
  const events = getAttentionEvents();
  const snap = buildAttentionSnapshot(90);
  const inviteLands = events.filter((e) => e.name === 'invite_land').length;
  const inviteClaims = events.filter((e) => e.name === 'invite_claim').length;
  const inviteSpreads = events.filter((e) => e.name === 'invite_spread').length;
  const sparks = snap.firstSparkCompletes;
  const spreads = snap.spreads + inviteSpreads;
  return {
    discovered: inviteLands > 0 || Boolean(readInvite()?.code),
    claimed: inviteClaims > 0 || Boolean(readInvite()?.claimedAt),
    sparked: sparks > 0,
    spread: spreads > 0,
    returned: inviteClaims > 0 && spreads > 0,
    inviteLands,
    inviteClaims,
    inviteSpreads,
    spreads,
    sparks,
  };
}

export async function reportGrowthEvent(input: {
  type: GrowthEventType;
  inviteCode?: string | null;
  actorCode?: string | null;
  nonce?: string | null;
}): Promise<GrowthPulse | null> {
  try {
    const res = await fetch('/api/growth/event', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: input.type,
        inviteCode: input.inviteCode || undefined,
        actorCode: input.actorCode || undefined,
        nonce: input.nonce || undefined,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { pulse?: GrowthPulse };
    return data.pulse ?? null;
  } catch {
    return null;
  }
}

export async function fetchGrowthPulse(): Promise<GrowthPulse | null> {
  try {
    const res = await fetch('/api/growth/pulse', { credentials: 'same-origin' });
    if (!res.ok) return null;
    return (await res.json()) as GrowthPulse;
  } catch {
    return null;
  }
}

export async function fetchMyGrowthStats(code: string): Promise<GrowthMemberStats | null> {
  const c = normalizeInviteCode(code);
  if (!c) return null;
  try {
    const res = await fetch(`/api/growth/stats?code=${encodeURIComponent(c)}`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    return (await res.json()) as GrowthMemberStats;
  } catch {
    return null;
  }
}
