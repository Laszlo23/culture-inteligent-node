/**
 * Bridge so ZenDecisionGate can claim Mind / Machine voice commands.
 */

import type { LearningDecision } from '../zen-duality';

type ZenHandler = (decision: LearningDecision) => Promise<boolean> | boolean;

let handler: ZenHandler | null = null;

export function setZenDecisionHandler(next: ZenHandler | null): void {
  handler = next;
}

export async function dispatchZenDecision(decision: LearningDecision): Promise<boolean> {
  if (!handler) return false;
  return Boolean(await handler(decision));
}
