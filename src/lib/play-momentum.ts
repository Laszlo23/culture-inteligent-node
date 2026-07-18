/**
 * Long-session reward cadence — milestones for playing around a while.
 * Resets after idle gap so each sitting feels like a fresh climb.
 */

export type MomentumBeat =
  | 'academy'
  | 'mount'
  | 'claim'
  | 'explore'
  | 'mission'
  | 'swap'
  | 'generic';

export type MomentumMilestone = {
  at: number;
  id: string;
  label: string;
  bcc: number;
  energy: number;
};

export const MOMENTUM_MILESTONES: MomentumMilestone[] = [
  { at: 3, id: 'warm', label: 'MOMENTUM ×3 · Node warming', bcc: 15, energy: 0 },
  { at: 5, id: 'flow', label: 'MOMENTUM ×5 · Flow state', bcc: 30, energy: 5 },
  { at: 8, id: 'deep', label: 'MOMENTUM ×8 · Deep session', bcc: 60, energy: 8 },
  { at: 12, id: 'duality', label: 'MOMENTUM ×12 · Duality locked', bcc: 120, energy: 12 },
];

const IDLE_MS = 45 * 60 * 1000;
const STORAGE_KEY = 'culture_play_momentum_v1';

type Persisted = {
  beats: number;
  claimed: string[];
  lastBeatAt: number;
};

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { beats: 0, claimed: [], lastBeatAt: 0 };
    const p = JSON.parse(raw) as Persisted;
    return {
      beats: Math.max(0, Number(p.beats) || 0),
      claimed: Array.isArray(p.claimed) ? p.claimed : [],
      lastBeatAt: Number(p.lastBeatAt) || 0,
    };
  } catch {
    return { beats: 0, claimed: [], lastBeatAt: 0 };
  }
}

function save(p: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function classifySuccessBeat(message: string): MomentumBeat {
  const m = message.toUpperCase();
  if (m.includes('ACADEMY') || m.includes('NEURAL') || m.includes('PROOF ACCEPTED') || m.includes('CONFIDENTIAL PASS')) {
    return 'academy';
  }
  if (m.includes('HARDWARE DEPLOYED') || m.includes('MOUNT') || m.includes('FORGE SOLDER')) {
    return 'mount';
  }
  if (m.includes('CLAIM') || m.includes('CLAIM_DAILY') || m.includes('ATTEST')) {
    return 'claim';
  }
  if (m.includes('MISSION') || m.includes('WHEEL') || m.includes('SPIN')) {
    return 'mission';
  }
  if (m.includes('DUALITY') || m.includes('SWAP') || m.includes('CRYSTALL')) {
    return 'swap';
  }
  if (m.includes('FACILITY EXPANDED') || m.includes('UPGRADE COMPLETE') || m.includes('ENTER')) {
    return 'explore';
  }
  return 'generic';
}

export type MomentumTickResult = {
  beats: number;
  milestone: MomentumMilestone | null;
  nextAt: number | null;
  progressToNext: number;
};

export function tickMomentum(_beat: MomentumBeat): MomentumTickResult {
  const now = Date.now();
  let p = load();
  if (p.lastBeatAt && now - p.lastBeatAt > IDLE_MS) {
    p = { beats: 0, claimed: [], lastBeatAt: 0 };
  }
  p.beats += 1;
  p.lastBeatAt = now;

  let milestone: MomentumMilestone | null = null;
  for (const m of MOMENTUM_MILESTONES) {
    if (p.beats >= m.at && !p.claimed.includes(m.id)) {
      p.claimed.push(m.id);
      milestone = m;
      break; // one milestone per tick
    }
  }
  save(p);

  const next = MOMENTUM_MILESTONES.find((m) => !p.claimed.includes(m.id) && m.at > p.beats);
  const prevAt = [...MOMENTUM_MILESTONES].reverse().find((m) => m.at <= p.beats)?.at ?? 0;
  const span = next ? next.at - prevAt : 1;
  const progressToNext = next ? (p.beats - prevAt) / span : 1;

  return {
    beats: p.beats,
    milestone,
    nextAt: next?.at ?? null,
    progressToNext: Math.max(0, Math.min(1, progressToNext)),
  };
}

export function peekMomentum(): MomentumTickResult {
  const p = load();
  const now = Date.now();
  const beats = p.lastBeatAt && now - p.lastBeatAt > IDLE_MS ? 0 : p.beats;
  const claimed = p.lastBeatAt && now - p.lastBeatAt > IDLE_MS ? [] : p.claimed;
  const next = MOMENTUM_MILESTONES.find((m) => !claimed.includes(m.id) && m.at > beats);
  const prevAt = [...MOMENTUM_MILESTONES].reverse().find((m) => m.at <= beats)?.at ?? 0;
  const span = next ? next.at - prevAt : 1;
  return {
    beats,
    milestone: null,
    nextAt: next?.at ?? null,
    progressToNext: next ? Math.max(0, Math.min(1, (beats - prevAt) / span)) : 1,
  };
}
