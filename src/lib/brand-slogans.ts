/**
 * Approved campaign slogans — keep in sync with docs/BRAND_STRATEGY.md
 */

export const BRAND = {
  parent: 'Building Culture',
  product: 'Culture Node',
  ritual: 'Culture Club',
  proof: 'Proof of Attention',
  url: 'https://mining.buildingcultureid.space/',
  colors: {
    void: '#050608',
    signal: '#22D3EE',
    ember: '#F59E0B',
    heart: '#FB7185',
    bone: '#F8FAFC',
    mute: '#94A3B8',
  },
} as const;

export const SLOGANS = {
  primary: 'Mine some culture.',
  primaryLoud: "IT'S ABOUT TIME TO MINE SOME CULTURE",
  curve: 'Their failure curve is optional.',
  curveLong:
    'Just because humanity wants the same failure curve does not mean you have to.',
  loop: 'Hook → Club → Spread.',
  spread: "Spread love and knowledge — that's how we win.",
  hook: 'Get hooked. Join the club. Pass it on.',
  fuel: 'Attention becomes fuel.',
  proof: 'Proof of Attention > empty hashes.',
  now: 'Knowledge that works now.',
  firstNight: 'First night? You have to sign.',
  passOn: "You're in. Now pass it on.",
  duality: 'Mind ↔ Machine.',
  zen: 'Knowledge first. Then decide.',
  loopBreak: 'The human learning loop ends in a decision.',
  hookMirror: 'See the hook. Name why you stay. Then decide.',
  /** Purpose line — lead onboarding / gates with this, not chain */
  attention: "We're here for attention.",
  attentionProof: 'Prove attention. Then the node.',
  /** Cold-start killer hook */
  thumbBait: 'Name the bait that owns your thumb.',
  thumbBaitSub: 'Two minutes. Then you own the scroll.',
} as const;

export type SloganKey = keyof typeof SLOGANS;
