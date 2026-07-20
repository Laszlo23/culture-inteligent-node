/**
 * Real daily quests + Daily Signal wheel (unlocks after real progress).
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  CheckSquare,
  Square,
  Battery,
  Compass,
  Sparkles,
  Clock,
  RotateCw,
  Trophy,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { GameState } from '../types';
import { ClaimBurst, markEnergySurge } from './fx';
import { rewardAction } from '../lib/reward-bus';
import {
  REAL_DAILY_QUESTS,
  REAL_WHEEL_PRIZES,
  WHEEL_UNLOCK_COMPLETED,
  completedQuestCount,
  syncMissionCompletion,
  wheelUnlocked,
  type QuestRoom,
} from '../lib/daily-quests';

interface DailyMissionsProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  walletAddress?: string | null;
  onNavigate: (room: QuestRoom) => void;
  onOpenHearing?: () => void;
}

export default function DailyMissions({
  state,
  setState,
  addLog,
  walletAddress,
  onNavigate,
  onOpenHearing,
}: DailyMissionsProps) {
  const [claimBurst, setClaimBurst] = useState<{ show: boolean; label: string }>({
    show: false,
    label: '',
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [prizeIndexWon, setPrizeIndexWon] = useState<number | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [nowTick, setNowTick] = useState(0);

  // Keep mission checkmarks in sync with real product state
  useEffect(() => {
    setState((prev) => {
      const next = syncMissionCompletion(prev.dailyMissions, prev, walletAddress);
      const changed = next.some((m, i) => m.completed !== prev.dailyMissions[i]?.completed);
      if (!changed) return prev;
      return { ...prev, dailyMissions: next };
    });
  }, [
    walletAddress,
    state.proofOfAttentions,
    state.profile?.profileCompletedRewardClaimed,
    state.kpiProof?.signature,
    nowTick,
    setState,
  ]);

  // Refresh claim/hear/spread flags that live outside React state
  useEffect(() => {
    const t = window.setInterval(() => setNowTick((n) => n + 1), 8000);
    const onFocus = () => setNowTick((n) => n + 1);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const doneCount = completedQuestCount(state, walletAddress);
  const unlocked = wheelUnlocked(state, walletAddress);

  const lastSpinTime = state.lastWheelSpinTime ? Number(state.lastWheelSpinTime) : 0;
  const cooldownPeriod = 24 * 60 * 60 * 1000;
  const timeElapsed = Date.now() - lastSpinTime;
  const canSpin = unlocked && timeElapsed >= cooldownPeriod;
  const msRemaining = Math.max(0, cooldownPeriod - timeElapsed);
  const hoursRemaining = Math.floor(msRemaining / 3600000);
  const minutesRemaining = Math.floor((msRemaining % 3600000) / 60000);

  const goQuest = (questId: string) => {
    const def = REAL_DAILY_QUESTS.find((q) => q.id === questId);
    if (!def) return;
    if (def.isDone(state, walletAddress)) {
      addLog(`Already done: ${def.label}`, 'info');
      return;
    }
    addLog(`Quest → ${def.label}`, 'info');
    if (def.openHearing) onOpenHearing?.();
    onNavigate(def.room);
  };

  const settleWheelPrize = async (prizeIndex: number) => {
    const prize = REAL_WHEEL_PRIZES[prizeIndex];
    const newNotification = {
      id: 'n_' + Date.now(),
      title: 'Daily Signal',
      message: prize.logMessage,
      timestamp: new Date().toLocaleTimeString(),
      read: false,
      type: 'success' as const,
    };

    try {
      const { fetchEconomyStatus } = await import('../lib/api');
      const status = await fetchEconomyStatus();
      if (status.ready && (prize.bcc > 0 || prize.energyPercent > 0)) {
        const { rewardOnChain, syncLedgerToState } = await import('../lib/economy-actions');
        const result = await rewardOnChain({
          bcc: prize.bcc || undefined,
          energyPercent: prize.energyPercent || undefined,
          reason: `wheel:daily:${prizeIndex}`,
        });
        if ('skipped' in result) {
          setState((prev) => ({
            ...prev,
            lastWheelSpinTime: Date.now().toString(),
            miningPower: prev.miningPower + prize.powerBoost,
            notifications: [newNotification, ...(prev.notifications || [])],
          }));
          addLog(
            `Daily Signal logged (${result.reason}). Builder boost applied locally.`,
            'warn'
          );
          rewardAction('daily_claim', { label: prize.label });
          setClaimBurst({ show: true, label: `SIGNAL · ${prize.label}` });
          return;
        }
        await syncLedgerToState(setState);
        setState((prev) => ({
          ...prev,
          lastWheelSpinTime: Date.now().toString(),
          miningPower: prev.miningPower + prize.powerBoost,
          notifications: [newNotification, ...(prev.notifications || [])],
        }));
        if (prize.energyPercent > 0) markEnergySurge();
        rewardAction('daily_claim', { label: prize.label });
        setClaimBurst({ show: true, label: `ON-CHAIN · ${prize.label}` });
        addLog(`${prize.logMessage} — ${result.solscan}`, 'success');
        return;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Wheel settle failed — practice path: ${msg}`, 'warn');
    }

    setState((prev) => ({
      ...prev,
      credits: prev.credits + prize.bcc,
      energy: Math.min(100, prev.energy + prize.energyPercent),
      miningPower: prev.miningPower + prize.powerBoost,
      lastWheelSpinTime: Date.now().toString(),
      notifications: [newNotification, ...(prev.notifications || [])],
    }));
    if (prize.energyPercent > 0) markEnergySurge();
    rewardAction('daily_claim', { label: prize.label });
    addLog(`${prize.logMessage} (practice — not on-chain)`, 'warn');
    setClaimBurst({ show: true, label: `CLAIMED · ${prize.label}` });
  };

  const spinWheel = () => {
    if (isSpinning) return;
    if (!unlocked) {
      addLog(
        `Daily Signal locked — finish ${WHEEL_UNLOCK_COMPLETED} real quests first (${doneCount}/${WHEEL_UNLOCK_COMPLETED}).`,
        'warn'
      );
      return;
    }
    if (!canSpin) {
      addLog(
        `Spin locked — next signal in ${hoursRemaining}h ${minutesRemaining}m.`,
        'warn'
      );
      return;
    }

    setIsSpinning(true);
    setPrizeIndexWon(null);
    const prizeIndex = Math.floor(Math.random() * REAL_WHEEL_PRIZES.length);
    const baseRotation = 360 * 6;
    const targetRotation = baseRotation + ((360 - prizeIndex * 45) % 360);
    setSpinAngle(targetRotation);

    window.setTimeout(() => {
      setPrizeIndexWon(prizeIndex);
      setShowPrizeModal(true);
      setIsSpinning(false);
      void settleWheelPrize(prizeIndex);
    }, 3200);
  };

  return (
    <div id="missions-room" className="space-y-6 max-w-4xl mx-auto">
      <ClaimBurst
        show={claimBurst.show}
        label={claimBurst.label}
        onDone={() => setClaimBurst((c) => ({ ...c, show: false }))}
      />

      <div
        className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 ${
          state.energy < 40
            ? 'bg-[#0a0a0c] border-red-500/40'
            : 'bg-[#0a0a0c] border-emerald-500/25'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full border flex items-center justify-center ${
              state.energy < 40
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
            }`}
          >
            {state.energy < 40 ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Battery className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500">
              Today · real progress
            </span>
            <h3 className="text-sm font-mono font-bold text-slate-100 mt-1">
              {doneCount}/{REAL_DAILY_QUESTS.length} quests · {state.energy}% fuel
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-relaxed">
              Do the loop for real — Academy, invite, claim, card, Hearing. Wheel unlocks at{' '}
              {WHEEL_UNLOCK_COMPLETED} done.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('treasury')}
          className="px-5 py-2.5 bg-[#050506] hover:bg-white/[0.03] border border-white/10 text-slate-300 font-mono text-xs font-bold rounded-xl cursor-pointer"
        >
          Vault · claim / refill
        </button>
      </div>

      {/* Quests first — the real work */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <CheckSquare className="w-5 h-5 text-cyan-400" />
          <h4 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
            Today’s quests
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 mb-4 font-sans">
          Tap Go — we check real product state when you come back. No fake progress bars.
        </p>

        <div className="space-y-3">
          {REAL_DAILY_QUESTS.map((quest) => {
            const done = quest.isDone(state, walletAddress);
            return (
              <div
                key={quest.id}
                className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs ${
                  done
                    ? 'bg-emerald-950/10 border-emerald-500/20 opacity-80'
                    : 'bg-[#050506] border-white/5'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={done ? 'text-emerald-400 mt-0.5' : 'text-slate-500 mt-0.5'}>
                    {done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">
                      {quest.category}
                    </span>
                    <span
                      className={`text-slate-200 text-sm ${done ? 'line-through text-slate-400' : ''}`}
                    >
                      {quest.label}
                    </span>
                    <p className="text-[11px] text-slate-500 font-sans mt-1 leading-relaxed">
                      {quest.hint}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 sm:flex-col sm:items-end">
                  <span className="text-emerald-400/90 font-bold">+{quest.energyReward}% fuel*</span>
                  {!done ? (
                    <button
                      type="button"
                      onClick={() => goQuest(quest.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider cursor-pointer"
                    >
                      Go <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                      Done
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[9px] text-slate-600 font-mono">
          *Fuel/BCC from the action itself (Academy, Vault claim, profile reward) — checklist tracks
          proof.
        </p>
      </div>

      {/* Wheel — unlocked by real quests */}
      <div
        id="lucky-wheel"
        className={`bg-[#0a0a0c] border rounded-2xl p-6 shadow-xl relative overflow-hidden scroll-mt-24 ${
          unlocked ? 'border-cyan-500/25' : 'border-white/5 opacity-90'
        }`}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <RotateCw className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
            Daily Signal
          </h3>
          {unlocked ? (
            <span className="text-[8px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-400 tracking-widest">
              UNLOCKED
            </span>
          ) : (
            <span className="text-[8px] font-mono px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 tracking-widest inline-flex items-center gap-1">
              <Lock className="w-3 h-3" /> {doneCount}/{WHEEL_UNLOCK_COMPLETED} QUESTS
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 text-center relative flex flex-col items-center">
            <div className="absolute top-0 z-20 -mt-2">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-cyan-400" />
            </div>
            <div className="w-56 h-56 rounded-full border-4 border-cyan-500/30 bg-[#050506] relative shadow-[0_0_30px_rgba(6,182,212,0.1)] flex items-center justify-center overflow-hidden select-none">
              <motion.div
                animate={{ rotate: spinAngle }}
                transition={{ duration: 3.2, ease: [0.15, 0.85, 0.2, 1] }}
                className="w-full h-full relative"
                style={{ transformOrigin: '50% 50%' }}
              >
                {REAL_WHEEL_PRIZES.map((_, i) => (
                  <div
                    key={`line-${i}`}
                    className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-white/5 origin-bottom"
                    style={{
                      transform: `rotate(${i * 45 + 22.5}deg)`,
                      transformOrigin: '50% 100%',
                    }}
                  />
                ))}
                {REAL_WHEEL_PRIZES.map((prize, i) => (
                  <div
                    key={`label-${i}`}
                    className="absolute top-1 left-1/2 -ml-10 w-20 h-27 origin-bottom text-center flex flex-col items-center justify-start pt-4"
                    style={{
                      transform: `rotate(${i * 45}deg)`,
                      transformOrigin: '50% 100%',
                    }}
                  >
                    <span className="text-[8px] font-mono font-black text-slate-300 tracking-tight leading-none uppercase">
                      {prize.label}
                    </span>
                  </div>
                ))}
              </motion.div>
              <button
                type="button"
                onClick={spinWheel}
                disabled={isSpinning || !canSpin}
                className={`absolute w-14 h-14 rounded-full bg-[#0a0a0c] border-2 border-cyan-400/80 flex flex-col items-center justify-center z-10 cursor-pointer ${
                  !canSpin ? 'opacity-60 border-slate-700 cursor-not-allowed' : 'hover:bg-[#111115]'
                }`}
              >
                <span className="text-[8px] font-mono font-black text-cyan-400 leading-none">
                  SPIN
                </span>
                <RotateCw
                  className={`w-4 h-4 text-cyan-400 mt-1 ${isSpinning ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
                Reward for real work
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Finish at least {WHEEL_UNLOCK_COMPLETED} quests above, then spin once per day. Prizes
              settle on-chain when the economy is ready — BCC and fuel, not fake clicks.
            </p>

            <div className="bg-[#050506] border border-white/5 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-[10px] text-slate-500 block">STATUS</span>
                  {!unlocked ? (
                    <span className="text-amber-400 font-bold">
                      LOCKED · {doneCount}/{WHEEL_UNLOCK_COMPLETED} QUESTS
                    </span>
                  ) : canSpin ? (
                    <span className="text-emerald-400 font-bold">READY TO SPIN</span>
                  ) : (
                    <span className="text-amber-400 font-bold">
                      NEXT IN {hoursRemaining}H {minutesRemaining}M
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={spinWheel}
                disabled={isSpinning || !canSpin}
                className={`px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer ${
                  canSpin
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-black'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSpinning ? 'Spinning…' : unlocked ? 'Spin signal' : 'Locked'}
              </button>
            </div>

            <AnimatePresence>
              {showPrizeModal && prizeIndexWon !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-950/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between gap-3 font-mono text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-widest">
                        Daily Signal
                      </span>
                      <span className="text-slate-200 font-bold">
                        You won:{' '}
                        <span className="text-emerald-400 font-black">
                          {REAL_WHEEL_PRIZES[prizeIndexWon].label}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrizeModal(false)}
                    className="px-3 py-1 bg-emerald-500 text-black font-black text-[10px] rounded cursor-pointer"
                  >
                    OK
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0a0a0c] p-4 flex items-start gap-3">
        <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
          Quests auto-check when you return. Spread needs a wallet invite; Hearing toggles the
          quieter path; Vault claim is the free daily drip.
        </p>
      </div>
    </div>
  );
}
