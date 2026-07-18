/**
 * Hook Loop social campaign — expose how doomscrolling hooks work,
 * one meme-truth per share. Perfect loop: share → unlock next truth → share.
 */

import { BRAND, SLOGANS } from './brand-slogans';
import { CULTURE_BROADCAST } from './culture-broadcast';

export const HOOK_LOOP_STORAGE_KEY = 'culture_hook_loop_v1';
export const HOOK_LOOP_ROOM = 'hook-loop' as const;

export type HookTruthPhase = 'bait' | 'catch' | 'stay' | 'break';

export type HookingTruth = {
  id: string;
  /** Short index label e.g. 01 */
  n: string;
  phase: HookTruthPhase;
  /** Classic meme top line */
  memeTop: string;
  /** Classic meme bottom line */
  memeBottom: string;
  /** The packed truth — what the share delivers */
  truth: string;
  /** How the feed uses this trick */
  howTheyHook: string;
  /** One-line flip — what Culture Node does instead */
  flip: string;
  /** Campaign art key */
  art: keyof typeof CULTURE_BROADCAST.art;
};

/** Ordered deck — share advances; deep link can jump by id. */
export const HOOKING_TRUTHS: HookingTruth[] = [
  {
    id: 'HT01',
    n: '01',
    phase: 'bait',
    memeTop: 'ONE MORE SCROLL',
    memeBottom: 'SAID EVERY THUMB SINCE 2012',
    truth: 'The product is not the post. The product is your unfinished feeling.',
    howTheyHook:
      'Open loops beat closed ones. A half-read take keeps the thumb hunting for closure that never arrives.',
    flip: 'Name the bait. Then decide if the loop deserves another minute.',
    art: 'mineCulture',
  },
  {
    id: 'HT02',
    n: '02',
    phase: 'bait',
    memeTop: 'VARIABLE REWARDS',
    memeBottom: 'AKA SLOT MACHINE APP',
    truth: 'Sometimes the next post is gold. Sometimes trash. Your brain bets either way.',
    howTheyHook:
      'Intermittent reinforcement is stronger than consistent reward. The maybe is the hook.',
    flip: 'Culture Node pays for proven attention — not for maybe.',
    art: 'failureCurve',
  },
  {
    id: 'HT03',
    n: '03',
    phase: 'catch',
    memeTop: 'INFINITE SCROLL',
    memeBottom: 'NO DOOR. NO CLOCK. NO EXIT SIGN',
    truth: 'If the feed never ends, your session never has a natural goodbye.',
    howTheyHook:
      'Pagination was a brake. Endless feed removed the brake and called it UX.',
    flip: 'First Spark is two minutes on purpose. Endings are a feature.',
    art: 'cultureClub',
  },
  {
    id: 'HT04',
    n: '04',
    phase: 'bait',
    memeTop: 'OUTRAGE BAIT',
    memeBottom: 'ANGER IS JUST HIGH-RETENTION JOY',
    truth: 'Rage is sticky attention. Platforms learned your nervous system before you did.',
    howTheyHook:
      'Threat + moral heat = dwell time. They optimized for cortisol, not clarity.',
    flip: 'Hook Mirror names the heat. Zen decides what to keep.',
    art: 'spreadLove',
  },
  {
    id: 'HT05',
    n: '05',
    phase: 'catch',
    memeTop: 'AUTOPLAY',
    memeBottom: 'CONSENT WAS NEVER IN THE ROOM',
    truth: 'The next video starts so you never choose to leave — only fail to stop.',
    howTheyHook:
      'Default-on motion hijacks the pause between intention and habit.',
    flip: 'Hearing Mode proves attention without the screen owning your eyes.',
    art: 'mineCulture',
  },
  {
    id: 'HT06',
    n: '06',
    phase: 'stay',
    memeTop: 'STREAKS',
    memeBottom: 'GUILT WITH A FLAME EMOJI',
    truth: 'They turned continuity into a hostage. Break the day, lose the identity.',
    howTheyHook:
      'Loss aversion beats curiosity. You open the app to protect a number, not learn a thing.',
    flip: 'Our streak rewards practice — not panic. Miss a day; keep your soul.',
    art: 'cultureClub',
  },
  {
    id: 'HT07',
    n: '07',
    phase: 'bait',
    memeTop: 'RED DOT',
    memeBottom: 'YOUR BRAIN’S UNPAID INTERN',
    truth: 'A badge is a debt. Your attention pays interest every time you clear it.',
    howTheyHook:
      'Notifications invent urgency where none existed. FOMO is engineered inventory.',
    flip: 'We’re here for attention — earned in Academy, not extracted by dots.',
    art: 'failureCurve',
  },
  {
    id: 'HT08',
    n: '08',
    phase: 'catch',
    memeTop: 'SOCIAL PROOF',
    memeBottom: '1.2M PEOPLE CAN’T BE WRONG (THEY CAN)',
    truth: 'Counts don’t mean true. They mean contagious.',
    howTheyHook:
      'Likes are a herd signal. The feed shows what spreads, not what helps you think.',
    flip: 'Proof of Attention > empty hashes. Receipts over vibes.',
    art: 'spreadLove',
  },
  {
    id: 'HT09',
    n: '09',
    phase: 'stay',
    memeTop: 'CLIFFHANGER UI',
    memeBottom: '…AND THE ALGORITHM SAID “TO BE CONTINUED”',
    truth: 'They cut the punchline mid-air so your thumb finishes the sentence.',
    howTheyHook:
      'Suspense is a retention API. Incomplete stories colonize working memory.',
    flip: 'Hook → Club → Spread ends in a decision, not another cliff.',
    art: 'mineCulture',
  },
  {
    id: 'HT10',
    n: '10',
    phase: 'bait',
    memeTop: 'PERSONALIZED FEED',
    memeBottom: 'A MIRROR THAT ONLY SHOWS YOUR WORST HABITS',
    truth: 'The algorithm doesn’t know you. It knows what you almost quit for.',
    howTheyHook:
      'It trains on micro-hesitations — the pause before you leave is the signal.',
    flip: 'Name the bait that owns your thumb. Then you own the scroll.',
    art: 'failureCurve',
  },
  {
    id: 'HT11',
    n: '11',
    phase: 'catch',
    memeTop: 'PULL TO REFRESH',
    memeBottom: 'LAS VEGAS IN YOUR POCKET',
    truth: 'That tiny yank is a lever pull. Fresh cards. Fresh maybe.',
    howTheyHook:
      'Gesture + chance = compulsive check. Design borrowed from casinos, shipped as “delight.”',
    flip: 'Knowledge fuel fills when you finish a session — not when you yank a void.',
    art: 'cultureClub',
  },
  {
    id: 'HT12',
    n: '12',
    phase: 'stay',
    memeTop: 'FEAR OF MISSING OUT',
    memeBottom: 'THE FEED IS ALWAYS HAVING A PARTY WITHOUT YOU',
    truth: 'FOMO is manufactured scarcity of belonging.',
    howTheyHook:
      'Trending + live + “happening now” invent a room you must not miss — forever.',
    flip: 'Culture Club: get hooked on knowledge, then pass it on — not panic.',
    art: 'spreadLove',
  },
  {
    id: 'HT13',
    n: '13',
    phase: 'break',
    memeTop: 'DOOMSCROLLING',
    memeBottom: 'WHEN THE NEWS IS THE DRUG AND YOU’RE THE BAG',
    truth: 'Bad news loops faster because threat feels like homework for survival.',
    howTheyHook:
      'Negativity bias + endless supply = a classroom with no bell.',
    flip: 'Their failure curve is optional. Step off. Mine some culture.',
    art: 'failureCurve',
  },
  {
    id: 'HT14',
    n: '14',
    phase: 'break',
    memeTop: 'HOW TO HOOK SOMEONE',
    memeBottom: 'STEP 1: NEVER LET THEM FEEL DONE',
    truth: 'Completion is the enemy of engagement. So they delete completion.',
    howTheyHook:
      'No chapter end. No “you’re good.” Only more. The perfect loop has no door.',
    flip: 'We put doors back: Spark → Mirror → Zen → Spread. Done is allowed.',
    art: 'mineCulture',
  },
  {
    id: 'HT15',
    n: '15',
    phase: 'break',
    memeTop: 'SHARE THIS',
    memeBottom: 'YES THIS MEME IS ALSO A HOOK — WE’RE JUST HONEST',
    truth: 'Every share is a loop handoff. The question is whether the loop feeds you or farms you.',
    howTheyHook:
      'Virality turns your friends into unpaid acquisition. Warm trust beats cold ads.',
    flip: 'Spread love and knowledge — that’s how we win. Share a truth, unlock the next.',
    art: 'spreadLove',
  },
  {
    id: 'HT16',
    n: '16',
    phase: 'break',
    memeTop: 'YOU ARE HERE',
    memeBottom: 'BECAUSE A TRUTH WANTED A WITNESS',
    truth: 'Attention is the currency. Proof of Attention is the receipt.',
    howTheyHook:
      'If you can name the hook, you can choose the next minute. Naming is power.',
    flip: `${SLOGANS.thumbBait} ${SLOGANS.thumbBaitSub}`,
    art: 'cultureClub',
  },
];

