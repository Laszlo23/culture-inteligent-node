/**
 * Founder "make it rain" checklist — local progress for the weekly ritual.
 */

export const RAIN_CHECKLIST_KEY = 'culture_rain_checklist_v1';

export type RainTaskId =
  | 'cast_rain'
  | 'cast_hearing'
  | 'pin_discord'
  | 'pin_telegram'
  | 'dm_ten'
  | 'partner_outreach'
  | 'hearing_live';

export type RainTask = {
  id: RainTaskId;
  label: string;
  hint: string;
};

export const RAIN_TASKS: RainTask[] = [
  {
    id: 'cast_rain',
    label: 'Cast “Make it rain”',
    hint: 'Farcaster · /builders /base',
  },
  {
    id: 'cast_hearing',
    label: 'Cast Hearing Mode',
    hint: 'Ears-first demo link',
  },
  {
    id: 'pin_discord',
    label: 'Pin Discord #welcome',
    hint: 'Hearing + /spark + Passport',
  },
  {
    id: 'pin_telegram',
    label: 'Pin Telegram pulse',
    hint: 'Weekly Hearing reminder',
  },
  {
    id: 'dm_ten',
    label: 'DM 10 trusted people',
    hint: 'Invite + Passport script',
  },
  {
    id: 'partner_outreach',
    label: 'Partner pilot outreach',
    hint: 'One Attention Session ask',
  },
  {
    id: 'hearing_live',
    label: 'Host Community Hearing',
    hint: '30 min · Spark → Zen → Spread',
  },
];

export type RainProgress = Record<RainTaskId, boolean>;

function empty(): RainProgress {
  return {
    cast_rain: false,
    cast_hearing: false,
    pin_discord: false,
    pin_telegram: false,
    dm_ten: false,
    partner_outreach: false,
    hearing_live: false,
  };
}

export function readRainProgress(): RainProgress {
  try {
    const raw = localStorage.getItem(RAIN_CHECKLIST_KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Partial<RainProgress>) };
  } catch {
    return empty();
  }
}

export function writeRainProgress(next: RainProgress): void {
  try {
    localStorage.setItem(RAIN_CHECKLIST_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function toggleRainTask(id: RainTaskId): RainProgress {
  const cur = readRainProgress();
  const next = { ...cur, [id]: !cur[id] };
  writeRainProgress(next);
  return next;
}

export function markRainTask(id: RainTaskId, done = true): RainProgress {
  const cur = readRainProgress();
  const next = { ...cur, [id]: done };
  writeRainProgress(next);
  return next;
}

export function rainDoneCount(p: RainProgress): number {
  return RAIN_TASKS.filter((t) => p[t.id]).length;
}

export const DISCORD_PIN_COPY = [
  '**Building Culture · Discord HQ**',
  '',
  '1. Claim Human Passport → https://mining.buildingcultureid.space/?room=passport',
  '2. Hearing Mode (ears first) → https://mining.buildingcultureid.space/?hear=1',
  '3. In chat: `/spark` · `/claim` · `/hear` (Attention Miner)',
  '4. Faction houses: enlist in-app → meet here',
  '',
  'Free First Spark forever. Knowledge first. Then decide.',
].join('\n');

export const TELEGRAM_PIN_COPY = [
  'Building Culture · weekly pulse',
  '',
  'Hearing Mode: https://mining.buildingcultureid.space/?hear=1',
  'Say Help → Academy → First Spark → Zen → Spread.',
  '',
  'Invite a builder. Own your Human Passport.',
  'https://mining.buildingcultureid.space/?fc=1',
].join('\n');
