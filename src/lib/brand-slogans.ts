/**
 * Building Culture — Human Economy brand spine.
 * Keep in sync with docs/BRAND_STRATEGY.md + docs/HUMAN_ECONOMY.md
 */

export const BRAND = {
  parent: 'Building Culture',
  /** Consumer product line */
  product: 'Human Economy',
  /** Operating surface (workspace after passport) */
  workspace: 'Culture Node',
  /** Identity product */
  passport: 'Human Passport',
  ritual: 'Human Passport',
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
  /** Hero */
  hero: 'Human value was never measured correctly.',
  heroSub:
    'For centuries we measured people by the hours they worked. The AI era requires a new measurement: what you learn, what you create, what you contribute.',
  ctaPassport: 'Start Your Human Passport',
  ctaExplore: 'Explore The Human Economy',

  /** Spine */
  primary: 'Own your digital reputation.',
  primaryLoud: 'THE HUMAN ECONOMY',
  equation: 'Human Value = Contribution',
  timeMoney: 'Time = Money was the industrial age.',
  curve: 'Their failure curve is optional.',
  curveLong:
    'Just because humanity wants the same failure curve does not mean you have to.',
  loop: 'Hear → Spark → Zen → Spread → Return.',
  loopGrowth: 'Discover → Claim → Spark → Spread → Return.',
  loopLegacy: 'Discover → Prove → Passport → Grow → Reputation.',
  spread: 'Share knowledge. Lift others. Reputation compounds.',
  hook: 'Learn. Create. Contribute. Own it.',
  fuel: 'Contribution becomes reputation.',
  proof: 'Proof of Attention > empty hours.',
  now: 'Knowledge that works now.',
  passOn: 'Your passport is ready. Invite a builder.',
  duality: 'Mind ↔ Machine.',
  zen: 'Knowledge first. Then decide.',
  loopBreak: 'The human learning loop ends in a decision.',
  hookMirror: 'See the hook. Name why you stay. Then decide.',
  attention: 'Your attention has value — when it becomes contribution.',
  attentionProof: 'Prove attention. Build your passport.',
  ownership: 'I finally own my digital reputation.',
  /** Legacy hooks kept for Hook Loop / social campaigns */
  thumbBait: 'Name the bait that owns your thumb.',
  thumbBaitSub: 'Two minutes. Then you own the scroll.',
  hookLoop: 'How they hook you into doomscrolling.',
  hookLoopShare: 'Share a truth. Unlock the next. Perfect loop.',
  /** Soft aliases — avoid mining/oath language in new UI */
  firstNight: 'Claim your Human Passport to begin.',
} as const;

export type SloganKey = keyof typeof SLOGANS;
