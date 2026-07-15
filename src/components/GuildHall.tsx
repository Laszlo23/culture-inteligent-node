/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Trophy, ChevronRight, Sparkles, Activity, Check } from 'lucide-react';
import { GameState, Guild } from '../types';

interface GuildHallProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

export default function GuildHall({ state, setState, addLog }: GuildHallProps) {

  const selectGuild = (guildId: string) => {
    setState(prev => {
      const updatedGuilds = prev.guilds.map(g => ({
        ...g,
        selected: g.id === guildId
      }));

      // Give a 10% boost to mining power if guild is active
      const currentHardwarePower = prev.hardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 0);
      
      const currentWorkerPower = prev.workers
        .filter(w => w.unlocked)
        .reduce((sum, w) => sum + w.powerBonus, 0);

      // Base rate
      const baseCombined = 4.8 + currentHardwarePower + currentWorkerPower;
      const finalPower = baseCombined * 1.10; // apply 10% guild war bonus

      return {
        ...prev,
        guilds: updatedGuilds,
        miningPower: parseFloat(finalPower.toFixed(1))
      };
    });

    const newlyJoined = state.guilds.find(g => g.id === guildId);
    if (newlyJoined) {
      addLog(`GUILD ALIGNMENT SECURED: Enlisted with Faction: "${newlyJoined.name}". +10% Mining Power Bonus activated.`, 'success');
    }
  };

  const getActiveGuild = () => state.guilds.find(g => g.selected);

  return (
    <div id="guild-hall-room" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Competitions leaderboard */}
      <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">GLOBAL GUILD LEADERBOARD</h3>
          </div>
          <span className="font-mono text-[10px] text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded-lg border border-amber-500/20 animate-pulse">
            3D 14H REMAINING
          </span>
        </div>

        {/* List of Guilds */}
        <div className="space-y-3 font-mono text-xs">
          {state.guilds.map((g, index) => (
            <div
              key={g.id}
              className={`p-3.5 border rounded-2xl flex flex-wrap items-center justify-between gap-4 transition-all ${
                g.selected
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-md shadow-cyan-950/10'
                  : 'bg-[#050506] hover:bg-white/[0.02] border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Ranking */}
                <span className="text-slate-500 font-bold text-sm w-4">#{index + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-[#050506] border border-white/10 flex items-center justify-center">
                  <Shield className={`w-4.5 h-4.5 ${g.selected ? 'text-cyan-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-bold">{g.name} Faction</span>
                    {g.selected && (
                      <span className="bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">
                        My Guild
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">Region: {g.region} • Members: {g.members}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 block">WEEKLY HASH</span>
                  <span className="text-slate-100 font-bold">{g.output} EH/s</span>
                </div>
                
                {g.selected ? (
                  <div className="w-24 py-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    ENLISTED
                  </div>
                ) : (
                  <button
                    onClick={() => selectGuild(g.id)}
                    className="w-24 py-2 bg-[#050506] hover:bg-white/[0.03] border border-white/10 text-slate-300 hover:text-slate-100 rounded-xl text-center text-[10px] font-bold cursor-pointer transition-all"
                  >
                    JOIN FACTION
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guild Perks Detail */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            GUILD MEMBERSHIP & PERKS
          </h4>

          {getActiveGuild() ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#050506] p-4 border border-white/5 rounded-2xl text-center">
                <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <h5 className="font-bold text-slate-100 text-sm">Active Enlistment: {getActiveGuild()?.name}</h5>
                <p className="text-[10px] text-slate-500 mt-1">Active Faction Team Participant</p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#050506] p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-500 block uppercase">Alliance Bonus</span>
                  <span className="text-emerald-400 font-bold">{getActiveGuild()?.bonus}</span>
                </div>

                <div className="bg-[#050506] p-3 rounded-xl border border-white/5">
                  <span className="text-[9px] text-slate-500 block uppercase">Faction Active Perk</span>
                  <span className="text-cyan-400 font-bold">+10% GLOBAL FACILITY POWER</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 font-mono text-xs text-slate-500 space-y-3">
              <Shield className="w-8 h-8 text-slate-700 mx-auto animate-pulse" />
              <span>No active Faction alignment detected. Select a guild on the left to gain immediate system buffs.</span>
            </div>
          )}
        </div>

        <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-slate-500 font-mono text-center">
          * Guild performance updates globally in real-time.
        </div>
      </div>

    </div>
  );
}
