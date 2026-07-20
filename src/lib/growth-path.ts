/**
 * Soft growth paths — personal hook → curious / reflective / balanced.
 * Biases prompts + Academy order; never locks passport identity.
 */

import { track } from './attention-metrics';

export const GROWTH_PATH_KEY = 'culture_growth_path_v1';

export type GrowthPathId = 'curious' | 'reflective' | 'balanced';

export type SessionLane = 'science' | 'reflection' | 'both';

export type PersonalHook = {
  id: string;
  pathId: GrowthPathId;
  title: string;
  sub: string;
  mood: 'opening' | 'problem' | 'awakening' | 'spark' | 'evolution' | 'facility';
};

export const PERSONAL_HOOKS: PersonalHook[] = [
  {
    id: 'mind',
    pathId: 'curious',
    title: 'I want to understand how my mind works',
    sub: 'Science-first — how the brain learns, lies, and rewires.',
    mood: 'spark',
  },
  {
    id: 'notice',
    pathId: 'reflective',
    title: 'I want to notice why I stay — and get clearer',
    sub: 'Inner work first — hooks, breath, and honest noticing.',
    mood: 'awakening',
  },
  {
    id: 'both',
    pathId: 'balanced',
    title: 'Both — keep me honest',
    sub: 'Science and reflection interleaved. No single lane.',
    mood: 'facility',
  },
];

export const PATH_LABELS: Record<GrowthPathId, string> = {
  curious: 'Curious path',
  reflective: 'Reflective path',
  balanced: 'Both paths',
};

export const PATH_LOOP_WHISPER: Record<GrowthPathId, string> = {
  curious: 'Next: how your brain rewires.',
  reflective: 'Next: name the hook that keeps you.',
  balanced: 'Next: learn, prove, then spread.',
};

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function isGrowthPathId(v: unknown): v is GrowthPathId {
  return v === 'curious' || v === 'reflective' || v === 'balanced';
}

export function readGrowthPath(): GrowthPathId | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(GROWTH_PATH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { path?: string };
    return isGrowthPathId(parsed.path) ? parsed.path : null;
  } catch {
    return null;
  }
}

export function writeGrowthPath(path: GrowthPathId): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(GROWTH_PATH_KEY, JSON.stringify({ path, at: Date.now() }));
    track('growth_path_set', { path });
  } catch {
    // ignore
  }
}

export function clearGrowthPath(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(GROWTH_PATH_KEY);
  } catch {
    // ignore
  }
}

type LaneSession = {
  id: string;
  seriesOrder: number;
  lane?: SessionLane;
};

/** Priority for sorting cores (lower first). First Spark handled separately. */
function lanePriority(lane: SessionLane | undefined, path: GrowthPathId): number {
  const l = lane ?? 'both';
  if (path === 'balanced') return 0;
  if (path === 'curious') {
    if (l === 'science') return 0;
    if (l === 'both') return 1;
    return 2;
  }
  // reflective
  if (l === 'reflection') return 0;
  if (l === 'both') return 1;
  return 2;
}

/**
 * Reorder sessions by growth path. Does not drop sessions.
 * Keeps First Spark (`seriesOrder` 0 / id ai_first_spark) at the front when present.
 */
export function orderCoreSessions<T extends LaneSession>(
  sessions: T[],
  path: GrowthPathId | null | undefined
): T[] {
  const effective: GrowthPathId = path && isGrowthPathId(path) ? path : 'balanced';
  const spark = sessions.filter((s) => s.id === 'ai_first_spark' || s.seriesOrder === 0);
  const rest = sessions.filter((s) => s.id !== 'ai_first_spark' && s.seriesOrder !== 0);

  const sorted = [...rest].sort((a, b) => {
    const pa = lanePriority(a.lane, effective);
    const pb = lanePriority(b.lane, effective);
    if (pa !== pb) return pa - pb;
    return a.seriesOrder - b.seriesOrder;
  });

  // Preserve spark order among spark-like (First Spark only typically)
  const sparkSorted = [...spark].sort((a, b) => a.seriesOrder - b.seriesOrder);
  return [...sparkSorted, ...sorted];
}
