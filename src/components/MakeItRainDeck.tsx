/**
 * Make it rain — one surface to cast, pin, DM, and book the weekly ritual.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  CloudRain,
  Copy,
  ExternalLink,
  MessageCircle,
  Radio,
  Sparkles,
} from 'lucide-react';
import FarcasterCastButton from './FarcasterCastButton';
import {
  RAIN_CAST_SEQUENCE,
  getCastTemplate,
  openFarcasterCompose,
  type CastTemplateId,
} from '../lib/farcaster';
import {
  DISCORD_PIN_COPY,
  TELEGRAM_PIN_COPY,
  RAIN_TASKS,
  markRainTask,
  rainDoneCount,
  readRainProgress,
  toggleRainTask,
  type RainProgress,
} from '../lib/rain-checklist';
import { DISCORD_INVITE_URL } from '../lib/discord-community';
import { COMMUNITY_LINKS } from '../lib/community-invite';
import { track } from '../lib/attention-metrics';
import { BRAND, SLOGANS } from '../lib/brand-slogans';

type Props = {
  compact?: boolean;
  onOpenPartners?: () => void;
  onOpenHearing?: () => void;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function MakeItRainDeck({
  compact = false,
  onOpenPartners,
  onOpenHearing,
}: Props) {
  const [progress, setProgress] = useState<RainProgress>(() => readRainProgress());
  const [toast, setToast] = useState<string | null>(null);
  const done = rainDoneCount(progress);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const rainAll = () => {
    const first = getCastTemplate('rain');
    openFarcasterCompose(first.text, first.embedUrl);
    setProgress(markRainTask('cast_rain', true));
    track('rain_cast', { template: 'rain', burst: true });
    flash('Compose open — post it. Then hit the next casts.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-cyan-400/35 bg-[#06080c] overflow-hidden ${
        compact ? '' : 'shadow-[0_0_40px_rgba(34,211,238,0.12)]'
      }`}
    >
      <div className="relative p-4 md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(34,211,238,0.14),transparent_50%),radial-gradient(ellipse_at_90%_100%,rgba(245,158,11,0.1),transparent_45%)] pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-[9px] font-mono font-black tracking-[0.22em] uppercase text-cyan-300 inline-flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5" />
                Make it rain · {BRAND.parent}
              </span>
              <h3 className="font-display text-xl md:text-2xl font-extrabold italic text-white mt-1 tracking-tight">
                Cast. Pin. Invite. Host.
              </h3>
              <p className="text-[12px] text-slate-400 font-sans mt-1 max-w-lg leading-relaxed">
                {SLOGANS.loop} Distribution beats ads. {done}/{RAIN_TASKS.length} ritual beats done
                this week.
              </p>
            </div>
            <button
              type="button"
              onClick={rainAll}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[11px] font-black uppercase tracking-wider cursor-pointer shadow-[0_0_28px_rgba(34,211,238,0.4)]"
            >
              <Sparkles className="w-4 h-4" />
              Rain cast now
            </button>
          </div>

          {!compact && (
            <div className="flex flex-wrap gap-2">
              {RAIN_CAST_SEQUENCE.map((id: CastTemplateId) => {
                const t = getCastTemplate(id);
                return (
                  <FarcasterCastButton
                    key={id}
                    templateId={id}
                    variant="compact"
                    label={t.title}
                    onCast={() => {
                      if (id === 'rain' || id === 'launch') {
                        setProgress(markRainTask('cast_rain', true));
                      }
                      if (id === 'hearing' || id === 'weekly_hearing') {
                        setProgress(markRainTask('cast_hearing', true));
                      }
                      if (id === 'partner_pilot') {
                        setProgress(markRainTask('partner_outreach', true));
                      }
                      track('rain_cast', { template: id });
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText(DISCORD_PIN_COPY);
                setProgress(markRainTask('pin_discord', true));
                flash(ok ? 'Discord pin copied' : 'Copy failed');
                track('rain_pin', { channel: 'discord' });
              }}
              className="text-left rounded-xl border border-indigo-400/30 bg-indigo-950/20 hover:bg-indigo-950/35 px-3.5 py-3 cursor-pointer"
            >
              <span className="text-[10px] font-mono font-bold text-indigo-200 inline-flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Copy Discord pin
              </span>
              <span className="block text-[11px] text-slate-500 mt-1">
                #welcome · Hearing · /spark
              </span>
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText(TELEGRAM_PIN_COPY);
                setProgress(markRainTask('pin_telegram', true));
                flash(ok ? 'Telegram pin copied' : 'Copy failed');
                track('rain_pin', { channel: 'telegram' });
              }}
              className="text-left rounded-xl border border-sky-400/30 bg-sky-950/20 hover:bg-sky-950/35 px-3.5 py-3 cursor-pointer"
            >
              <span className="text-[10px] font-mono font-bold text-sky-200 inline-flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Copy Telegram pin
              </span>
              <span className="block text-[11px] text-slate-500 mt-1">Weekly Hearing pulse</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-[9px] font-mono text-slate-300 hover:text-indigo-200 uppercase tracking-wider"
            >
              Open Discord <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={COMMUNITY_LINKS.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-[9px] font-mono text-slate-300 hover:text-sky-200 uppercase tracking-wider"
            >
              Open Telegram <ExternalLink className="w-3 h-3" />
            </a>
            {onOpenHearing && (
              <button
                type="button"
                onClick={() => {
                  onOpenHearing();
                  setProgress(markRainTask('hearing_live', true));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-[9px] font-mono text-cyan-200 uppercase tracking-wider cursor-pointer"
              >
                Start Hearing demo
              </button>
            )}
            {onOpenPartners && (
              <button
                type="button"
                onClick={() => {
                  onOpenPartners();
                  setProgress(markRainTask('partner_outreach', true));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-400/30 bg-amber-500/10 text-[9px] font-mono text-amber-200 uppercase tracking-wider cursor-pointer"
              >
                Partner pilot
              </button>
            )}
          </div>

          <ul className="space-y-1.5 border-t border-white/5 pt-3">
            {RAIN_TASKS.map((task) => {
              const on = progress[task.id];
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setProgress(toggleRainTask(task.id))}
                    className="w-full flex items-center gap-2.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.03] cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        on
                          ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/15 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`text-[12px] font-sans block ${
                          on ? 'text-slate-400 line-through' : 'text-slate-200'
                        }`}
                      >
                        {task.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600">{task.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {toast && (
            <p className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
              <Copy className="w-3 h-3" />
              {toast}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
