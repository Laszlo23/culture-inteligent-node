/**
 * Come-back strip — refill countdown + streak + quests / Daily Signal.
 * Surfaces tomorrow's reason to return on Home (not buried in Vault).
 */

import React, { useEffect, useState } from 'react';
import { ArrowRight, Target, Timer } from 'lucide-react';
import {
  WHEEL_UNLOCK_COMPLETED,
  formatClaimCountdown,
} from '../lib/daily-quests';

export type StayLoopProps = {
  claimReady: boolean;
  msUntilNext: number;
  streak: number;
  questsDone: number;
  questsTotal: number;
  wheelReady: boolean;
  nextQuestLabel: string | null;
  onClaim: () => void;
  onQuests: () => void;
  onNextQuest: () => void;
  compact?: boolean;
};

export default function StayLoopStrip({
  claimReady,
  msUntilNext,
  streak,
  questsDone,
  questsTotal,
  wheelReady,
  nextQuestLabel,
  onClaim,
  onQuests,
  onNextQuest,
  compact = false,
}: StayLoopProps) {
  const [msLeft, setMsLeft] = useState(msUntilNext);

  useEffect(() => {
    setMsLeft(msUntilNext);
  }, [msUntilNext, claimReady]);

  useEffect(() => {
    if (claimReady || msLeft <= 0) return;
    const id = window.setInterval(() => {
      setMsLeft((m) => Math.max(0, m - 60_000));
    }, 60_000);
    return () => window.clearInterval(id);
  }, [claimReady, msLeft]);

  const countdown = formatClaimCountdown(msLeft);
  const toWheel = Math.max(0, WHEEL_UNLOCK_COMPLETED - questsDone);
  const claimLine = claimReady
    ? streak > 0
      ? `Day ${streak} streak at risk — claim free Impact now`
      : 'Free Impact ready — claim your daily refill'
    : streak > 0
      ? `Next refill in ${countdown} · Day ${streak} locked in`
      : `Next free refill in ${countdown}`;

  const questLine = wheelReady
    ? `${questsDone}/${questsTotal} quests · Daily Signal unlocked — spin`
    : toWheel === 0
      ? `${questsDone}/${questsTotal} quests · unlock Daily Signal`
      : `${questsDone}/${questsTotal} quests · ${toWheel} more to unlock Daily Signal`;

  return (
    <div
      className={`rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-black/40 to-cyan-500/10 ${
        compact ? 'px-3.5 py-3' : 'px-4 py-3.5'
      }`}
    >
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-amber-300/90">
        Stay in the loop
      </p>
      <div className="mt-2.5 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-start gap-2 text-[12px] text-slate-100/90 leading-snug min-w-0">
            <Timer className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
            <span>{claimLine}</span>
          </p>
          {claimReady ? (
            <button
              type="button"
              onClick={onClaim}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              Claim
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-2.5">
          <p className="flex items-start gap-2 text-[12px] text-slate-200/85 leading-snug min-w-0">
            <Target className="w-3.5 h-3.5 text-cyan-300 shrink-0 mt-0.5" />
            <span>
              {questLine}
              {nextQuestLabel && !wheelReady ? (
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Next · {nextQuestLabel}
                </span>
              ) : null}
            </span>
          </p>
          <button
            type="button"
            onClick={wheelReady || !nextQuestLabel ? onQuests : onNextQuest}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-400/35 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-100 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            {wheelReady ? 'Spin' : nextQuestLabel ? 'Do quest' : 'Quests'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