export type HookLoopState = {
  /** Index into HOOKING_TRUTHS for the truth currently shown */
  index: number;
  /** How many successful shares in this browser */
  shares: number;
  /** Truth ids already unlocked via share */
  unlockedIds: string[];
  /** Last shared id */
  lastSharedId: string | null;
};

function emptyState(): HookLoopState {
  return {
    index: 0,
    shares: 0,
    unlockedIds: [HOOKING_TRUTHS[0].id],
    lastSharedId: null,
  };
}

export function readHookLoopState(): HookLoopState {
  try {
    const raw = localStorage.getItem(HOOK_LOOP_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<HookLoopState>;
    const index =
      typeof parsed.index === 'number' &&
      parsed.index >= 0 &&
      parsed.index < HOOKING_TRUTHS.length
        ? parsed.index
        : 0;
    const unlockedIds = Array.isArray(parsed.unlockedIds)
      ? parsed.unlockedIds.filter((id): id is string => typeof id === 'string')
      : [HOOKING_TRUTHS[0].id];
    if (!unlockedIds.includes(HOOKING_TRUTHS[0].id)) {
      unlockedIds.unshift(HOOKING_TRUTHS[0].id);
    }
    return {
      index,
      shares: typeof parsed.shares === 'number' ? parsed.shares : 0,
      unlockedIds,
      lastSharedId:
        typeof parsed.lastSharedId === 'string' ? parsed.lastSharedId : null,
    };
  } catch {
    return emptyState();
  }
}

export function writeHookLoopState(next: HookLoopState): void {
  try {
    localStorage.setItem(HOOK_LOOP_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getTruthById(id: string | null | undefined): HookingTruth | null {
  if (!id) return null;
  const key = id.trim().toUpperCase();
  return HOOKING_TRUTHS.find((t) => t.id === key) ?? null;
}

export function getTruthAt(index: number): HookingTruth {
  const i = ((index % HOOKING_TRUTHS.length) + HOOKING_TRUTHS.length) % HOOKING_TRUTHS.length;
  return HOOKING_TRUTHS[i];
}

export function hookLoopDeepLink(truthId: string): string {
  const base = BRAND.url.replace(/\/?$/, '/');
  return `${base}?room=hook-loop&truth=${encodeURIComponent(truthId)}`;
}

export function buildHookSharePost(truth: HookingTruth): string {
  const link = hookLoopDeepLink(truth.id);
  return [
    `HOOKING TRUTH #${truth.n} / ${String(HOOKING_TRUTHS.length).padStart(2, '0')}`,
    '',
    `"${truth.truth}"`,
    '',
    'How they hook you into doomscrolling:',
    truth.howTheyHook,
    '',
    `${truth.memeTop}`,
    `${truth.memeBottom}`,
    '',
    `Flip: ${truth.flip}`,
    '',
    'Share → unlock the next truth. Perfect loop. Honest this time.',
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    SLOGANS.thumbBait,
    SLOGANS.spread,
    '',
    link,
    '',
    '#HookLoop #CultureNode #ProofOfAttention',
  ].join('\n');
}

/**
 * After a successful share: unlock next truth, advance index, persist.
 * Returns the newly revealed truth (the one after what was shared).
 */
export function advanceHookLoopAfterShare(shared: HookingTruth): {
  next: HookingTruth;
  state: HookLoopState;
  completedLap: boolean;
} {
  const prev = readHookLoopState();
  const sharedIdx = HOOKING_TRUTHS.findIndex((t) => t.id === shared.id);
  const nextIdx =
    sharedIdx >= 0 ? (sharedIdx + 1) % HOOKING_TRUTHS.length : (prev.index + 1) % HOOKING_TRUTHS.length;
  const next = HOOKING_TRUTHS[nextIdx];
  const unlockedIds = prev.unlockedIds.includes(next.id)
    ? prev.unlockedIds
    : [...prev.unlockedIds, next.id];
  const completedLap = nextIdx === 0 && prev.shares > 0;
  const state: HookLoopState = {
    index: nextIdx,
    shares: prev.shares + 1,
    unlockedIds,
    lastSharedId: shared.id,
  };
  writeHookLoopState(state);
  return { next, state, completedLap };
}

export function setHookLoopIndex(index: number): HookLoopState {
  const truth = getTruthAt(index);
  const prev = readHookLoopState();
  const unlockedIds = prev.unlockedIds.includes(truth.id)
    ? prev.unlockedIds
    : [...prev.unlockedIds, truth.id];
  const state: HookLoopState = { ...prev, index: index % HOOKING_TRUTHS.length, unlockedIds };
  writeHookLoopState(state);
  return state;
}

export function phaseLabel(phase: HookTruthPhase): string {
  switch (phase) {
    case 'bait':
      return 'BAIT';
    case 'catch':
      return 'CATCH';
    case 'stay':
      return 'STAY';
    case 'break':
      return 'BREAK';
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

export function artUrl(art: keyof typeof CULTURE_BROADCAST.art): string {
  return CULTURE_BROADCAST.art[art];
}
