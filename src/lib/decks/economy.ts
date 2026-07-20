import type { DeckSlide } from './types';

/** Protocol economy — InteractiveDeck slides (≤2 sentences each). */
export const ECONOMY_DECK: DeckSlide[] = [
  {
    id: 'bcc',
    eyebrow: '01 · Unit',
    title: 'What is BCC?',
    body: 'Building Culture Coin ($BCC) is the economic unit of the network — gas, weight, and coordination fuel.',
    mood: 'awakening',
  },
  {
    id: 'value',
    eyebrow: '02 · Backing',
    title: 'Why it has value',
    body: 'BCC is backed by verified human attention — focus logs and builder contributions, not empty print runs.',
    mood: 'problem',
  },
  {
    id: 'mine',
    eyebrow: '03 · Mining',
    title: 'What happens when you mine',
    body: 'Your node turns learning proofs into energy and reputation. Attention becomes fuel on Solana Devnet.',
    mood: 'spark',
  },
  {
    id: 'learn',
    eyebrow: '04 · Flow',
    title: 'Learn',
    body: 'Synthesize lessons in Attention Academy. Short sessions. Real understanding.',
    accent: 'Step one of the core loop.',
    mood: 'facility',
  },
  {
    id: 'energy',
    eyebrow: '05 · Flow',
    title: 'Generate attention energy',
    body: 'Keep the node warm with focus and Proof of Attention. Energy powers the facility.',
    mood: 'evolution',
  },
  {
    id: 'earn',
    eyebrow: '06 · Flow',
    title: 'Mine rewards',
    body: 'Verified attention unlocks $BCC and cognitive rewards — facility CP until SPL mint is live.',
    mood: 'spark',
  },
  {
    id: 'spend',
    eyebrow: '07 · Flow',
    title: 'Spend & spread',
    body: 'Fuel workers, bridges, and Culture Club invites. Spread love and knowledge — pull the next soul in.',
    mood: 'opening',
    ctaLabel: 'Enter protocol',
  },
];
