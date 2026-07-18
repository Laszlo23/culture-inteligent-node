/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckSquare, Square, Battery, Settings, Compass, Sparkles, Clock, Coins, RotateCw, Trophy, Zap } from 'lucide-react';
import { GameState, DailyMission } from '../types';
import { ClaimBurst, markEnergySurge } from './fx';

interface DailyMissionsProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

interface WheelPrize {
  label: string;
  color: string;
  action: (state: GameState) => GameState;
  logMessage: string;
}

const WHEEL_PRIZES: WheelPrize[] = [
  { label: "50 $BCC", color: "from-slate-900 to-slate-800 border-r border-white/5", action: (s) => ({ ...s, credits: s.credits + 50 }), logMessage: "WHEEL OF FORTUNE: Won +50 Building Culture Coins ($BCC)!" },
  { label: "+20% Energy", color: "from-cyan-950/40 to-cyan-900/40 border-r border-white/5", action: (s) => ({ ...s, energy: Math.min(100, s.energy + 20) }), logMessage: "WHEEL OF FORTUNE: Won +20% Reactor Core Energy recharge!" },
  { label: "100 $BCC", color: "from-slate-900 to-slate-800 border-r border-white/5", action: (s) => ({ ...s, credits: s.credits + 100 }), logMessage: "WHEEL OF FORTUNE: Won +100 Building Culture Coins ($BCC)!" },
  { label: "+10 Builder", color: "from-fuchsia-950/40 to-fuchsia-900/40 border-r border-white/5", action: (s) => ({ ...s, miningPower: s.miningPower + 10 }), logMessage: "DAILY SIGNAL: Builder boost applied to your growth score." },
  { label: "250 $BCC", color: "from-slate-900 to-slate-800 border-r border-white/5", action: (s) => ({ ...s, credits: s.credits + 250 }), logMessage: "WHEEL OF FORTUNE: Won +250 Building Culture Coins ($BCC)!" },
  { label: "+50% Energy", color: "from-orange-950/40 to-orange-900/40 border-r border-white/5", action: (s) => ({ ...s, energy: Math.min(100, s.energy + 50) }), logMessage: "WHEEL OF FORTUNE: Won +50% heavy energy capsule drop!" },
  { label: "500 $BCC", color: "from-slate-900 to-slate-800 border-r border-white/5", action: (s) => ({ ...s, credits: s.credits + 500 }), logMessage: "WHEEL OF FORTUNE: Won +500 Building Culture Coins ($BCC)!" },
  { label: "JACKPOT 1k!", color: "from-amber-500/20 to-amber-950/20 border-r border-white/5", action: (s) => ({ ...s, credits: s.credits + 1000 }), logMessage: "WHEEL OF FORTUNE: ★ JACKPOT ★ Won +1000 Building Culture Coins ($BCC)!" }
];

