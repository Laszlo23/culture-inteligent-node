import type { DeckSlide } from './types';

/** Landing explore — short presentation after cinematic story (not a FAQ scroll). */
export const EXPLORE_DECK: DeckSlide[] = [
  {
    id: 'problem',
    eyebrow: 'The problem',
    title: 'Why does attention have value?',
    body: 'AI can create content and code at scale — so human worth is no longer hours spent.',
    accent: 'The future measures learning, creativity, and contribution.',
    mood: 'problem',
  },
  {
    id: 'journey',
    eyebrow: 'The Human Economy',
    title: 'How you evolve',
    body: 'Discover → Spark → Build → Share → Reputation. Each step grows what you can prove.',
    mood: 'evolution',
  },
  {
    id: 'proofs',
    eyebrow: 'Proof of Attention',
    title: 'Short challenges, real proof',
    body: 'Not empty scrolling — knowledge, creativity, problem solving, and reflection leave a record.',
    mood: 'spark',
  },
  {
    id: 'passport',
    eyebrow: 'Human Passport',
    title: 'Scores start at zero',
    body: 'Knowledge, Builder, and Contribution begin empty so the journey is yours to write.',
    accent: 'Zero creates a journey.',
    mood: 'awakening',
    ctaLabel: 'Create Human Passport',
  },
];
