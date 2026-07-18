/**
 * Brand-safe Hearing Mode narration scripts.
 */

import { BRAND, SLOGANS } from '../brand-slogans';
import { CLUB_RULES } from '../club-oath';
import { CULTURE_BROADCAST, HEARING_MODE_URL } from '../culture-broadcast';
import { isZenMode, zenHelpLine } from '../zen-duality';

export const HEARING_URL = HEARING_MODE_URL;

export function welcomeScript(): string {
  const zen = isZenMode();
  return [
    `${BRAND.product}. Hearing on — just for you.`,
    zen
      ? 'Zen is on. Knowledge first. Say Academy, or Help.'
      : 'Eyes optional. Say Academy for First Spark, or Help for commands.',
  ].join(' ');
}

export function helpScript(): string {
  return [
    'Commands:',
    'Status — attention fuel and node.',
    'Academy or First Spark — prove attention (~2 min).',
    'Club — Culture Club oath — we are here for attention.',
    'Spread — copy your invite.',
    'Broadcast — copy the campaign post.',
    'Map — back to the facility.',
    zenHelpLine(),
    'Focus — dim the facility for full attention.',
    'Metrics — hear your seven-day attention snapshot.',
    'Hook Mirror — after First Spark, name why you scroll again.',
    'At the Zen break: Mind to hold knowledge, Machine to convert to fuel.',
    'Repeat — hear the last line again.',
    'Stop — silence speech.',
    'Exit hearing — leave Hearing Mode.',
    'In Academy quizzes, say one, two, or three for an answer.',
  ].join(' ');
}

export function statusScript(opts: {
  energy: number;
  miningPower: number;
  credits: number;
  room: string;
  firstRitualPending: boolean;
}): string {
  const roomLabel = opts.room === 'map' ? 'facility map' : opts.room;
  const ritual = opts.firstRitualPending
    ? 'First Spark still waiting — prove attention. Say Academy to begin.'
    : 'First Spark complete. Attention proved.';
  return [
    `${BRAND.product} status. ${SLOGANS.attention}`,
    `Knowledge fuel ${Math.round(opts.energy)} percent.`,
    `Node output ${opts.miningPower.toFixed(1)} petahash.`,
    `Wallet ${opts.credits} Building Culture Coins.`,
    `You are on the ${roomLabel}.`,
    ritual,
  ].join(' ');
}

export function clubScript(): string {
  const rules = CLUB_RULES.map((r) => `Rule ${r.n}. ${r.line}`).join(' ');
  return [
    `${BRAND.ritual}. ${SLOGANS.firstNight}`,
    rules,
    SLOGANS.spread,
  ].join(' ');
}

export function broadcastScript(): string {
  return [
    CULTURE_BROADCAST.sloganLoud,
    CULTURE_BROADCAST.notificationBody,
    `Share link: ${HEARING_URL}`,
  ].join(' ');
}

export function unsupportedScript(support: { tts: boolean; stt: boolean }): string {
  if (!support.tts && !support.stt) {
    return 'Hearing Mode needs a browser with speech synthesis and recognition. Try Chrome, Edge, or Safari.';
  }
  if (!support.tts) {
    return 'Text to speech is unavailable here. You can still use the visual facility.';
  }
  return 'Microphone speech recognition is unavailable. You can still hear narration — use on-screen controls for navigation.';
}

export function unknownCommandScript(): string {
  return 'I did not catch that. Say help for commands.';
}

export function academyOpenScript(): string {
  return 'Opening Attention Academy. We are here for attention. First Spark proves it. Hook is Mind — knowledge first. Insight is Machine. When ready, Zen: say Mind to hold, or Machine to convert to fuel. Say one, two, or three on quiz options. Say start for timers.';
}

export function spreadDoneScript(first: boolean): string {
  return first
    ? 'Spread invite copied. Pass love and knowledge to someone who needs the hook.'
    : 'Spread invite copied. Love and knowledge on the move.';
}

export function broadcastCopiedScript(): string {
  return 'Broadcast post copied. Paste to X, Telegram, or Discord. Hearing Mode link included.';
}

export function exitScript(): string {
  return 'Hearing off. Thumbs are back whenever you want them.';
}

export function hearingBannerLine(): string {
  return CULTURE_BROADCAST.hearingBanner;
}
