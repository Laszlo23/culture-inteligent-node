/**
 * Shareable Human Passport card — growth engine.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Share2 } from 'lucide-react';
import type { HumanScores } from '../lib/human-economy';
import { BRAND } from '../lib/brand-slogans';
import {
  achievementsFromScores,
  buildPassportCastCompose,
  buildPassportShareText,
  passportShareUrl,
} from '../lib/passport-share';
import { markPassportShared } from '../lib/first-contribution';
import { track } from '../lib/attention-metrics';
import { copyTextFallback } from '../lib/culture-broadcast';

type Props = {
  name: string;
  scores: HumanScores;
  compact?: boolean;
  onShared?: () => void;
};

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const blocks = Math.max(1, Math.min(10, Math.round(value / 10)));
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm ${i < blocks ? color : 'bg-white/8'}`}
          />
        ))}
      </div>
      <span className="w-7 text-right font-mono text-[11px] text-slate-300">{value}</span>
    </div>
  );
}

export default function PassportShareCard({ name, scores, compact = false, onShared }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const handle = name.replace(/^@/, '');
  const creativity = scores.creativity ?? scores.builder;
  const achievements = achievementsFromScores(scores);
  const payload = { name: handle, scores, achievements };
  const url = passportShareUrl(payload);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const afterShare = () => {
    markPassportShared();
    track('passport_share', { value: scores.humanValue });
    onShared?.();
  };

  const copyLink = async () => {
    const text = buildPassportShareText(payload, url);
    try {
      await copyTextFallback(text);
      flash('Passport copied — share it.');
      afterShare();
    } catch {
      flash('Copy failed — try Cast.');
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${handle} · Human Passport`,
          text: buildPassportShareText(payload, url),
          url,
        });
        afterShare();
        flash('Shared.');
        return;
      } catch {
        // fall through
      }
    }
    await copyLink();
  };

  const cast = () => {
    window.open(buildPassportCastCompose(payload), '_blank', 'noopener,noreferrer');
    afterShare();
    flash('Cast compose open.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-cyan-400/35 bg-[#06080c] overflow-hidden ${
        compact ? 'p-4' : 'p-5 md:p-6 shadow-[0_0_40px_rgba(34,211,238,0.1)]'
      }`}
    >
      <p className="font-mono text-[9px] font-black tracking-[0.24em] uppercase text-cyan-400/90">
        {BRAND.passport}
      </p>
      <h3 className="mt-1 font-display text-2xl font-extrabold italic text-white">{handle}</h3>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
        Human Value Score
      </p>
      <p className="font-display text-5xl font-bold italic text-white leading-none mt-1">
        {scores.humanValue}
      </p>

      <div className="mt-5 space-y-2.5">
        <Bar label="Knowledge" value={scores.knowledge} color="bg-cyan-400" />
        <Bar label="Creativity" value={creativity} color="bg-amber-400" />
        <Bar label="Contribution" value={scores.contribution} color="bg-rose-400" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {achievements.map((a) => (
          <span
            key={a}
            className="px-2 py-1 rounded-md border border-white/10 bg-white/[0.03] text-[10px] font-mono text-slate-400 uppercase tracking-wider"
          >
            {a}
          </span>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-slate-500 font-mono tracking-wide">
        Verified on {BRAND.parent}
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          See my Human Passport
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
        <button
          type="button"
          onClick={cast}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-purple-400/30 text-purple-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
        >
          Cast
        </button>
      </div>
      {toast && (
        <p className="mt-2 text-[11px] text-cyan-300 font-mono inline-flex items-center gap-1">
          <Check className="w-3 h-3" />
          {toast}
        </p>
      )}
    </motion.div>
  );
}
