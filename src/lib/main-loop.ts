/**
 * Product main loop — Hear → Spark → Zen → Spread → Return.
 * Growth ledger (Discover → Claim → Spark → Spread → Return) nests under this.
 */

import { getZenDecision } from './zen-duality';

export const LOOP_LAST_VISIT_KEY = 'culture_loop_last_visit_v1';
export const LOOP_HEAR_TOUCHED_KEY = 'culture_loop_hear_touched_v1';
export const LOOP_ZEN_CELEBRATE_KEY = 'culture_loop_zen_celebrate_v1';

export type LoopStepId = 'hear' | 'spark' | 'zen' | 'spread' | 'return';

export type LoopStepState = 'done' | 'current' | 'locked';

export type LoopRailStep = {
  id: LoopStepId;
  label: string;
  state: LoopStepState;
};

export type MainLoopFlags = {
  hearTouched: boolean;
  firstSparkDone: boolean;
  zenDone: boolean;
  spreadDone: boolean;
  returnDone: boolean;
  /** Active beat for the rail highlight */
  current: LoopStepId;
};

const FIRST_SPARK_ID = 'ai_first_spark';

export function hasZenForFirstSpark(): boolean {
  return getZenDecision(FIRST_SPARK_ID) != null;
}

export function hasAnyZenDecision(): boolean {
  try {
    const raw = localStorage.getItem('culture_zen_decision_v1');
    if (!raw) return false;
    const rec = JSON.parse(raw) as { sessionId?: string; decision?: string };
    return Boolean(rec?.decision);
  } catch {
    return false;
  }
}

export function markHearTouched(): void {
  try {
    localStorage.setItem(LOOP_HEAR_TOUCHED_KEY, '1');
  } catch {
    // ignore
  }
}

export function isHearTouched(): boolean {
  try {
    return localStorage.getItem(LOOP_HEAR_TOUCHED_KEY) === '1';
  } catch {
    return false;
  }
}

export function touchLoopVisit(): { showReturnGreeting: boolean; hoursAway: number } {
  const now = Date.now();
  let hoursAway = 0;
  let showReturnGreeting = false;
  try {
    const last = Number(localStorage.getItem(LOOP_LAST_VISIT_KEY) || '0');
    if (last > 0) {
      hoursAway = (now - last) / (60 * 60 * 1000);
      showReturnGreeting = hoursAway >= 20;
    }
    localStorage.setItem(LOOP_LAST_VISIT_KEY, String(now));
  } catch {
    // ignore
  }
  return { showReturnGreeting, hoursAway };
}

export function peekReturnGreetingNeeded(): boolean {
  try {
    const last = Number(localStorage.getItem(LOOP_LAST_VISIT_KEY) || '0');
    if (!last) return false;
    return Date.now() - last >= 20 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function setZenCelebrate(decision: 'hold_knowledge' | 'convert_fuel'): void {
  try {
    sessionStorage.setItem(
      LOOP_ZEN_CELEBRATE_KEY,
      JSON.stringify({ decision, at: Date.now() })
    );
  } catch {
    // ignore
  }
}

export function consumeZenCelebrate(): {
  decision: 'hold_knowledge' | 'convert_fuel';
} | null {
  try {
    const raw = sessionStorage.getItem(LOOP_ZEN_CELEBRATE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(LOOP_ZEN_CELEBRATE_KEY);
    const parsed = JSON.parse(raw) as { decision?: string };
    if (parsed.decision === 'hold_knowledge' || parsed.decision === 'convert_fuel') {
      return { decision: parsed.decision };
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveMainLoopFlags(input: {
  hearTouched: boolean;
  firstRitualPending: boolean;
  firstSparkDone: boolean;
  zenDone: boolean;
  spreadDone: boolean;
  returnTouched: boolean;
  dailyClaimReady: boolean;
  fuelWin: boolean;
  hookMirrorPending: boolean;
  energyLow: boolean;
}): MainLoopFlags {
  const firstSparkDone = input.firstSparkDone || !input.firstRitualPending;
  const zenDone = input.zenDone || hasZenForFirstSpark() || hasAnyZenDecision();
  const spreadDone = input.spreadDone;
  const returnDone = input.returnTouched || (!input.dailyClaimReady && firstSparkDone);

  let current: LoopStepId = 'spark';
  if (input.firstRitualPending) {
    current = input.hearTouched ? 'spark' : 'hear';
  } else if (input.fuelWin) {
    current = zenDone ? 'zen' : 'zen';
  } else if (!zenDone) {
    current = 'zen';
  } else if (input.dailyClaimReady && firstSparkDone) {
    current = 'return';
  } else if (input.energyLow) {
    current = 'spark';
  } else if (input.hookMirrorPending) {
    current = 'zen';
  } else if (!spreadDone) {
    current = 'spread';
  } else {
    current = 'return';
  }

  return {
    hearTouched: input.hearTouched,
    firstSparkDone,
    zenDone,
    spreadDone,
    returnDone,
    current,
  };
}

export function buildLoopRail(flags: MainLoopFlags): LoopRailStep[] {
  const order: LoopStepId[] = ['hear', 'spark', 'zen', 'spread', 'return'];
  const labels: Record<LoopStepId, string> = {
    hear: 'Hear',
    spark: 'Spark',
    zen: 'Zen',
    spread: 'Spread',
    return: 'Return',
  };
  const done: Record<LoopStepId, boolean> = {
    hear: flags.hearTouched || flags.firstSparkDone,
    spark: flags.firstSparkDone,
    zen: flags.zenDone,
    spread: flags.spreadDone,
    return: flags.returnDone,
  };

  return order.map((id) => {
    let state: LoopStepState = 'locked';
    if (id === flags.current) state = 'current';
    else if (done[id]) state = 'done';
    return { id, label: labels[id], state };
  });
}
