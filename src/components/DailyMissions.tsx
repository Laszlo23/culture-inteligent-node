/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckSquare, Square, Battery, Settings, Compass, Sparkles } from 'lucide-react';
import { GameState, DailyMission } from '../types';

interface DailyMissionsProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

export default function DailyMissions({ state, setState, addLog }: DailyMissionsProps) {
  const [runningQuestId, setRunningQuestId] = useState<string | null>(null);
  const [questProgress, setQuestProgress] = useState(0);

  const startQuestSimulation = (mission: DailyMission) => {
    if (mission.completed) return;
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

    addLog(`MAINTENANCE APPROVED: "${mission.label}" complete. +${mission.energyReward}% energy refueled. Grid online.`, 'success');
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

  return (
    <div id="missions-room" className="space-y-6">
      
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
                {state.energy < 40 ? '⚠ REACTOR RUNNING LOW' : '✔ REACTOR RUNNING NOMINAL'}
              </span>
            </div>
            <h3 className="text-sm font-mono font-bold text-slate-100 mt-1">
              CURRENT FACILITY GRID ENERGY: {state.energy}%
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-xl leading-relaxed">
              {state.energy < 40 
                ? 'Maintenance cycle is critical. Fuel levels are depleted. Operations will lock down if systems reach 0%. Complete objectives below to refuel!' 
                : 'Systems optimal. Continue logging attention sessions or completing tasks to preserve maximum stability.'
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
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">{mission.category} PORT</span>
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
