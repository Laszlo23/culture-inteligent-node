import type { DeckSlide } from './types';

/** Proof of Attention intro before ledger actions. */
export const PROOFS_DECK: DeckSlide[] = [
  {
    id: 'what',
    eyebrow: 'Proof of Attention',
    title: 'Every session can leave a proof',
    body: 'Graduate a module or hold a focus session — you earn a verifiable record of contribution.',
    mood: 'spark',
  },
  {
    id: 'attest',
    eyebrow: 'Step 1',
    title: 'Attest on Devnet',
    body: 'Seal a memo attestation so the proof lives on Solana — not only in local storage.',
    mood: 'facility',
  },
  {
    id: 'soulbound',
    eyebrow: 'Step 2',
    title: 'Seal soulbound reputation',
    body: 'Mint a non-transferable badge for lasting multipliers. Your ledger is below.',
    mood: 'awakening',
    ctaLabel: 'View ledger',
  },
];
