/**
 * Player XP + Level — the proud identity number ("I'm Level 37").
 * Soft early curve (L1–10), then Clash-like climb.
 */

const STORAGE_KEY = 'culture_player_progress_v1';

export type PlayerMoments = {
  firstXp: boolean;
  firstSpark: boolean;
  firstLevelUp: boolean;
  firstInvite: boolean;
  firstStreak: boolean;
};

export type PlayerProgress = {
  totalXp: number;
  moments: PlayerMoments;
};

const DEFAULT_MOMENTS: PlayerMoments = {
  firstXp: false,
  firstSpark: false,
  firstLevelUp: false,
  firstInvite: false,
  firstStreak: false,
};

export type LevelSnapshot = {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNext: number;
  pct: number;
};

/** XP required to advance from `level` → `level + 1`. */
export function xpToAdvance(level: number): number {
  const L = Math.max(1, Math.floor(level));
  if (L < 10) return 20 + L * 8;
  return 80 + (L - 10) * 25;
}

/** Cumulative XP required to *reach* a level (level 1 = 0). */
export function xpForLevel(level: number): number {
  const L = Math.max(1, Math.floor(level));
  let total = 0;
  for (let i = 1; i < L; i++) total += xpToAdvance(i);
  return total;
}

export function levelFromXp(totalXp: number): number {
  let xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xp >= xpToAdvance(level) && level < 999) {
    xp -= xpToAdvance(level);
    level += 1;
  }
  return level;
}

export function snapshotFromXp(totalXp: number): LevelSnapshot {
  const xp = Math.max(0, Math.floor(totalXp));
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const xpIntoLevel = xp - floor;
  const xpForNext = xpToAdvance(level);
  const pct = xpForNext > 0 ? Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100)) : 100;
  return { level, totalXp: xp, xpIntoLevel, xpForNext, pct };
}

let memCache: PlayerProgress | null = null;

function loadRaw(): PlayerProgress {
  if (memCache) return memCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memCache = { totalXp: 0, moments: { ...DEFAULT_MOMENTS } };
      return memCache;
    }
    const p = JSON.parse(raw) as Partial<PlayerProgress>;
    memCache = {
      totalXp: Math.max(0, Math.floor(Number(p.totalXp) || 0)),
      moments: { ...DEFAULT_MOMENTS, ...(p.moments || {}) },
    };
    return memCache;
  } catch {
    memCache = { totalXp: 0, moments: { ...DEFAULT_MOMENTS } };
    return memCache;
  }
}

function save(p: PlayerProgress) {
  memCache = p;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function readPlayerProgress(): PlayerProgress {
  return loadRaw();
}

export function readLevelSnapshot(): LevelSnapshot {
  return snapshotFromXp(loadRaw().totalXp);
}

export type GrantXpResult = {
  totalXp: number;
  previousLevel: number;
  level: number;
  leveledUp: boolean;
  granted: number;
  isFirstXp: boolean;
  snapshot: LevelSnapshot;
};

export function grantXp(amount: number): GrantXpResult {
  const granted = Math.max(0, Math.floor(amount));
  const prev = loadRaw();
  const previousLevel = levelFromXp(prev.totalXp);
  const isFirstXp = !prev.moments.firstXp && granted > 0;
  const totalXp = prev.totalXp + granted;
  const level = levelFromXp(totalXp);
  const leveledUp = level > previousLevel;
  const next: PlayerProgress = {
    totalXp,
    moments: {
      ...prev.moments,
      firstXp: prev.moments.firstXp || granted > 0,
      firstLevelUp: prev.moments.firstLevelUp || leveledUp,
    },
  };
  save(next);
  return {
    totalXp,
    previousLevel,
    level,
    leveledUp,
    granted,
    isFirstXp,
    snapshot: snapshotFromXp(totalXp),
  };
}

export function markMoment(key: keyof PlayerMoments): boolean {
  const prev = loadRaw();
  if (prev.moments[key]) return false;
  save({
    ...prev,
    moments: { ...prev.moments, [key]: true },
  });
  return true;
}

export function hasMoment(key: keyof PlayerMoments): boolean {
  return loadRaw().moments[key];
}

const listeners = new Set<() => void>();

export function subscribePlayerProgress(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyPlayerProgress() {
  listeners.forEach((fn) => fn());
}

/** grantXp + notify */
export function grantXpAndNotify(amount: number): GrantXpResult {
  const result = grantXp(amount);
  notifyPlayerProgress();
  return result;
}
