import type { DeckSlide } from './types';

/** Fair mining / PoA principles. */
export const FAIRNESS_DECK: DeckSlide[] = [
  {
    id: 'stance',
    eyebrow: 'Fair mining',
    title: 'Absolute Proof of Attention',
    body: 'No fake hash rates. No VC dump games. Value comes from verified attention — or it does not count.',
    mood: 'problem',
  },
  {
    id: 'onchain',
    eyebrow: 'Principle 1',
    title: 'On-chain activity proofs',
    body: 'KPI contribution on Solana Devnet, plus optional PoA memo after agent verify. Honest loop.',
    mood: 'facility',
  },
  {
    id: 'learning',
    eyebrow: 'Principle 2',
    title: 'Verified learning logs',
    body: 'Hash rate is attention. Finish modules, keep focus timers honest, expand the node with real study.',
    mood: 'spark',
  },
  {
    id: 'transparent',
    eyebrow: 'Principle 3',
    title: 'Transparent distribution',
    body: 'Zero pre-mines. Parameters stay open-source. Developer share grows with the community — not against it.',
    mood: 'awakening',
  },
  {
    id: 'oracle',
    eyebrow: 'Principle 4',
    title: 'Cross-check against bots',
    body: 'Community oracles examine focus logs so click-farms do not harvest the pool.',
    accent: 'Watch the live feed next.',
    mood: 'evolution',
  },
];
