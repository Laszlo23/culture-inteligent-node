/**
 * Hearing Mode narration — warm, easy-going, sympathetic guide voice.
 * Phrases use periods / em dashes so TTS can breathe between thoughts.
 */

import { BRAND, SLOGANS } from '../brand-slogans';
import { CLUB_RULES } from '../club-oath';
import { CULTURE_BROADCAST, HEARING_MODE_URL } from '../culture-broadcast';
import { isZenMode, zenHelpLine } from '../zen-duality';

export const HEARING_URL = HEARING_MODE_URL;

export function welcomeScript(): string {
  const zen = isZenMode();
  return [
    `Welcome. This is ${BRAND.product} Hearing Mode.`,
    'You can soften your eyes — I am right here with you.',
    'Take one easy breath. This is a listening space.',
    zen
      ? 'Zen is already on — knowledge first, no rush. When you are ready, say Academy. Or say Help, and I will walk you through gently.'
      : 'When you feel ready, say Academy for First Spark. Or say Help, and I will walk you through gently.',
  ].join(' ');
}

export function helpScript(): string {
  return [
    'Here is what you can say — slowly is perfect.',
    'Status — hear your attention fuel and where you are.',
    'Academy, or First Spark — a short Proof of Attention. About two minutes.',
    'Passport — claim your Human Passport. Reputation you own.',
    'Spread — copy a kind invite for someone who needs the light.',
    'Broadcast — copy the campaign post.',
    'Map — return to the facility.',
    zenHelpLine(),
    'Focus — soften the screen so attention can settle.',
    'Metrics — a gentle seven-day snapshot of your attention.',
    'Hook Mirror — after First Spark, name why the scroll pulls you back.',
    'At the Zen break: say Mind to hold what you learned, or Machine to convert it into fuel.',
    'Repeat — hear my last words again.',
    'Stop — I will go quiet.',
    'Exit hearing — leave this listening space.',
    'In Academy quizzes, say one, two, or three. There is no hurry.',
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
    ? 'First Spark is still waiting for you — whenever you are ready. Say Academy to begin.'
    : 'First Spark is complete. Your attention was proved. Well done.';
  return [
    `${BRAND.product}. A soft status check.`,
    SLOGANS.attention,
    `Knowledge fuel sits at ${Math.round(opts.energy)} percent.`,
    `Node output is ${opts.miningPower.toFixed(1)} petahash.`,
    `Wallet holds ${opts.credits} Building Culture Coins.`,
    `You are on the ${roomLabel}.`,
    ritual,
  ].join(' ');
}

export function clubScript(): string {
  const rules = CLUB_RULES.map((r) => `Rule ${r.n}. ${r.line}`).join(' ');
  return [
    `${BRAND.ritual}. ${SLOGANS.firstNight}`,
    'Listen for the spirit of each rule — not just the words.',
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
    return 'Hearing Mode needs a browser that can speak and listen. Try Chrome, Edge, or Safari when you can. The visual facility is still here for you.';
  }
  if (!support.tts) {
    return 'I cannot speak in this browser yet. You can still use the visual facility — nothing is lost.';
  }
  return 'I can speak, but this browser cannot hear the mic. Stay with the narration, and use the on-screen controls when you need to move.';
}

export function unknownCommandScript(): string {
  return 'I did not quite catch that — no worry. Say Help, and I will list the gentle commands again.';
}

export function academyOpenScript(): string {
  return [
    'Opening Attention Academy.',
    'We are here for attention — yours, given kindly.',
    'First Spark proves it. Hook is Mind — knowledge first. Insight is Machine.',
    'When you reach the Zen break, say Mind to hold what landed, or Machine to convert attention into fuel.',
    'On quizzes, say one, two, or three. Say start when a timer is waiting.',
    'I will stay with you.',
  ].join(' ');
}

export function spreadDoneScript(first: boolean): string {
  return first
    ? 'Your invite is copied. Pass a little light to someone who needs the hook. That is enough for now.'
    : 'Invite copied. Love and knowledge are on the move. Beautiful.';
}

export function broadcastCopiedScript(): string {
  return 'Broadcast post copied. Paste it where your people gather. The Hearing Mode link is included.';
}

export function exitScript(): string {
  return 'Hearing Mode off. Thank you for listening. Your thumbs are welcome back whenever you want them. Take care.';
}

export function hearingBannerLine(): string {
  return CULTURE_BROADCAST.hearingBanner;
}
