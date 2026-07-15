/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, TrendingUp, Sparkles, RefreshCw, Layers, ShieldCheck, Download } from 'lucide-react';
import { GameState } from '../types';

interface TreasuryProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

export default function Treasury({ state, setState, addLog }: TreasuryProps) {
  const [ticker, setTicker] = useState(0);

  // Passive real-time rewards accumulation engine
  useEffect(() => {
    const timer = setInterval(() => {
      // Rewards generated depend directly on mining power, efficiency and energy level (depleted energy lowers output!)
      const energyMultiplier = state.energy / 100;
      const powerPower = state.miningPower;
      const eff = state.efficiency;

      // Accumulator increment
      const increment = parseFloat((powerPower * eff * energyMultiplier * 0.015).toFixed(4));
      
      setState(prev => {
        if (prev.energy <= 0) return prev; // No passive generation when fully depleted
        return {
          ...prev,
          accumulatedRewards: parseFloat((prev.accumulatedRewards + increment).toFixed(4))
        };
      });

      setTicker(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state.miningPower, state.efficiency, state.energy]);

  const claimRewards = () => {
    if (state.accumulatedRewards <= 0) {
      addLog("CLAIM DENIED: Zero balances in the secure compiler buffer.", "warn");
      return;
    }

    const claimedVal = Math.floor(state.accumulatedRewards);
    setState(prev => ({
      ...prev,
      credits: prev.credits + claimedVal,
      ecosystemRewards: prev.ecosystemRewards + claimedVal,
      accumulatedRewards: parseFloat((prev.accumulatedRewards - claimedVal).toFixed(4))
    }));

    addLog(`TREASURY TRANSFERRED: claimed ${claimedVal} tokens into active asset balances. Core updated.`, "success");
  };

  // Projections
  const dailyProjection = (state.miningPower * state.efficiency * (state.energy / 100) * 0.015 * 60 * 60 * 24).toFixed(0);

  return (
    <div id="treasury-room" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Real-time Ticker Vault */}
      <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">ECOSYSTEM REWARDS VAULT</h3>
          </div>

          <p className="text-xs text-slate-400 font-sans mb-8 leading-relaxed">
            Your active cyber operations generate passive ecosystem rewards continuously. Claims can be made instantly into your credit balance to upgrade components or enlist AI assistants.
          </p>

          {/* Huge ticking number display */}
          <div className="bg-[#050506] border border-white/5 p-8 rounded-2xl text-center relative overflow-hidden">
            <span className="text-[10px] font-mono text-slate-500 tracking-widest block uppercase">UNCLAIMED REWARDS BUFFER</span>
            
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-4xl lg:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 tracking-tight">
                {state.accumulatedRewards.toFixed(3)}
              </span>
              <span className="text-sm font-mono text-emerald-400 font-bold tracking-widest animate-pulse">SOL_M</span>
            </div>

            <p className="text-[10px] text-slate-500 font-mono mt-2 leading-relaxed">
              Ticking live • Current power factors: {(state.miningPower).toFixed(1)} PH/s at {state.energy}% Core Power
            </p>
          </div>
        </div>

        {/* Claim button */}
        <div className="mt-6">
          <button
            onClick={claimRewards}
            disabled={state.accumulatedRewards < 1.0}
            className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
              state.accumulatedRewards >= 1.0
                ? 'bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-700 text-slate-950 shadow-lg shadow-emerald-950/40 font-bold'
                : 'bg-[#050506] border border-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            CLAIM ACCUMULATED REWARDS (CP)
          </button>
        </div>
      </div>

      {/* Strategy and Projection sidebar */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            YIELD METRICS & PROJECTIONS
          </h4>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#050506] p-3.5 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-500 block uppercase">24H ESTIMATED HARVEST</span>
              <span className="text-sm font-bold text-slate-100">{dailyProjection} CREDITS / DAY</span>
            </div>

            <div className="bg-[#050506] p-3.5 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-500 block uppercase">TOTAL REWARDS HARVESTED</span>
              <span className="text-sm font-bold text-emerald-400">{state.ecosystemRewards} CREDITS</span>
            </div>

            <div className="bg-[#050506] p-3.5 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-500 block uppercase">VAULT SECURITY</span>
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-1 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>SECURE COLD VAULT ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-slate-500 font-mono text-center">
          * Dynamic Point yield fluctuates depending on active mining rate, multiplier, and core energy level.
        </div>
      </div>

    </div>
  );
}
