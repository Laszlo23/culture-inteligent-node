/**
 * Discord Community Hub — shared surface for Onboarding + Guild + profile CTAs.
 * Full variant opens with an InteractiveDeck; actions stay one tap away.
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
import { BRAND } from '../lib/brand-slogans';
import InteractiveDeck from './fx/InteractiveDeck';
import { DISCORD_DECK } from '../lib/decks';

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
          <div>
            <p className="font-mono text-[9px] font-black tracking-[0.2em] uppercase text-indigo-300">
              Discord · {BRAND.parent}
            </p>
            <p className="text-sm text-white font-display italic font-bold mt-0.5">One server. Every house.</p>
          </div>
          <button
            type="button"
            onClick={() => join(DISCORD_INVITE_URL, '#welcome')}
            className="px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-[9px] font-black uppercase tracking-wider cursor-pointer shrink-0"
          >
            Join
          </button>
        </div>
        {activeHouse && (
          <p className="text-[11px] text-slate-400 font-sans">
            Your house ·{' '}
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
      className="space-y-5"
    >
      <InteractiveDeck
        slides={DISCORD_DECK}
        mood="opening"
        onCta={() => join(DISCORD_INVITE_URL, '#welcome')}
      />

      <div className="rounded-2xl border border-indigo-400/30 bg-[#08080c] overflow-hidden p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[9px] font-mono font-black tracking-[0.22em] uppercase text-indigo-300 inline-flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Channels
          </span>
          <button
            type="button"
            onClick={() => join(DISCORD_INVITE_URL, '#welcome')}
            className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-2"
          >
            Join Discord HQ
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {DISCORD_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => join(ch.href, ch.name)}
              className="px-3 py-2 rounded-xl border border-white/10 bg-black/40 hover:border-indigo-400/40 text-[11px] font-mono font-bold text-indigo-200 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Hash className="w-3 h-3" />
              {ch.name.replace(/^#/, '')}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/8 bg-black/30 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[9px] font-mono font-black tracking-widest uppercase text-slate-400 inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Faction houses
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
          <div className="flex flex-wrap gap-2">
            {DISCORD_FACTION_HOUSES.map((h) => {
              const mine = h.guildId === activeGuildId;
              return (
                <button
                  key={h.guildId}
                  type="button"
                  onClick={() => join(h.href, h.channel)}
                  className={`px-3 py-2 rounded-xl border text-left cursor-pointer transition-colors ${
                    mine
                      ? 'border-cyan-400/40 bg-cyan-950/25'
                      : 'border-white/8 bg-[#050506] hover:border-indigo-400/30'
                  }`}
                >
                  <span className="text-[12px] font-bold text-white font-sans block">{h.name}</span>
                  <span className="text-[9px] font-mono text-indigo-300/90 block mt-0.5">
                    {h.channel}
                  </span>
                </button>
              );
            })}
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
    </motion.div>
  );
}
