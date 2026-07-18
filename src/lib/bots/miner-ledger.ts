/**
 * File-backed Attention Miner ledger (Discord / Telegram).
 * Practice knowledge points + daily claim cooldown — not on-chain mint.
 */

import { promises as fs } from 'fs';
import path from 'path';

export type BotPlatform = 'discord' | 'telegram';

export type MinerPlayer = {
  platform: BotPlatform;
  userId: string;
  displayName?: string;
  knowledgePoints: number;
  sparks: number;
  correct: number;
  wrong: number;
  streak: number;
  lastClaimAt: number;
  lastSparkAt: number;
  pendingCardId?: string;
  pendingOptions?: [string, string, string];
  updatedAt: string;
};

type LedgerStore = {
  version: 1;
  players: Record<string, MinerPlayer>;
};

const CLAIM_COOLDOWN_MS = 20 * 60 * 60 * 1000;
const SPARK_COOLDOWN_MS = 45 * 1000;
const CLAIM_POINTS = 25;
const SPARK_CORRECT_POINTS = 15;

function key(platform: BotPlatform, userId: string): string {
  return `${platform}:${userId}`;
}

function dataPath(): string {
  return path.join(process.cwd(), 'data', 'attention-miner.json');
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(path.dirname(dataPath()), { recursive: true });
}

async function readStore(): Promise<LedgerStore> {
  try {
    const raw = await fs.readFile(dataPath(), 'utf8');
    const parsed = JSON.parse(raw) as LedgerStore;
    if (!parsed?.players) return { version: 1, players: {} };
    return parsed;
  } catch {
    return { version: 1, players: {} };
  }
}

async function writeStore(store: LedgerStore): Promise<void> {
  await ensureDir();
  await fs.writeFile(dataPath(), JSON.stringify(store, null, 2), 'utf8');
}

export async function getMinerPlayer(
  platform: BotPlatform,
  userId: string
): Promise<MinerPlayer> {
  const store = await readStore();
  const k = key(platform, userId);
  const existing = store.players[k];
  if (existing) return existing;
  const fresh: MinerPlayer = {
    platform,
    userId,
    knowledgePoints: 0,
    sparks: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    lastClaimAt: 0,
    lastSparkAt: 0,
    updatedAt: new Date().toISOString(),
  };
  store.players[k] = fresh;
  await writeStore(store);
  return fresh;
}

async function savePlayer(player: MinerPlayer): Promise<MinerPlayer> {
  const store = await readStore();
  player.updatedAt = new Date().toISOString();
  store.players[key(player.platform, player.userId)] = player;
  await writeStore(store);
  return player;
}

export async function setPendingSpark(
  platform: BotPlatform,
  userId: string,
  cardId: string,
  options: [string, string, string],
  displayName?: string
): Promise<{ player: MinerPlayer; cooldownSec?: number }> {
  const player = await getMinerPlayer(platform, userId);
  if (displayName) player.displayName = displayName;
  const since = Date.now() - player.lastSparkAt;
  if (player.lastSparkAt && since < SPARK_COOLDOWN_MS && !player.pendingCardId) {
    return {
      player,
      cooldownSec: Math.ceil((SPARK_COOLDOWN_MS - since) / 1000),
    };
  }
  player.pendingCardId = cardId;
  player.pendingOptions = options;
  player.lastSparkAt = Date.now();
  await savePlayer(player);
  return { player };
}

export async function clearPending(
  platform: BotPlatform,
  userId: string
): Promise<void> {
  const player = await getMinerPlayer(platform, userId);
  delete player.pendingCardId;
  delete player.pendingOptions;
  await savePlayer(player);
}

export async function gradeSparkAnswer(
  platform: BotPlatform,
  userId: string,
  cardId: string,
  correct: boolean
): Promise<MinerPlayer | null> {
  const player = await getMinerPlayer(platform, userId);
  if (player.pendingCardId !== cardId) return null;
  delete player.pendingCardId;
  delete player.pendingOptions;
  player.sparks += 1;
  if (correct) {
    player.correct += 1;
    player.knowledgePoints += SPARK_CORRECT_POINTS;
    player.streak += 1;
  } else {
    player.wrong += 1;
    player.streak = 0;
  }
  return savePlayer(player);
}

export async function claimDailyMiner(
  platform: BotPlatform,
  userId: string,
  displayName?: string
): Promise<
  | { ok: true; player: MinerPlayer; gained: number }
  | { ok: false; player: MinerPlayer; hoursLeft: number }
> {
  const player = await getMinerPlayer(platform, userId);
  if (displayName) player.displayName = displayName;
  const since = Date.now() - player.lastClaimAt;
  if (player.lastClaimAt && since < CLAIM_COOLDOWN_MS) {
    const hoursLeft = (CLAIM_COOLDOWN_MS - since) / (60 * 60 * 1000);
    return { ok: false, player, hoursLeft };
  }
  player.lastClaimAt = Date.now();
  player.knowledgePoints += CLAIM_POINTS;
  if (player.streak < 1) player.streak = 1;
  await savePlayer(player);
  return { ok: true, player, gained: CLAIM_POINTS };
}

export const MINER_REWARDS = {
  claimPoints: CLAIM_POINTS,
  sparkCorrectPoints: SPARK_CORRECT_POINTS,
  claimCooldownHours: 20,
} as const;
