/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Handshake, CheckCircle2, Zap, ExternalLink } from 'lucide-react';
import { GameState } from '../types';
import EcosystemSlider from './EcosystemSlider';

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
      const updatedPartners = (prev.partners || []).map(p => {
        if (p.id === partnerId) {
          return { ...p, active: true };
        }
        return p;
      });

      let additionalPower = 0;
      let additionalEff = 0;

      if (partnerId === 'p_1') {
        additionalEff = 0.05;
      } else if (partnerId === 'p_2') {
        additionalPower = 15;
      } else if (partnerId === 'p_3') {
        additionalEff = 0.10;
      }

      const newCredits = prev.credits - partner.bccRequired;
      const newEfficiency = prev.efficiency + additionalEff;
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
      {/* First-dollar path — Attention Session pilot */}
      <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-950/40 via-[#0a0a0c] to-cyan-950/30 p-6 md:p-7 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(245,158,11,0.12),transparent_50%)] pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[9px] font-mono font-black tracking-[0.22em] uppercase text-amber-300">
            First dollar · Partner Attention Session
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white mt-2 tracking-tight">
            Ship your insight. Measure attention.
          </h2>
          <p className="text-sm text-slate-300 font-sans mt-2 max-w-xl leading-relaxed">
            We drop your session into Culture Node — learn → Zen → Proof of Attention → Spread.
            Pilot week <span className="text-amber-200 font-semibold">$0–$1.5k or trade</span>.
            Free First Spark stays free. No empty banner takeovers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="mailto:admin@buildingculture.space?subject=Attention%20Session%20pilot"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-[11px] font-black uppercase tracking-wider"
              onClick={() =>
                addLog('PARTNER: Pilot inquiry opened — Attention Session path.', 'success')
              }
            >
              <Handshake className="w-4 h-4" />
              Book pilot week
            </a>
            <a
              href="https://mining.buildingcultureid.space/?hear=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider"
            >
              Demo Hearing <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="mt-3 text-[10px] font-mono text-slate-500">
            Packages after pilot: Single $1.5–5k · Hearing week $3–8k · Always-on $3–12k/mo
          </p>
        </div>
      </div>

      <EcosystemSlider
        onSelect={(ally) =>
          addLog(`ECOSYSTEM SIGNAL: Inspecting ${ally.name} — ${ally.role}.`, 'info')
        }
      />

      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
          <Handshake className="w-5 h-5 text-amber-400" />
          <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
            ECOSYSTEM BRIDGES (optional depth)
          </h3>
        </div>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          After the pilot path: link Solana-native rails for settlement depth. Cash starts with
          Attention Sessions above — bridges are operational boosts, not the brand.
        </p>
      </div>

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
              <div className="relative w-full h-28 rounded-xl overflow-hidden mb-4 border border-white/5 bg-[#050508] flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,241,149,0.12),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(153,69,255,0.12),transparent_50%)]" />
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  className="relative z-10 w-16 h-16 object-contain drop-shadow-lg"
                />

                {partner.active && (
                  <span className="absolute top-2 right-2 z-20 px-2 py-0.5 bg-emerald-500 text-black text-[8px] font-black tracking-widest rounded uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE BRIDGE
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-sans text-sm font-bold text-white tracking-tight">{partner.name}</h4>
                  {partner.role && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">{partner.role}</span>
                  )}
                </div>
                {partner.url && (
                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-lg border border-white/10 text-slate-500 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors"
                    aria-label={`Open ${partner.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <p className="text-[11px] text-slate-400 font-sans mt-1.5 leading-relaxed min-h-[44px]">
                {partner.description}
              </p>

              {partner.wow && (
                <p className="mt-2 text-[11px] leading-relaxed text-cyan-200/90 font-sans border border-cyan-500/15 bg-cyan-500/5 rounded-lg px-2.5 py-2">
                  <span className="font-mono text-[8px] font-black uppercase tracking-widest text-cyan-400 block mb-0.5">
                    Surprising fact
                  </span>
                  {partner.wow}
                </p>
              )}
            </div>

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
