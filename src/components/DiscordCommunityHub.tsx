/**
 * Discord Community Hub — shared surface for Onboarding + Guild + profile CTAs.
 * One server holds welcome, hearing ritual, builders, apex houses, partners.
 */

import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Hash, MessageCircle, Users, Radio } from 'lucide-react';
import {
  DISCORD_CHANNELS,
  DISCORD_FACTION_HOUSES,
  DISCORD_INVITE_URL,
  factionHouseByGuildId,
  openDiscord,
} from '../lib/discord-community';
import { COMMUNITY_LINKS } from '../lib/community-invite';
import { BRAND, SLOGANS } from '../lib/brand-slogans';

function telegramBotUrl(): string | null {
  const u = String(import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '')
    .trim()
    .replace(/^@/, '');
  return u ? `https://t.me/${u}` : null;
}

type Variant = 'full' | 'compact' | 'strip';

type Props = {
  variant?: Variant;
  /** Highlight enlisted house channel */
  activeGuildId?: string | null;
  onOpenGuild?: () => void;
  onJoinLogged?: (channel: string) => void;
};

export default function DiscordCommunityHub({
  variant = 'full',
  activeGuildId = null,
  onOpenGuild,
  onJoinLogged,
}: Props) {
  const activeHouse = activeGuildId ? factionHouseByGuildId(activeGuildId) : undefined;

  const join = (href: string, label: string) => {
    onJoinLogged?.(label);
    openDiscord(href);
  };

  if (variant === 'strip') {
    return (
      <div className="rounded-xl border border-indigo-400/30 bg-indigo-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-400/40 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-black tracking-[0.2em] uppercase text-indigo-300/90">
              Discord · community home
            </p>
            <p className="text-[12px] text-slate-300 font-sans leading-snug mt-0.5">
              All houses, Hearing ritual, and partners live in one server.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => join(DISCORD_INVITE_URL, '#welcome')}
          className="px-3.5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5 shrink-0"
        >
          Join Discord
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="rounded-2xl border border-indigo-400/25 bg-[#0a0a0e]/95 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-indigo-300" />
            <span className="text-[10px] font-mono font-black tracking-widest uppercase text-slate-200">
              Discord HQ
            </span>
          </div>
          <button
            type="button"
            onClick={() => join(DISCORD_INVITE_URL, '#welcome')}
            className="text-[10px] font-mono text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 cursor-pointer"
          >
            Open server <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        {activeHouse && (
          <p className="text-[11px] text-slate-400 font-sans">
            Your house · <span className="text-indigo-200 font-mono">{activeHouse.channel}</span>
            {' · '}
            <button
              type="button"
              onClick={() => join(activeHouse.href, activeHouse.channel)}
              className="text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
            >
              meet them in Discord
            </button>
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {DISCORD_CHANNELS.slice(0, 4).map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => join(ch.href, ch.name)}
              className="px-2 py-1 rounded-md border border-white/10 bg-white/5 text-[9px] font-mono text-slate-300 hover:border-indigo-400/40 hover:text-indigo-200 cursor-pointer inline-flex items-center gap-1"
            >
              <Hash className="w-2.5 h-2.5" />
              {ch.name.replace(/^#/, '')}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-indigo-400/30 bg-[#08080c] overflow-hidden"
    >
      <div className="relative p-5 md:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,_rgba(99,102,241,0.18),_transparent_55%)] pointer-events-none" />
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="text-[9px] font-mono font-black tracking-[0.22em] uppercase text-indigo-300 inline-flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Discord · {BRAND.parent} community
              </span>
              <h3 className="font-display text-2xl font-extrabold italic text-white mt-1.5 tracking-tight">
                One server. Every house.
              </h3>
              <p className="text-sm text-slate-400 font-sans mt-2 leading-relaxed">
                Onboarding, faction houses, Hearing ritual, and partner pilots all meet in Discord —
                not scattered across ten apps. {SLOGANS.spread}
              </p>
            </div>
            <button
              type="button"
              onClick={() => join(DISCORD_INVITE_URL, '#welcome')}
              className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-[11px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 shadow-[0_0_24px_rgba(99,102,241,0.35)]"
            >
              Join Discord HQ
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DISCORD_CHANNELS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => join(ch.href, ch.name)}
                className="text-left rounded-xl border border-white/10 bg-black/40 hover:border-indigo-400/40 px-3.5 py-3 cursor-pointer transition-colors"
              >
                <span className="text-[11px] font-mono font-bold text-indigo-200 inline-flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {ch.name.replace(/^#/, '')}
                </span>
                <span className="block text-[11px] text-slate-500 font-sans mt-1 leading-snug">
                  {ch.job}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-white/8 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[9px] font-mono font-black tracking-widest uppercase text-slate-400 inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Faction houses in Discord
              </span>
              {onOpenGuild && (
                <button
                  type="button"
                  onClick={onOpenGuild}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  Apex Summit →
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {DISCORD_FACTION_HOUSES.map((h) => {
                const mine = h.guildId === activeGuildId;
                return (
                  <div
                    key={h.guildId}
                    className={`rounded-xl border px-3 py-3 ${
                      mine
                        ? 'border-cyan-400/40 bg-cyan-950/25'
                        : 'border-white/8 bg-[#050506]'
                    }`}
                  >
                    <span className="text-[12px] font-bold text-white font-sans block">
                      {h.name}
                    </span>
                    <span className="text-[9px] font-mono text-indigo-300/90 block mt-0.5">
                      {h.channel} · {h.role}
                    </span>
                    <p className="text-[11px] text-slate-500 font-sans mt-1.5 leading-snug">
                      {h.blurb}
                    </p>
                    <button
                      type="button"
                      onClick={() => join(h.href, h.channel)}
                      className="mt-2 text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      Open in Discord <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-950/15 px-4 py-3">
            <span className="text-[9px] font-mono font-black tracking-widest uppercase text-cyan-300/90 block">
              Attention Miner · chat bots
            </span>
            <p className="text-[12px] text-slate-300 font-sans mt-1.5 leading-relaxed">
              Mine knowledge in Discord or Telegram: <span className="font-mono text-cyan-200">/spark</span>{' '}
              · <span className="font-mono text-cyan-200">/claim</span> ·{' '}
              <span className="font-mono text-cyan-200">/hear</span>. Same loop — settle fuel in the app.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => join(DISCORD_INVITE_URL, '#welcome')}
                className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-300 hover:text-indigo-200 cursor-pointer"
              >
                Discord · /spark in HQ →
              </button>
              {telegramBotUrl() ? (
                <a
                  href={telegramBotUrl()!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-300 hover:text-sky-200"
                >
                  Open Telegram bot →
                </a>
              ) : (
                <a
                  href={COMMUNITY_LINKS.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-300 hover:text-sky-200"
                >
                  Telegram group →
                </a>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-600 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Radio className="w-3 h-3" />
              Telegram pulse ·{' '}
              <a
                href={COMMUNITY_LINKS.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-cyan-300"
              >
                daily ritual
              </a>
            </span>
            <span>Discord holds the houses.</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
