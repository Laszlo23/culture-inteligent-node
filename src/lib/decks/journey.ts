import { JOURNEY_STEPS } from '../human-economy';
import type { DeckSlide } from './types';

const MOODS = ['opening', 'spark', 'facility', 'evolution', 'awakening'] as const;

/** Discover → Spark → Build → Share → Reputation as deck slides. */
export const JOURNEY_DECK: DeckSlide[] = JOURNEY_STEPS.map((step, i) => ({
  id: step.id,
  eyebrow: `Journey · ${String(i + 1).padStart(2, '0')}`,
  title: step.title,
  body: step.line,
  mood: MOODS[i] ?? 'facility',
}));
