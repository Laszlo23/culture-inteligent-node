/**
 * Attention share prompt — pick one incomplete social-spread task for a modal.
 * Cooldown so it motivates without nagging.
 */

import type { CastTemplateId } from './farcaster';
import {
  DISCORD_PIN_COPY,
  TELEGRAM_PIN_COPY,
  markRainTask,
  readRainProgress,
  type RainTaskId,
} from './rain-checklist';
import { CULTURE_BROADCAST } from './culture-broadcast';
import { SLOGANS } from './brand-slogans';

export const ATTENTION_SHARE_PROMPT_KEY = 'culture_attention_share_prompt_v1';

/** Min hours between popups after dismiss / complete */
export const ATTENTION_SHARE_COOLDOWN_HOURS = 6;

export type AttentionShareAction =
  | 'farcaster_cast'
  | 'copy_discord'
  | 'copy_telegram'
  | 'native_share'
  | 'hearing_share';

export type AttentionShareTask = {
  id: string;
  /** Ties into rain checklist when completed */
  rainTaskId?: RainTaskId;
  action: AttentionShareAction;
  castTemplateId?: CastTemplateId;
  title: string;
  body: string;
  cta: string;
  channelLabel: string;
  /** Prebuilt copy for clipboard / share */
  shareText?: string;
};

const TASK_POOL: AttentionShareTask[] = [
  {
    id: 'cast_rain',
    rainTaskId: 'cast_rain',
    action: 'farcaster_cast',
    castTemplateId: 'rain',
    title: 'Cast “Make it rain”',
    body: 'One Farcaster cast. Hear → Spark → Zen → Spread — put the loop in the feed.',
    cta: 'Open Farcaster compose',
    channelLabel: 'Farcaster',
  },
  {
    id: 'cast_hearing',
    rainTaskId: 'cast_hearing',
    action: 'farcaster_cast',
    castTemplateId: 'hearing',
    title: 'Share Hearing Mode',
    body: 'Ears-first Proof of Attention. Invite someone who scrolls too hard.',
    cta: 'Cast Hearing Mode',
    channelLabel: 'Farcaster',
  },
  {
    id: 'spread_club',
    rainTaskId: 'cast_rain',
    action: 'farcaster_cast',
    castTemplateId: 'spread_club',
    title: 'Spread the club',
    body: SLOGANS.spread,
    cta: 'Cast your invite energy',
    channelLabel: 'Farcaster',
  },
  {
    id: 'pin_discord',
    rainTaskId: 'pin_discord',
    action: 'copy_discord',
    title: 'Drop a Discord pin',
    body: 'Copy the #welcome pin — Passport, Hearing, and /spark in one paste.',
    cta: 'Copy Discord pin',
    channelLabel: 'Discord',
    shareText: DISCORD_PIN_COPY,
  },
  {
    id: 'pin_telegram',
    rainTaskId: 'pin_telegram',
    action: 'copy_telegram',
    title: 'Pulse Telegram',
    body: 'Pin the weekly Hearing reminder where your builders already chat.',
    cta: 'Copy Telegram pin',
    channelLabel: 'Telegram',
    shareText: TELEGRAM_PIN_COPY,
  },
  {
    id: 'native_broadcast',
    rainTaskId: 'dm_ten',
    action: 'native_share',
    title: 'Share the Human Economy',
    body: `${SLOGANS.hero} One post. X, Messages, or anywhere — reputation compounds when you lift others.`,
    cta: 'Share post',
    channelLabel: 'Share sheet',
    shareText: CULTURE_BROADCAST.sharePost,
  },
  {
    id: 'hearing_link',
    rainTaskId: 'cast_hearing',
    action: 'hearing_share',
    title: 'Pass the Hearing link',
    body: CULTURE_BROADCAST.hearingBanner,
    cta: 'Share Hearing link',
    channelLabel: 'Hearing',
    shareText: CULTURE_BROADCAST.hearingSharePost,
  },
];

type PromptState = {
  lastShownAt: number;
  lastTaskId: string | null;
  snoozedUntil: number;
};

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readState(): PromptState {
  try {
    const raw = storage()?.getItem(ATTENTION_SHARE_PROMPT_KEY);
    if (!raw) {
      return { lastShownAt: 0, lastTaskId: null, snoozedUntil: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<PromptState>;
    return {
      lastShownAt: Number(parsed.lastShownAt) || 0,
      lastTaskId: typeof parsed.lastTaskId === 'string' ? parsed.lastTaskId : null,
      snoozedUntil: Number(parsed.snoozedUntil) || 0,
    };
  } catch {
    return { lastShownAt: 0, lastTaskId: null, snoozedUntil: 0 };
  }
}

function writeState(next: PromptState): void {
  try {
    storage()?.setItem(ATTENTION_SHARE_PROMPT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function isAttentionSharePromptReady(now = Date.now()): boolean {
  const s = readState();
  if (s.snoozedUntil > now) return false;
  const cooldownMs = ATTENTION_SHARE_COOLDOWN_HOURS * 60 * 60 * 1000;
  if (s.lastShownAt > 0 && now - s.lastShownAt < cooldownMs) return false;
  return true;
}

/** Prefer incomplete rain-linked tasks; rotate away from the last shown id. */
export function pickAttentionShareTask(now = Date.now()): AttentionShareTask | null {
  if (!isAttentionSharePromptReady(now)) return null;

  const progress = readRainProgress();
  const state = readState();
  const incomplete = TASK_POOL.filter((t) => {
    if (!t.rainTaskId) return true;
    return !progress[t.rainTaskId];
  });
  const pool = incomplete.length > 0 ? incomplete : TASK_POOL;
  const day = Math.floor(now / 86_400_000);
  let idx = (day + pool.length) % pool.length;
  if (pool.length > 1 && pool[idx].id === state.lastTaskId) {
    idx = (idx + 1) % pool.length;
  }
  return pool[idx] ?? null;
}

export function markAttentionShareShown(taskId: string, now = Date.now()): void {
  const s = readState();
  writeState({
    ...s,
    lastShownAt: now,
    lastTaskId: taskId,
  });
}

export function snoozeAttentionSharePrompt(
  hours = ATTENTION_SHARE_COOLDOWN_HOURS,
  now = Date.now()
): void {
  const s = readState();
  writeState({
    ...s,
    lastShownAt: now,
    snoozedUntil: now + hours * 60 * 60 * 1000,
  });
}

export function completeAttentionShareTask(task: AttentionShareTask): void {
  if (task.rainTaskId) {
    markRainTask(task.rainTaskId, true);
  }
  snoozeAttentionSharePrompt(ATTENTION_SHARE_COOLDOWN_HOURS);
}

export function listAttentionShareTasks(): AttentionShareTask[] {
  return [...TASK_POOL];
}
