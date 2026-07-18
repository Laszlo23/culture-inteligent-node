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
  /** Cinematic opening — civilization welcome */
  openingLede:
    'Every human carries invisible value. The things you learn. The things you create. The people you help. Until today, most of it was impossible to measure.',
  openingInvite: 'Welcome to Building Culture. Your journey begins with your first Spark.',
  mission:
    'Humanity is entering a new economic era. Your mission is to discover and grow your potential.',
  ctaPassport: 'Create Human Passport',
  ctaExplore: 'Explore the world',
  /** First Spark — potential becomes visible */
  firstSpark:
    'Every human begins with potential. Your first Spark is the moment your contribution becomes visible.',
  firstSparkSupport: 'One short challenge (~2 min) — then your Knowledge Score moves.',
  /** Passport awakening */
  awakening: 'You are entering a new economy.',
  awakeningZero: 'Your scores start at zero. Zero creates a journey.',
  potential: 'Discover and grow your potential — you are not earning points to prove you are human.',

  /** Spine */
  primary: 'Own your digital reputation.',
  primaryLoud: 'THE HUMAN ECONOMY',
  equation: 'Human Value = Contribution',
  timeMoney: 'Time = Money was the industrial age.',
  curve: 'Their failure curve is optional.',
  curveLong:
    'Just because humanity wants the same failure curve does not mean you have to.',
  loop: 'Hear → Spark → Zen → Spread → Return.',
  loopGrowth: 'Discover → Spark → Build → Share → Reputation.',
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
