/**
 * Discoverable growth toys — Trap ID · Culture Name · Invite card.
 * Keeps viral loops findable on Home, not buried in nav.
 */

import React from 'react';
import { Pickaxe, Share2, Sparkles, UserPlus } from 'lucide-react';
import { SLOGANS } from '../lib/brand-slogans';

type Props = {
  cultureName: string | null;
  onTrapId: () => void;
  onCultureName: () => void;
  onInvite: () => void;
};

export default function GrowthFunStrip({
  cultureName,
  onTrapId,
  onCultureName,
  onInvite,
}: Props) {
  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/10 via-black/40 to-amber-500/10 px-4 py-3.5">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-cyan-300/90">
        Grow the base · have fun
      </p>
      <p className="mt-1.5 text-[12px] text-slate-300/90 leading-snug">
        Shareable moments that pull friends in — not ads.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onTrapId}
          className="text-left rounded-xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2.5 cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Trap ID
          </span>
          <span className="mt-1 block text-[11px] text-slate-400 leading-snug">
            {SLOGANS.trapIdSub}
          </span>
        </button>
        <button
          type="button"
          onClick={onCultureName}
          className="text-left rounded-xl border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-2.5 cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-cyan-200">
            <Pickaxe className="w-3.5 h-3.5" />
            {cultureName ? cultureName : 'Culture Name'}
          </span>
          <span className="mt-1 block text-[11px] text-slate-400 leading-snug">
            {cultureName
              ? 'Yours everywhere — share the card'
              : SLOGANS.cultureNameSub}
          </span>
        </button>
        <button
          type="button"
          onClick={onInvite}
          className="text-left rounded-xl border border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2.5 cursor-pointer"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-rose-200">
            <UserPlus className="w-3.5 h-3.5" />
            Invite
          </span>
          <span className="mt-1 block text-[11px] text-slate-400 leading-snug">
            Share a growth card — friends land with your code
          </span>
        </button>
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
        <Share2 className="w-3 h-3" />
        Fun first · growth compounds
      </p>
    </div>
  );
}
