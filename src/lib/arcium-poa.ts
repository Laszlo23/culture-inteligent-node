/**
 * Confidential Proof of Attention — Arcium threshold client.
 *
 * The canonical circuit lives in culture-poa/encrypted-ixs (verify_attention_threshold).
 * This module mirrors that policy for the Culture Node app and records Arcium metadata
 * on PoA. Full MXE encrypt→queue→callback runs via `arcium test` in culture-poa/;
 * enable on-chain invoke later with VITE_ARCIUM_RPC + deployed program id.
 */

export const ARCIUM_MIN_SCORE = 60;
export const ARCIUM_PROGRAM_ID = '4HwALuuryVebSQTLXpWdXeEJUhis8c5h8hLDxcLUCViG';

export type ArciumThresholdResult = {
  passed: boolean;
  scoreBand: 0 | 1 | 2 | 3;
  quizScore: number;
  artifactLenBucket: number;
  /** Matches Arcis circuit name */
  circuit: 'verify_attention_threshold';
  mode: 'circuit-mirror' | 'onchain';
  computationOffset?: string;
  txSignature?: string;
  verifiedAt: string;
};

/** floor(artifactLen / 40) capped at 10 — same bucketing as circuit docs. */
export function artifactLenBucket(artifactLen: number): number {
  if (!Number.isFinite(artifactLen) || artifactLen <= 0) return 0;
  return Math.min(10, Math.floor(artifactLen / 40));
}

/**
 * Exact mirror of culture-poa Arcis `verify_attention_threshold`.
 * Keep in sync with culture-poa/encrypted-ixs/src/lib.rs
 */
export function evaluateAttentionThreshold(
  quizScore: number,
  artifactLenOrBucket: number,
  opts?: { artifactIsBucket?: boolean }
): Pick<ArciumThresholdResult, 'passed' | 'scoreBand' | 'quizScore' | 'artifactLenBucket'> {
  const score = Math.max(0, Math.min(100, Math.floor(quizScore)));
  const bucket = opts?.artifactIsBucket
    ? Math.max(0, Math.min(10, Math.floor(artifactLenOrBucket)))
    : artifactLenBucket(artifactLenOrBucket);

  const passed = score >= ARCIUM_MIN_SCORE && bucket >= 1;
  let scoreBand: 0 | 1 | 2 | 3;
  if (score < 60) scoreBand = 0;
  else if (score < 75) scoreBand = 1;
  else if (score < 90) scoreBand = 2;
  else scoreBand = 3;

  return { passed, scoreBand, quizScore: score, artifactLenBucket: bucket };
}

/**
 * Run confidential threshold verification.
 * Today: circuit-mirror (same policy as MXE). When VITE_ARCIUM_RPC is set in a future
 * deploy, this can encrypt + queue against the live MXE.
 */
export async function verifyAttentionWithArcium(input: {
  quizScore: number;
  artifactLen: number;
  sessionId?: string;
}): Promise<ArciumThresholdResult> {
  const evaluated = evaluateAttentionThreshold(input.quizScore, input.artifactLen);
  const rpc = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ARCIUM_RPC;

  // Placeholder for future on-chain path — never send raw artifacts.
  if (rpc) {
    console.info(
      '[arcium-poa] VITE_ARCIUM_RPC set; on-chain MXE invoke not yet wired in this spike. Using circuit-mirror.',
      { programId: ARCIUM_PROGRAM_ID, sessionId: input.sessionId }
    );
  }

  return {
    ...evaluated,
    circuit: 'verify_attention_threshold',
    mode: 'circuit-mirror',
    computationOffset: `mirror_${Date.now().toString(36)}`,
    verifiedAt: new Date().toISOString(),
  };
}
