/**
 * Short knowledge snaps for Discord / Telegram Attention Miner.
 * Brand: knowledge first — not empty hash farming.
 */

export type KnowledgeCard = {
  id: string;
  prompt: string;
  options: [string, string, string];
  correctIdx: 0 | 1 | 2;
  reveal: string;
};

/** Rotating deck — keep answers educational. */
export const KNOWLEDGE_DECK: KnowledgeCard[] = [
  {
    id: 'k_attention',
    prompt: 'What fuels a Culture Node?',
    options: [
      'Proof of Attention from focused learning',
      'Empty GPU hashes alone',
      'Buying NFTs without learning',
    ],
    correctIdx: 0,
    reveal: 'Learning → verified attention → energy. That’s the spark.',
  },
  {
    id: 'k_zen',
    prompt: 'At the Zen break you choose…',
    options: [
      'Mind (hold knowledge) or Machine (convert to fuel)',
      'Only sell tokens immediately',
      'Skip learning and mint first',
    ],
    correctIdx: 0,
    reveal: 'Knowledge first. Then decide. Duality stays intact.',
  },
  {
    id: 'k_free',
    prompt: 'What stays free forever in the Human Economy?',
    options: [
      'First Spark + daily claim + basic Hearing',
      'Only partner pilots',
      'Nothing — everything is paywalled',
    ],
    correctIdx: 0,
    reveal: 'Free core is sacred. Tolls are optional depth.',
  },
  {
    id: 'k_hook',
    prompt: 'Proof of Hook Awareness means…',
    options: [
      'Naming what bait pulls you back into the scroll',
      'Ignoring why you doomscroll',
      'Posting more empty impressions',
    ],
    correctIdx: 0,
    reveal: 'See the hook. Name why you stay. Then decide.',
  },
  {
    id: 'k_spread',
    prompt: 'How does the growth loop actually grow?',
    options: [
      'Invite → Claim Passport → Spark → Spread → Return',
      'Buy ads and never open the product',
      'Farm points with bots only',
    ],
    correctIdx: 0,
    reveal: 'Connections count when someone claims with your invite.',
  },
  {
    id: 'k_hearing',
    prompt: 'Hearing Mode is for…',
    options: [
      'Ears-first Proof of Attention when eyes are busy',
      'Replacing your wallet seed phrase',
      'Auto-farming tokens while AFK',
    ],
    correctIdx: 0,
    reveal: 'Say Academy. Prove attention. Eyes optional.',
  },
  {
    id: 'k_discord',
    prompt: 'Where do faction houses live?',
    options: [
      'Discord HQ — one server for houses + Hearing',
      'Only inside a closed NFT Discord',
      'Nowhere — houses are UI-only forever',
    ],
    correctIdx: 0,
    reveal: 'Enlist in-app. Meet the house in Discord.',
  },
  {
    id: 'k_devnet',
    prompt: 'Devnet settlement means…',
    options: [
      'Practice ledger — honest loop, not mainnet money',
      'Your fuel is already USD',
      'You must pay to open First Spark',
    ],
    correctIdx: 0,
    reveal: 'Honesty first. Prove the loop, then decide.',
  },
];

export function pickKnowledgeCard(seed?: string): KnowledgeCard {
  if (seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return KNOWLEDGE_DECK[h % KNOWLEDGE_DECK.length]!;
  }
  const i = Math.floor(Math.random() * KNOWLEDGE_DECK.length);
  return KNOWLEDGE_DECK[i]!;
}
