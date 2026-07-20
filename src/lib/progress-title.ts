/**
 * Progress titles — the visible “better name” from passport scores.
 * Session username stays the storage handle; title greets the human.
 */

import type { HumanScores } from './human-economy';

export type ProgressTitleId =
  | 'quiet_spark'
  | 'first_spark'
  | 'attention_apprentice'
  | 'passport_builder'
  | 'culture_node'
  | 'reputation_keeper';

export type ProgressTitle = {
  id: ProgressTitleId;
  title: string;
  blurb: string;
};

export type ProgressTitleFlags = {
  /** First Contribution ritual complete */
  firstContribution?: boolean;
  /** Human Passport claimed on-chain / signed */
  passportClaimed?: boolean;
};

export type ProgressScoreInput = Pick<
  HumanScores,
  'knowledge' | 'builder' | 'creativity' | 'contribution' | 'humanValue'
>;

const TITLES: Record<ProgressTitleId, Omit<ProgressTitle, 'id'>> = {
  quiet_spark: {
    title: 'Quiet Spark',
    blurb: 'Every human begins with potential. Your first Spark is waiting.',
  },
  first_spark: {
    title: 'First Spark',
    blurb: 'Potential became visible. Your scores have begun.',
  },
  attention_apprentice: {
    title: 'Attention Apprentice',
    blurb: 'You showed up. Focus is becoming a habit.',
  },
  passport_builder: {
    title: 'Passport Builder',
    blurb: 'Your Human Passport is taking shape — keep proving attention.',
  },
  culture_node: {
    title: 'Culture Node',
    blurb: 'The loop is warm. Knowledge, creativity, and contribution move together.',
  },
  reputation_keeper: {
    title: 'Reputation Keeper',
    blurb: 'Your contribution compounds — and lifts others with it.',
  },
};

function pack(id: ProgressTitleId): ProgressTitle {
  return { id, ...TITLES[id] };
}

function humanValueOf(scores: ProgressScoreInput): number {
  if (typeof scores.humanValue === 'number' && Number.isFinite(scores.humanValue)) {
    return Math.max(0, Math.min(100, Math.round(scores.humanValue)));
  }
  const creativity = scores.creativity ?? scores.builder ?? 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (scores.knowledge ?? 0) * 0.4 + creativity * 0.3 + (scores.contribution ?? 0) * 0.3
      )
    )
  );
}

/** Resolve the highest title the member has earned. */
export function resolveProgressTitle(
  scores: ProgressScoreInput | null | undefined,
  flags: ProgressTitleFlags = {}
): ProgressTitle {
  const hv = scores ? humanValueOf(scores) : 0;
  const sparked = Boolean(flags.firstContribution) || hv > 0;

  if (!sparked) {
    if (flags.passportClaimed) {
      return {
        id: 'first_spark',
        title: 'First Spark',
        blurb: 'Passport claimed — now make your contribution visible.',
      };
    }
    return pack('quiet_spark');
  }

  if (hv >= 70) return pack('reputation_keeper');
  if (hv >= 45) return pack('culture_node');
  if (hv >= 25) return pack('passport_builder');
  if (hv >= 12) return pack('attention_apprentice');
  return pack('first_spark');
}
