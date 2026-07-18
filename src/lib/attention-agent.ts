import { getGeminiApiKey } from './gemini-key';
import { generateGeminiText, geminiFailureNote } from './gemini-generate';
import { toUserError, thrownToUserError } from './user-errors';

export interface AttentionVerifyInput {
  sessionId: string;
  title: string;
  artifacts?: string;
  quizScore?: number;
  quizTotal?: number;
  topic?: string;
  summary?: string;
  walletAddress?: string;
}

export interface AttentionVerifyResult {
  passed: boolean;
  score: number;
  verification: string;
  reason: string;
  model: string;
}

function fallbackHeuristic(input: AttentionVerifyInput): AttentionVerifyResult {
  const artifacts = (input.artifacts || input.summary || '').trim();
  const quizOk =
    input.quizScore != null &&
    input.quizTotal != null &&
    input.quizTotal > 0 &&
    input.quizScore / input.quizTotal >= 0.66;
  const hasSubstance = artifacts.length >= 40 || quizOk;
  const score = hasSubstance
    ? Math.min(95, 55 + Math.floor(artifacts.length / 10) + (quizOk ? 20 : 0))
    : Math.max(20, Math.floor(artifacts.length / 2));
  return {
    passed: hasSubstance && score >= 60,
    score,
    verification: `${toUserError({ code: 'gemini_key_missing', context: 'coach' })} (score ${score})`,
    reason: hasSubstance
      ? 'Session artifacts / quiz meet minimum attention threshold.'
      : 'Insufficient session artifacts or quiz score for verification.',
    model: 'heuristic-v1',
  };
}

export async function verifyAttentionWithAgent(
  input: AttentionVerifyInput
): Promise<AttentionVerifyResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return fallbackHeuristic(input);
  }

  try {
    const prompt = `You are the Building Culture attention verification agent on Solana Devnet.
Score whether this operator completed a genuine learning/attention session (not spam).

Session ID: ${input.sessionId}
Title: ${input.title}
Topic: ${input.topic || 'n/a'}
Quiz: ${input.quizScore ?? 'n/a'}/${input.quizTotal ?? 'n/a'}
Wallet: ${input.walletAddress || 'n/a'}
Artifacts / summary:
${(input.artifacts || input.summary || '(none)').slice(0, 4000)}

Respond ONLY with JSON:
{"passed":boolean,"score":0-100,"reason":"short string"}`;

    let text = '';
    let usedModel = 'gemini-flash-latest';
    try {
      const out = await generateGeminiText(prompt);
      text = out.text;
      usedModel = out.model;
    } catch (err) {
      return {
        ...fallbackHeuristic(input),
        verification: geminiFailureNote(err),
        model: 'heuristic-fallback',
      };
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return {
        ...fallbackHeuristic(input),
        verification: 'Gemini returned non-JSON; used heuristic fallback',
        model: `${usedModel}+fallback`,
      };
    }
    const parsed = JSON.parse(match[0]);
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    const passed = Boolean(parsed.passed) && score >= 60;
    return {
      passed,
      score,
      reason: String(parsed.reason || 'No reason provided'),
      verification: `Gemini agent: score ${score}${passed ? ' PASS' : ' FAIL'}`,
      model: usedModel,
    };
  } catch (err: unknown) {
    console.error('Gemini attention verify failed:', err);
    return {
      ...fallbackHeuristic(input),
      verification: thrownToUserError(err, 'coach'),
      model: 'heuristic-after-gemini-error',
    };
  }
}
