/**
 * Scroll Trap ID — viral 30s awareness quiz.
 * Answer 3 taps → named trap archetype → share / challenge a friend.
 */

import { BRAND, SLOGANS } from './brand-slogans';
import { CULTURE_BROADCAST } from './culture-broadcast';

export const TRAP_ID_STORAGE_KEY = 'culture_trap_id_v1';
export const TRAP_ID_ROOM = 'trap-id' as const;

export type TrapArchetypeId =
  | 'TID01'
  | 'TID02'
  | 'TID03'
  | 'TID04'
  | 'TID05'
  | 'TID06';

export type TrapArchetype = {
  id: TrapArchetypeId;
  /** Short handle people want to claim / roast with */
  handle: string;
  /** Classic meme top */
  memeTop: string;
  /** Classic meme bottom */
  memeBottom: string;
  /** One packed truth — the aha */
  truth: string;
  /** How the feed uses this on you */
  howTheyHook: string;
  /** Culture Node flip */
  flip: string;
  /** Roast line people quote */
  roast: string;
  /** Challenge line for the friend */
  challenge: string;
  art: keyof typeof CULTURE_BROADCAST.art;
};

export type TrapQuestion = {
  id: string;
  prompt: string;
  options: { label: string; trap: TrapArchetypeId }[];
};

export const TRAP_ARCHETYPES: TrapArchetype[] = [
  {
    id: 'TID01',
    handle: 'SLOT THUMB',
    memeTop: 'ONE MORE SCROLL',
    memeBottom: 'SAID MY DOPAMINE',
    truth: 'Your thumb is playing a slot machine. The feed is the casino.',
    howTheyHook:
      'Maybe the next post is gold. Maybe trash. Intermittent reward beats consistent reward every time.',
    flip: 'Proof of Attention pays for focus you chose — not for maybe.',
    roast: 'I don’t doomscroll. I just keep pulling the lever.',
    challenge: 'Bet you’re a Slot Thumb too. Prove me wrong — 30 sec.',
    art: 'failureCurve',
  },
  {
    id: 'TID02',
    handle: 'RAGE CLICKER',
    memeTop: 'I’M JUST CHECKING',
    memeBottom: 'WHY I’M ANGRY AGAIN',
    truth: 'Outrage is not news. Outrage is retention with a moral costume.',
    howTheyHook:
      'Threat + heat = dwell time. They optimized for cortisol, then called it “engagement.”',
    flip: 'Hook Mirror names the heat. Zen decides what stays in your head.',
    roast: 'My hobbies include being correct and slightly furious.',
    challenge: 'Tag a Rage Clicker who “only opened it for a sec.”',
    art: 'spreadLove',
  },
  {
    id: 'TID03',
    handle: 'OPEN LOOP GHOST',
    memeTop: '47 TABS OPEN',
    memeBottom: 'ZERO LOOPS CLOSED',
    truth: 'Unfinished feelings are the product. Closure was never the plan.',
    howTheyHook:
      'A half-read take keeps the thumb hunting for an ending that never arrives.',
    flip: 'First Spark ends on purpose. Endings are a feature.',
    roast: 'I don’t multi-task. I collect unfinished thoughts.',
    challenge: 'Open Loop Ghosts: drop your tab count if you dare.',
    art: 'cultureClub',
  },
  {
    id: 'TID04',
    handle: 'STREAK HOSTAGE',
    memeTop: 'MISSED A DAY',
    memeBottom: 'IDENTITY IN CRISIS',
    truth: 'They turned continuity into a hostage. You open the app to protect a number.',
    howTheyHook:
      'Loss aversion beats curiosity. The flame emoji is unpaid emotional labor.',
    flip: 'Our streak rewards practice — miss a day, keep your soul.',
    roast: 'I came for knowledge. I stayed for the guilt flame.',
    challenge: 'Streak Hostages: what’s the number you refuse to break?',
    art: 'mineCulture',
  },
  {
    id: 'TID05',
    handle: 'RED DOT DEBT',
    memeTop: 'CLEAR THE BADGE',
    memeBottom: 'FEEL NOTHING · REPEAT',
    truth: 'A badge is a debt. Your attention pays interest every clear.',
    howTheyHook:
      'Notifications invent urgency where none existed. FOMO is engineered inventory.',
    flip: 'We’re here for attention earned in Academy — not extracted by dots.',
    roast: 'Inbox zero. Brain also zero. Efficient.',
    challenge: 'Red Dot Debtors: screenshot your badge count. No judgment. Ok, some.',
    art: 'failureCurve',
  },
  {
    id: 'TID06',
    handle: 'COMPARE & DESPAIR',
    memeTop: 'EVERYONE ELSE',
    memeBottom: 'IS WINNING WITHOUT ME',
    truth: 'The feed sells you other people’s highlight reels as your scoreboard.',
    howTheyHook:
      'Social comparison is infinite scroll for identity. There is always someone ahead.',
    flip: 'Human Passport measures your contribution — not their costume.',
    roast: 'I opened the app to learn. I left knowing less about myself.',
    challenge: 'Compare & Despair crew: find your Trap ID before the feed finds you.',
    art: 'spreadLove',
  },
];

