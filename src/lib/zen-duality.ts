/**
 * Zen Mode + Mind ↔ Machine decision break.
 * Knowledge first — the human learning loop ends in a choice, not autopilot.
 */

export const ZEN_MODE_KEY = 'culture_zen_v1';
export const ZEN_DECISION_KEY = 'culture_zen_decision_v1';

/** Duality poles — never collapse into one. */
export type DualityPole = 'mind' | 'machine';

/**
 * Break the scroll/learn autopilot into one conscious decision.
 * Mind = hold knowledge (Zen). Machine = convert attention → fuel.
 */
export type LearningDecision = 'hold_knowledge' | 'convert_fuel';

export type ZenDecisionRecord = {
  sessionId: string;
  decision: LearningDecision;
  at: number;
};

export function isZenMode(): boolean {
  try {
    return localStorage.getItem(ZEN_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setZenMode(on: boolean): void {
  try {
    localStorage.setItem(ZEN_MODE_KEY, on ? '1' : '0');
  } catch {
    // ignore
  }
}

export function getZenDecision(sessionId: string): LearningDecision | null {
  try {
    const raw = localStorage.getItem(ZEN_DECISION_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as ZenDecisionRecord;
    if (rec.sessionId !== sessionId) return null;
    return rec.decision;
  } catch {
    return null;
  }
}

export function saveZenDecision(sessionId: string, decision: LearningDecision): void {
  try {
    const rec: ZenDecisionRecord = { sessionId, decision, at: Date.now() };
    localStorage.setItem(ZEN_DECISION_KEY, JSON.stringify(rec));
  } catch {
    // ignore
  }
}

export function clearZenDecision(): void {
  try {
    localStorage.removeItem(ZEN_DECISION_KEY);
  } catch {
    // ignore
  }
}

export const ZEN_COPY = {
  eyebrow: 'Zen break · just for you',
  title: 'The loop stops here.',
  body: 'Scrolling never asks. Duality does: hold what stuck in Mind, or prove it on Machine as fuel — your call.',
  mindLabel: 'Mind · Hold knowledge',
  mindSub: 'Sit with it. No rush. Fuel can wait.',
  machineLabel: 'Machine · Convert to fuel',
  machineSub: 'Prove attention. Neural Snap → knowledge fuel.',
  heldNote: 'Nice. Sit with it. When you’re ready to prove it, tap Machine — no pressure.',
  convertedNote: 'Locked in — convert attention → fuel. Submit for Neural Snap when you’re set.',
  readyConvertCta: 'I’m ready — convert to fuel',
} as const;

export function zenDecisionPrompt(sessionTitle: string): string {
  return [
    'A soft Zen break. Knowledge first — no rush.',
    'Mind and Machine stay in gentle duality. You choose.',
    `After ${sessionTitle}, the learning loop rests in a decision.`,
    'Say Mind to hold what landed — just sit with it.',
    'Or say Machine when you are ready to convert attention into fuel.',
  ].join(' ');
}

export function zenMindChosenScript(): string {
  return 'Mind. Beautiful. Knowledge held. Rest with it. When you feel ready to prove it, say Machine — no pressure.';
}

export function zenMachineChosenScript(): string {
  return 'Machine. We will convert attention into fuel. Submit for Neural Snap when you feel settled.';
}

export function zenModeOnScript(): string {
  return 'Zen Mode on. Knowledge first. Mind and Machine stay in duality. Say Academy, then at the Zen break choose Mind or Machine — slowly is perfect.';
}

export function zenModeOffScript(): string {
  return 'Zen Mode off. Duality still waits kindly when you reach the decision break.';
}

export function zenHelpLine(): string {
  return 'Zen — knowledge-first mode. At the Academy break: say Mind to hold knowledge, or Machine to convert to fuel. Either choice is welcome.';
}
