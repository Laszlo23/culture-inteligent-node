import type { DeckSlide } from './types';

/** Hear → Spark → Zen → Spread → Return — same beat as MainLoopStage rail. */
export const LOOP_DECK: DeckSlide[] = [
  {
    id: 'hear',
    eyebrow: 'Loop · 01 · Hear',
    title: 'Ears first.',
    body: 'Close your eyes. Follow the guide. Notice before you prove.',
    accent: 'Hearing Mode is the soft on-ramp into Proof of Attention.',
    mood: 'opening',
    ctaLabel: 'Open Hearing',
  },
  {
    id: 'spark',
    eyebrow: 'Loop · 02 · Spark',
    title: 'Prove attention once.',
    body: 'One short challenge. You notice. You understand. Your contribution becomes visible.',
    accent: 'First Spark turns potential into a passport score.',
    mood: 'spark',
    ctaLabel: 'Start Spark',
  },
  {
    id: 'zen',
    eyebrow: 'Loop · 03 · Zen',
    title: 'Knowledge first. Then decide.',
    body: 'Mind keeps the learning. Machine crystallizes fuel. Either way — you choose on purpose.',
    accent: 'Zen breaks the infinite-scroll study loop.',
    mood: 'awakening',
    ctaLabel: 'Open Zen',
  },
  {
    id: 'spread',
    eyebrow: 'Loop · 04 · Spread',
    title: 'Pass the invite.',
    body: 'Awareness compounds when you share it. Copy your invite — love travels.',
    accent: 'Spread is how the network grows without ads.',
    mood: 'evolution',
    ctaLabel: 'Copy invite',
  },
  {
    id: 'return',
    eyebrow: 'Loop · 05 · Return',
    title: 'Claim Impact. Prove again.',
    body: 'Come back. Claim today’s Impact. Keep the loop alive — passport scores grow with you.',
    accent: 'Return turns a one-time Spark into a habit.',
    mood: 'facility',
    ctaLabel: 'Claim / continue',
  },
];