export default function DailyMissions({ state, setState, addLog }: DailyMissionsProps) {
  const [runningQuestId, setRunningQuestId] = useState<string | null>(null);
  const [questProgress, setQuestProgress] = useState(0);
  const [claimBurst, setClaimBurst] = useState<{ show: boolean; label: string }>({ show: false, label: '' });

  // Reset practice missions once per local calendar day (keep KPI/academy completion)
  useEffect(() => {
    const today = new Date().toDateString();
    const key = 'building_culture_missions_day_v1';
    const last = localStorage.getItem(key);
    if (last === today) return;
    localStorage.setItem(key, today);
    setState((prev) => ({
      ...prev,
      dailyMissions: prev.dailyMissions.map((m) => {
        if (m.id === 'm_kpi') {
          return { ...m, completed: !!prev.kpiProof?.signature };
        }
        if (m.id === 'm_academy') {
          const has = (prev.proofOfAttentions || []).some(
            (p) => p.verification?.includes('Gemini') || p.verification?.includes('agent') || (p.score != null && p.score >= 60)
          );
          return { ...m, completed: has };
        }
        // practice missions reset daily
        return { ...m, completed: false };
      }),
    }));
    addLog('DAILY RESET: Practice missions refreshed for a new day.', 'system');
  }, []);

  // Wheel States
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [prizeIndexWon, setPrizeIndexWon] = useState<number | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  // Cooldown calculation
  const lastSpinTime = state.lastWheelSpinTime ? Number(state.lastWheelSpinTime) : 0;
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in ms
  const timeElapsed = Date.now() - lastSpinTime;
  const canSpin = timeElapsed >= cooldownPeriod;

  const msRemaining = cooldownPeriod - timeElapsed;
  const hoursRemaining = Math.max(0, Math.floor(msRemaining / 3600000));
  const minutesRemaining = Math.max(0, Math.floor((msRemaining % 3600000) / 60000));

  const startQuestSimulation = (mission: DailyMission) => {
    if (mission.completed) return;

    if (mission.id === 'm_kpi') {
      if (!state.kpiProof?.signature) {
        addLog(
          'KPI LOCKED: Complete a real Devnet contribution in Ecosystem Vault → Solana Portal first (0.05 SOL confirmed).',
          'warn'
        );
        return;
      }
      completeQuest(mission);
      return;
    }

    if (mission.id === 'm_academy') {
      const hasVerified = (state.proofOfAttentions || []).some(
        (p) => p.verification?.startsWith('Gemini') || p.score != null
      );
      if (!hasVerified) {
        addLog(
          'ACADEMY MISSION LOCKED: Finish an Attention Academy session with Gemini agent verification first.',
          'warn'
        );
        return;
      }
      completeQuest(mission);
      return;
    }

    setRunningQuestId(mission.id);
    setQuestProgress(0);

    const interval = setInterval(() => {
      setQuestProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeQuest(mission);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const completeQuest = (mission: DailyMission) => {
    setRunningQuestId(null);
    setState(prev => {
      const updatedMissions = prev.dailyMissions.map(m => {
        if (m.id === mission.id) {
          return { ...m, completed: true };
        }
        return m;
      });

      // Refuel reactor core
      const newEnergy = Math.min(100, prev.energy + mission.energyReward);
      
      // Award credits and system power
      const newCredits = prev.credits + 250; 
      const currentHardwarePower = prev.hardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 0);
      const currentWorkerPower = prev.workers
        .filter(w => w.unlocked)
        .reduce((sum, w) => sum + w.powerBonus, 0);

      const newBasePower = prev.miningPower + (mission.powerReward);

      return {
        ...prev,
        dailyMissions: updatedMissions,
        energy: newEnergy,
        credits: newCredits,
        miningPower: currentHardwarePower + currentWorkerPower + newBasePower - prev.hardware.filter(h=>h.installed && h.unlocked).reduce((s, h)=>s+h.bonusPower, 0) - prev.workers.filter(w=>w.unlocked).reduce((s, w)=>s+w.powerBonus, 0)
      };
    });

    markEnergySurge();
    setClaimBurst({
      show: true,
      label: `+${mission.energyReward}% FUEL · +250 BCC`,
    });
    addLog(`DIRECTIVE COMPLETE: "${mission.label}" — +${mission.energyReward}% knowledge fuel routed to reactor.`, 'success');
  };

  const triggerEmergencyReboot = () => {
    if (state.credits < 300) {
      addLog("REBOOT REJECTED: Insufficient backup credits. Need 300 credits for custom fuel capsules.", "warn");
      return;
    }
    setState(prev => ({
      ...prev,
      credits: prev.credits - 300,
      energy: 100
    }));
    addLog("EMERGENCY REBOOT ENGAGED: Purging backup capsules. Reactor energy forced to 100%.", "success");
  };

  // Lucky Wheelspin Trigger
  const spinWheel = () => {
    if (isSpinning) return;
    if (!canSpin) {
      addLog(`SPIN LOCKED: Please wait for the 24-hour cooldown. Remaining: ${hoursRemaining}h ${minutesRemaining}m.`, "warn");
      return;
    }

    setIsSpinning(true);
    setPrizeIndexWon(null);

    // Choose random prize (8 segments: index 0 to 7)
    const prizeIndex = Math.floor(Math.random() * 8);
    
    // We want the wheel to spin at least 5 times (5 * 360 = 1800 deg)
    // There are 8 segments. Each segment is 45 degrees.
    // The selector is at the top (0 degrees).
    // The wheel rotates clockwise. To align segment i at the top, we rotate the wheel counter-clockwise, or offset it.
    // Specifically, rotation offset = 360 - (prizeIndex * 45)
    const baseRotation = 360 * 6; // 6 full spins
    const targetRotation = baseRotation + (360 - (prizeIndex * 45)) % 360;

    setSpinAngle(targetRotation);

    setTimeout(() => {
      // Execute reward after 3.2s spin
      setPrizeIndexWon(prizeIndex);
      setShowPrizeModal(true);
      setIsSpinning(false);

      const prize = WHEEL_PRIZES[prizeIndex];

      setState(prev => {
        const nextState = prize.action(prev);
        
        // Push notification of won prize
        const newNotification = {
          id: 'n_' + Date.now(),
          title: 'Daily Wheel Prize!',
          message: prize.logMessage,
          timestamp: new Date().toLocaleTimeString(),
          read: false,
          type: 'success' as const
        };

        return {
          ...nextState,
          lastWheelSpinTime: Date.now().toString(),
          notifications: [newNotification, ...(prev.notifications || [])]
        };
      });

      addLog(prize.logMessage, 'success');
      if (prize.label.includes('Energy')) {
        markEnergySurge();
      }
      setClaimBurst({ show: true, label: `CLAIMED · ${prize.label}` });
    }, 3200);
  };

  // Override Wheel Cooldown for Q/A diagnostics
  const overrideWheelCooldown = () => {
    setState(prev => ({
      ...prev,
      lastWheelSpinTime: undefined
    }));
    addLog("QA DIAGNOSTICS: Wheelspin 24h cooldown timer reset manually.", "system");
  };

  return (
    <div id="missions-room" className="space-y-6">
      <ClaimBurst
        show={claimBurst.show}
        label={claimBurst.label}
        onDone={() => setClaimBurst((c) => ({ ...c, show: false }))}
      />
      
      {/* Dynamic Reactor Low Banner */}
      <div className={`p-5 rounded-2xl border-2 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
        state.energy < 40 
          ? 'bg-[#0a0a0c] border-red-500/40 shadow-xl shadow-red-950/10' 
          : 'bg-[#0a0a0c] border-emerald-500/30 shadow-xl shadow-emerald-950/5'
      }`}>
        <div className="flex items-center gap-4">
          {state.energy < 40 ? (
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-500 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <Battery className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono tracking-widest block uppercase ${state.energy < 40 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                {state.energy < 40 ? 'FOCUS RESERVE LOW' : 'FOCUS RESERVE READY'}
              </span>
            </div>
            <h3 className="text-sm font-mono font-bold text-slate-100 mt-1">
              QUESTS · LEARN · BUILD · CONTRIBUTE · {state.energy}% capacity
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-xl leading-relaxed">
              {state.energy < 40 
                ? 'Complete a Learn or Build quest to restore capacity and grow your Human Passport.' 
                : 'Keep the loop warm — daily quests update Knowledge, Builder, and Contribution scores.'
              }
            </p>
          </div>
        </div>

        {/* Quick repair backup action */}
        {state.energy < 100 && (
          <button
            onClick={triggerEmergencyReboot}
            className="px-5 py-2.5 bg-[#050506] hover:bg-white/[0.03] border border-white/10 text-slate-300 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            BUY ENERGY CAPSULE (300 CP)
          </button>
        )}
      </div>

      {/* LUCKY WHEEL OF FORTUNE SECTION */}
      <div id="lucky-wheel" className="bg-[#0a0a0c] border border-cyan-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden scroll-mt-24">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-4">
          <RotateCw className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
            Daily Signal
          </h3>
          <span className="text-[8px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 tracking-widest">
            DAILY SPIN
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Wheel column */}
          <div className="md:col-span-5 text-center relative flex flex-col items-center">
            {/* Pointer arrow */}
            <div className="absolute top-0 z-20 -mt-2">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-cyan-400 drop-shadow-[0_2px_5px_rgba(34,211,238,0.5)]" />
            </div>

            {/* Rotating Wheel body */}
            <div className="w-56 h-56 rounded-full border-4 border-cyan-500/30 bg-[#050506] relative shadow-[0_0_30px_rgba(6,182,212,0.1)] flex items-center justify-center overflow-hidden select-none">
              <motion.div
                animate={{ rotate: spinAngle }}
                transition={{ duration: 3.2, ease: [0.15, 0.85, 0.2, 1] }}
                className="w-full h-full relative"
                style={{ transformOrigin: '50% 50%' }}
              >
                {/* Dial dividers */}
                {WHEEL_PRIZES.map((_, i) => (
                  <div
                    key={`line-${i}`}
                    className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-white/5 origin-bottom"
                    style={{ transform: `rotate(${i * 45 + 22.5}deg)`, transformOrigin: '50% 100%' }}
                  />
                ))}

                {/* Dial labels */}
                {WHEEL_PRIZES.map((prize, i) => (
                  <div
                    key={`label-${i}`}
                    className="absolute top-1 left-1/2 -ml-10 w-20 h-27 origin-bottom text-center flex flex-col items-center justify-start pt-4"
                    style={{
                      transform: `rotate(${i * 45}deg)`,
                      transformOrigin: '50% 100%'
                    }}
                  >
                    <span className="text-[8px] font-mono font-black text-slate-300 tracking-tight leading-none uppercase">
                      {prize.label}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Central Cap */}
              <button
                onClick={spinWheel}
                disabled={isSpinning || !canSpin}
                className={`absolute w-14 h-14 rounded-full bg-[#0a0a0c] border-2 border-cyan-400/80 hover:border-cyan-400 hover:bg-[#111115] shadow-[0_0_15px_rgba(34,211,238,0.2)] flex flex-col items-center justify-center z-10 cursor-pointer transition-all ${
                  (!canSpin && !isSpinning) ? 'opacity-70 border-slate-700/80 cursor-not-allowed shadow-none' : ''
                }`}
              >
                <span className="text-[8px] font-mono font-black text-cyan-400 leading-none">SPIN</span>
                <RotateCw className={`w-4 h-4 text-cyan-400 mt-1 ${isSpinning ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Info column */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">DAILY SIGNAL · REPUTATION BOOST</h3>
            </div>
            
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Unlock supreme operational rewards! Spin the lucky wheel once every 24 hours to secure supplementary <span className="text-amber-400 font-bold font-mono">Building Culture Coins ($BCC)</span>, reactor energy fuel-ups, or permanent core power boosts.
            </p>

            <div className="bg-[#050506] border border-white/5 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-[10px] text-slate-500 block">SPIN COOLDOWN STATUS</span>
                  {canSpin ? (
                    <span className="text-emerald-400 font-bold">READY TO SPIN NOW</span>
                  ) : (
                    <span className="text-amber-400 font-bold">LOCKED (NEXT SPIN IN {hoursRemaining}H {minutesRemaining}M)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={spinWheel}
                  disabled={isSpinning || !canSpin}
                  className={`px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer transition-all ${
                    canSpin 
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-black' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isSpinning ? 'SPINNING...' : 'TRIGGER SPIN'}
                </button>

                {/* Q/A Override button */}
                {!canSpin && (
                  <button
                    onClick={overrideWheelCooldown}
                    className="p-2.5 bg-red-950/25 hover:bg-red-900/40 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-bold uppercase transition-all"
                    title="Bypass 24h spin timer for Q/A testing"
                  >
                    Bypass Cooldown
                  </button>
                )}
              </div>
            </div>

            {/* Prize win modal indicator embedded inside */}
            <AnimatePresence>
              {showPrizeModal && prizeIndexWon !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-950/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between gap-3 font-mono text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-bounce" />
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-widest">TRANSACTION CONFIRMED // MINT SUCCESS</span>
                      <span className="text-slate-200 font-bold">You won: <span className="text-emerald-400 font-black">{WHEEL_PRIZES[prizeIndexWon].label}</span>!</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPrizeModal(false)}
                    className="px-3 py-1 bg-emerald-500 text-black font-black text-[10px] rounded hover:bg-emerald-400 cursor-pointer"
                  >
                    DISMISS
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Quests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Missions Checklist */}
        <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <h4 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">DAILY STUDY TASKS & MISSIONS</h4>
          </div>

          <div className="space-y-3">
            {state.dailyMissions.map(mission => (
              <div
                key={mission.id}
                onClick={() => startQuestSimulation(mission)}
                className={`p-4 border rounded-2xl flex items-center justify-between gap-4 font-mono text-xs cursor-pointer select-none transition-all ${
                  mission.completed
                    ? 'bg-emerald-950/10 border-emerald-500/10 opacity-60'
                    : 'bg-[#050506] hover:bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={mission.completed ? 'text-emerald-400' : 'text-slate-500'}>
                    {mission.completed ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5 hover:text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">{mission.category} OPS</span>
                    <span className={`text-slate-200 ${mission.completed ? 'line-through text-slate-400' : ''}`}>
                      {mission.label}
                    </span>
                  </div>
                </div>

                {/* Energy & CP outputs */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">ENERGY RE-FUEL</span>
                  <span className="text-emerald-400 font-bold font-mono">+{mission.energyReward}% ENERGY</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Loading Telemetry */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              STUDY TASK VALIDATOR
            </h4>

            <AnimatePresence mode="wait">
              {runningQuestId ? (
                // Active uploading telemetry graphic
                <motion.div
                  key="quest-loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-[#050506] p-4 rounded-xl border border-cyan-500/20 text-center space-y-3 font-mono text-xs">
                    <span className="text-[10px] text-cyan-400 animate-pulse block">PROCESSING LEARNING RECORDS...</span>
                    
                    {/* Visual loading bar */}
                    <div className="w-full bg-[#0a0a0c] rounded-full h-3.5 border border-white/5 overflow-hidden relative">
                      <motion.div
                        style={{ width: `${questProgress}%` }}
                        className="bg-gradient-to-r from-cyan-500 to-indigo-600 h-full"
                      />
                    </div>

                    <span className="text-slate-300 block font-bold font-mono">{questProgress}% COMPLETE</span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono text-center leading-relaxed">
                    Verifying completed task parameters. Syncing study logs to mainnet rewards pools. Please wait.
                  </p>
                </motion.div>
              ) : (
                // Idle stasis details
                <motion.div
                  key="stasis-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center p-6 bg-[#050506] rounded-xl border border-white/5"
                >
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400 font-mono block">READY FOR STUDY SESSION</span>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono leading-relaxed">
                    Select any learning task or mission on the left to start focus validation and refuel node energy.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-slate-500 font-mono text-center">
            * Daily missions reset periodically to maintain consistent learning rhythms.
          </div>
        </div>

      </div>

    </div>
  );
}
