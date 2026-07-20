import type { DeckSlide } from './types';

/** Partner / white-label pitch — shared by OnboardingHub + PartnerProgram. */
export const PARTNERS_DECK: DeckSlide[] = [
  {
    id: 'pilot',
    eyebrow: 'Partners',
    title: 'Ship your insight. Measure attention.',
    body: 'We drop your session into Culture Node — learn → Zen → Proof of Attention → Spread.',
    accent: 'Pilot week $0–$1.5k or trade. First Spark stays free.',
    mood: 'awakening',
  },
  {
    id: 'custom',
    eyebrow: 'White-label',
    title: 'Custom mining for your community',
    body: 'Protocol, meme, or NFT collective — we compile a session that pays your token or NFT alongside $BCC.',
    mood: 'facility',
  },
  {
    id: 'loop',
    eyebrow: 'Not banners',
    title: 'Attention, not empty takeovers',
    body: 'Users run challenges and proofs. You get measured learning energy — not a static logo slot.',
    mood: 'spark',
    ctaLabel: 'Book pilot week',
  },
];