/** Three taps. Last answer breaks ties — people share what they admit last. */
export const TRAP_QUESTIONS: TrapQuestion[] = [
  {
    id: 'q_open',
    prompt: 'What makes you open the app “just for a sec”?',
    options: [
      { label: 'A red badge I “have” to clear', trap: 'TID05' },
      { label: 'Someone being wrong online', trap: 'TID02' },
      { label: 'Maybe the next post is good', trap: 'TID01' },
      { label: 'Fear I’m falling behind', trap: 'TID06' },
    ],
  },
  {
    id: 'q_stay',
    prompt: 'What keeps you longer than you meant?',
    options: [
      { label: 'Half-finished threads I can’t leave', trap: 'TID03' },
      { label: 'Streak / day-count guilt', trap: 'TID04' },
      { label: 'The maybe-next-one dopamine', trap: 'TID01' },
      { label: 'Comparing my life to theirs', trap: 'TID06' },
    ],
  },
  {
    id: 'q_admit',
    prompt: 'What would you hate to admit owns your thumb?',
    options: [
      { label: 'Notification debt', trap: 'TID05' },
      { label: 'Rage as a hobby', trap: 'TID02' },
      { label: 'Unfinished open loops', trap: 'TID03' },
      { label: 'A streak I refuse to break', trap: 'TID04' },
    ],
  },
];

export type TrapIdState = {
  resultId: TrapArchetypeId | null;
  answers: TrapArchetypeId[];
  shares: number;
  lastSharedAt: number | null;
  completedAt: number | null;
};

function emptyState(): TrapIdState {
  return {
    resultId: null,
    answers: [],
    shares: 0,
    lastSharedAt: null,
    completedAt: null,
  };
}

export function readTrapIdState(): TrapIdState {
  if (typeof localStorage === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(TRAP_ID_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<TrapIdState>;
    const resultId =
      parsed.resultId && TRAP_ARCHETYPES.some((t) => t.id === parsed.resultId)
        ? (parsed.resultId as TrapArchetypeId)
        : null;
    return {
      resultId,
      answers: Array.isArray(parsed.answers)
        ? parsed.answers.filter((id): id is TrapArchetypeId =>
            TRAP_ARCHETYPES.some((t) => t.id === id)
          )
        : [],
      shares: typeof parsed.shares === 'number' ? parsed.shares : 0,
      lastSharedAt: typeof parsed.lastSharedAt === 'number' ? parsed.lastSharedAt : null,
      completedAt: typeof parsed.completedAt === 'number' ? parsed.completedAt : null,
    };
  } catch {
    return emptyState();
  }
}

export function writeTrapIdState(next: TrapIdState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(TRAP_ID_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getTrapById(id: string | null | undefined): TrapArchetype | null {
  if (!id) return null;
  const key = id.trim().toUpperCase();
  return TRAP_ARCHETYPES.find((t) => t.id === key) ?? null;
}

/** Majority vote; Q3 (last answer) wins ties. */
export function scoreTrapId(answers: TrapArchetypeId[]): TrapArchetype {
  if (answers.length === 0) return TRAP_ARCHETYPES[0];
  const counts = new Map<TrapArchetypeId, number>();
  for (const id of answers) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let best = answers[answers.length - 1];
  let bestCount = -1;
  for (const [id, n] of counts) {
    if (n > bestCount) {
      best = id;
      bestCount = n;
    } else if (n === bestCount && id === answers[answers.length - 1]) {
      best = id;
    }
  }
  // Explicit tie-break: last answer if tied at top
  const tied = [...counts.entries()].filter(([, n]) => n === bestCount).map(([id]) => id);
  if (tied.length > 1) {
    const last = answers[answers.length - 1];
    if (tied.includes(last)) best = last;
  }
  return getTrapById(best) ?? TRAP_ARCHETYPES[0];
}

export function saveTrapResult(answers: TrapArchetypeId[]): {
  trap: TrapArchetype;
  state: TrapIdState;
} {
  const trap = scoreTrapId(answers);
  const prev = readTrapIdState();
  const state: TrapIdState = {
    ...prev,
    resultId: trap.id,
    answers,
    completedAt: Date.now(),
  };
  writeTrapIdState(state);
  return { trap, state };
}

export function markTrapShared(trapId: TrapArchetypeId): TrapIdState {
  const prev = readTrapIdState();
  const state: TrapIdState = {
    ...prev,
    resultId: prev.resultId ?? trapId,
    shares: prev.shares + 1,
    lastSharedAt: Date.now(),
  };
  writeTrapIdState(state);
  return state;
}

export function clearTrapAnswersForRetake(): TrapIdState {
  const prev = readTrapIdState();
  const state: TrapIdState = { ...prev, answers: [] };
  writeTrapIdState(state);
  return state;
}

export function trapIdDeepLink(trapId: TrapArchetypeId): string {
  const base = BRAND.url.replace(/\/?$/, '/');
  return `${base}?room=trap-id&trap=${encodeURIComponent(trapId)}`;
}

export function buildTrapSharePost(trap: TrapArchetype): string {
  const link = trapIdDeepLink(trap.id);
  return [
    `I'm a ${trap.handle}.`,
    '',
    trap.memeTop,
    trap.memeBottom,
    '',
    `"${trap.truth}"`,
    '',
    trap.roast,
    '',
    trap.challenge,
    '',
    `Find your Scroll Trap ID (30 sec):`,
    link,
    '',
    `${BRAND.product} — ${BRAND.parent}`,
    SLOGANS.thumbBait,
    '',
    '#TrapID #ProofOfAttention #HumanEconomy',
  ].join('\n');
}

/** Short Farcaster-friendly cast */
export function buildTrapCast(trap: TrapArchetype): { text: string; embedUrl: string } {
  const embedUrl = `${trapIdDeepLink(trap.id)}&fc=1`;
  const text = [
    `I'm a ${trap.handle}.`,
    '',
    `"${trap.truth}"`,
    '',
    `${trap.memeTop}`,
    `${trap.memeBottom}`,
    '',
    'Find yours in 30 sec → challenge a friend.',
    '#TrapID #HumanEconomy',
  ].join('\n');
  return { text, embedUrl };
}

export function artUrl(key: keyof typeof CULTURE_BROADCAST.art): string {
  return CULTURE_BROADCAST.art[key];
}
