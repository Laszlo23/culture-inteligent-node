/**
 * Steam-grade achievement registry — unlock → celebrate → share.
 */

const STORAGE_KEY = 'culture_achievements_v1';

export type AchievementRarity = 'common' | 'rare' | 'legendary';

export type AchievementId =
  | 'first_xp'
  | 'first_spark'
  | 'first_level_up'
  | 'first_invite'
  | 'first_streak'
  | 'streak_3'
  | 'streak_7'
  | 'trap_id'
  | 'culture_name'
  | 'hook_mirror'
  | 'zen_mind'
  | 'zen_machine'
  | 'miner_pulse'
  | 'first_nft'
  | 'neural_snap'
  | 'outer_circuit';

export type AchievementDef = {
  id: AchievementId;
  title: string;
  blurb: string;
  rarity: AchievementRarity;
};

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  {
    id: 'first_xp',
    title: 'First Spark of XP',
    blurb: 'You earned. The climb begins.',
    rarity: 'common',
  },
  {
    id: 'first_spark',
    title: 'Proof Lit',
    blurb: 'First Proof of Attention sealed.',
    rarity: 'rare',
  },
  {
    id: 'first_level_up',
    title: 'Level Break',
    blurb: 'You became a higher version of yourself.',
    rarity: 'rare',
  },
  {
    id: 'first_invite',
    title: 'Signal Carrier',
    blurb: 'You brought someone into the loop.',
    rarity: 'rare',
  },
  {
    id: 'first_streak',
    title: 'Day One',
    blurb: 'You returned. Continuity is power.',
    rarity: 'common',
  },
  {
    id: 'streak_3',
    title: 'Triple Flame',
    blurb: 'Three days of showing up.',
    rarity: 'rare',
  },
  {
    id: 'streak_7',
    title: 'Week Keeper',
    blurb: 'Seven days. Identity is forming.',
    rarity: 'legendary',
  },
  {
    id: 'trap_id',
    title: 'Bait Named',
    blurb: 'You found your Scroll Trap ID.',
    rarity: 'rare',
  },
  {
    id: 'culture_name',
    title: 'Name Claimed',
    blurb: 'A .culture name is yours.',
    rarity: 'legendary',
  },
  {
    id: 'hook_mirror',
    title: 'Hook Mirror',
    blurb: 'You named what pulls you back.',
    rarity: 'rare',
  },
  {
    id: 'zen_mind',
    title: 'Mind Path',
    blurb: 'Knowledge held. Zen chose Mind.',
    rarity: 'common',
  },
  {
    id: 'zen_machine',
    title: 'Machine Path',
    blurb: 'Attention became fuel.',
    rarity: 'common',
  },
  {
    id: 'miner_pulse',
    title: 'Reactor Alive',
    blurb: 'Your Attention Reactor pulsed.',
    rarity: 'common',
  },
  {
    id: 'first_nft',
    title: 'First Collectible',
    blurb: 'Ownership began.',
    rarity: 'rare',
  },
  {
    id: 'neural_snap',
    title: 'Neural Snap',
    blurb: 'You proved it under pressure.',
    rarity: 'common',
  },
  {
    id: 'outer_circuit',
    title: 'Outer Circuit',
    blurb: 'A hidden chapter opened.',
    rarity: 'legendary',
  },
];

const BY_ID = Object.fromEntries(ACHIEVEMENT_CATALOG.map((a) => [a.id, a])) as Record<
  AchievementId,
  AchievementDef
>;

export function getAchievement(id: AchievementId): AchievementDef {
  return BY_ID[id];
}

function loadUnlocked(): AchievementId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    if (!Array.isArray(arr)) return [];
    return arr.filter((id): id is AchievementId => id in BY_ID);
  } catch {
    return [];
  }
}

function saveUnlocked(ids: AchievementId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* ignore */
  }
}

export function listUnlockedIds(): AchievementId[] {
  return loadUnlocked();
}

export function isAchievementUnlocked(id: AchievementId): boolean {
  return loadUnlocked().includes(id);
}

export type UnlockResult = {
  id: AchievementId;
  def: AchievementDef;
  newlyUnlocked: boolean;
};

export function unlockAchievement(id: AchievementId): UnlockResult {
  const def = BY_ID[id];
  const have = loadUnlocked();
  if (have.includes(id)) {
    return { id, def, newlyUnlocked: false };
  }
  saveUnlocked([...have, id]);
  return { id, def, newlyUnlocked: true };
}

export function achievementsForShare(limit = 3): string[] {
  const unlocked = loadUnlocked();
  return unlocked
    .slice(-limit)
    .map((id) => BY_ID[id]?.title)
    .filter(Boolean);
}

/** Locked teasers for anticipation UI */
export function lockedTeasers(limit = 3): AchievementDef[] {
  const have = new Set(loadUnlocked());
  return ACHIEVEMENT_CATALOG.filter((a) => !have.has(a.id)).slice(0, limit);
}
