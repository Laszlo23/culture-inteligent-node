/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Handshake, CheckCircle2, Zap, ExternalLink } from 'lucide-react';
import { GameState } from '../types';
import EcosystemSlider from './EcosystemSlider';
import InteractiveDeck from './fx/InteractiveDeck';
import { PARTNERS_DECK } from '../lib/decks';

interface PartnerProgramProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

export default function PartnerProgram({ state, setState, addLog }: PartnerProgramProps) {
  const partners = state.partners || [];

  const handleEnlist = (partnerId: string) => {
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) return;

    if (state.credits < partner.bccRequired) {
      addLog(
        `PARTNER BRIDGE REJECTED: Insufficient Building Culture Coins ($BCC). Need ${partner.bccRequired} $BCC, but you have ${state.credits} $BCC.`,
        'warn'
      );
      return;
    }

    setState((prev) => {
      const updatedPartners = (prev.partners || []).map((p) => {
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
        additionalEff = 0.1;
      }

      return {
        ...prev,
        credits: prev.credits - partner.bccRequired,
        efficiency: prev.efficiency + additionalEff,
        miningPower: prev.miningPower + additionalPower,
        partners: updatedPartners,
      };
    });

    addLog(
      `COOPERATIVE BRIDGE ONLINE: Deployed ${partner.bccRequired} $BCC to establish node linkage with "${partner.name}". Perk activated: ${partner.bonus}!`,
      'success'
    );
  };

  const bookPilot = () => {
    addLog('PARTNER: Pilot inquiry opened — Attention Session path.', 'success');
    window.location.href = 'mailto:admin@buildingculture.space?subject=Attention%20Session%20pilot';
  };

  return (
    <div id="partner-program" className="space-y-6 max-w-4xl mx-auto">
      <InteractiveDeck
        slides={PARTNERS_DECK}
        mood="awakening"
        onCta={bookPilot}
      />

      <div className="flex flex-wrap gap-2">
        <a
          href="mailto:admin@buildingculture.space?subject=Attention%20Session%20pilot"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-[11px] font-black uppercase tracking-wider"
          onClick={() => addLog('PARTNER: Pilot inquiry opened — Attention Session path.', 'success')}
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

      <EcosystemSlider
        onSelect={(ally) =>
          addLog(`ECOSYSTEM SIGNAL: Inspecting ${ally.name} — ${ally.role}.`, 'info')
        }
      />

      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
        Ecosystem bridges · optional depth
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((partner) => (
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
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
                      {partner.role}
                    </span>
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

              {partner.wow && (
                <p className="mt-2 text-[11px] leading-snug text-cyan-200/90 font-sans border border-cyan-500/15 bg-cyan-500/5 rounded-lg px-2.5 py-2 line-clamp-2">
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
