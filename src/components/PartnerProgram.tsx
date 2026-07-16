/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Handshake, HelpCircle, Lock, CheckCircle2, ChevronRight, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { GameState, PartnerNode } from '../types';

interface PartnerProgramProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

export default function PartnerProgram({ state, setState, addLog }: PartnerProgramProps) {
  const partners = state.partners || [];

  const handleEnlist = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    if (state.credits < partner.bccRequired) {
      addLog(`PARTNER BRIDGE REJECTED: Insufficient Building Culture Coins ($BCC). Need ${partner.bccRequired} $BCC, but you have ${state.credits} $BCC.`, 'warn');
      return;
    }

    setState(prev => {
      // Toggle partner active
      const updatedPartners = (prev.partners || []).map(p => {
        if (p.id === partnerId) {
          return { ...p, active: true };
        }
        return p;
      });

      // Calculate new modifiers
      let additionalPower = 0;
      let additionalEff = 0;

      if (partnerId === 'p_1') {
        additionalEff = 0.05; // +5% efficiency
      } else if (partnerId === 'p_2') {
        additionalPower = 15; // +15 PH/s
      } else if (partnerId === 'p_3') {
        additionalEff = 0.10; // +10% efficiency boost
      }

      const newCredits = prev.credits - partner.bccRequired;
      const newEfficiency = prev.efficiency + additionalEff;
      
      // Keep state math intact: base power remains, we add partner power
      const newMiningPower = prev.miningPower + additionalPower;

      return {
        ...prev,
        credits: newCredits,
        efficiency: newEfficiency,
        miningPower: newMiningPower,
        partners: updatedPartners
      };
    });

    addLog(`COOPERATIVE BRIDGE ONLINE: Deployed ${partner.bccRequired} $BCC to establish node linkage with "${partner.name}". Perk activated: ${partner.bonus}!`, 'success');
  };

  return (
    <div id="partner-program" className="space-y-6 max-w-4xl mx-auto">
      {/* Intro Header */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-4">
          <Handshake className="w-5 h-5 text-amber-400" />
          <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">COOPERATIVE NODE BRIDGE</h3>
        </div>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Link your culture node with pre-authenticated external Web3 cooperatives, developer organizations, and decentralized liquidity aggregates. By depositing and locking up a specified allotment of your earned <span className="text-amber-400 font-bold font-mono">Building Culture Coins ($BCC)</span>, you establish a permanent ledger pipeline that unlocks severe operational boosts.
        </p>
      </div>

      {/* Grid of Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map(partner => (
          <div
            key={partner.id}
            className={`bg-[#0a0a0c] border rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
              partner.active 
                ? 'border-emerald-500/30 bg-gradient-to-b from-[#0a0a0c] to-emerald-950/5' 
                : 'border-white/5 hover:border-amber-500/30'
            }`}
          >
            <div>
              {/* Partner Logo */}
              <div className="relative w-full h-28 rounded-xl overflow-hidden mb-4 border border-white/5 bg-slate-900">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent" />
                
                {partner.active && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-black text-[8px] font-black tracking-widest rounded uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE BRIDGE
                  </span>
                )}
              </div>

              <h4 className="font-sans text-sm font-bold text-white tracking-tight">{partner.name}</h4>
              <p className="text-[11px] text-slate-400 font-sans mt-1.5 leading-relaxed min-h-[44px]">
                {partner.description}
              </p>
            </div>

            {/* Metrics & Activation */}
            <div className="mt-5 pt-3 border-t border-white/5 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between items-center bg-[#050506]/80 p-2 rounded-lg border border-white/[0.02]">
                <span className="text-slate-500 text-[9px] uppercase">OPERATIONAL PERK</span>
                <span className="text-cyan-400 font-bold text-right">{partner.bonus}</span>
              </div>

              {partner.active ? (
                <div className="w-full py-2 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-center font-bold rounded-xl text-[10px] tracking-wider uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> BRIDGE LINKED NOMINAL
                </div>
              ) : (
                <button
                  onClick={() => handleEnlist(partner.id)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-black text-center rounded-xl text-[10px] cursor-pointer tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" /> LINK BRIDGE ({partner.bccRequired} BCC)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
