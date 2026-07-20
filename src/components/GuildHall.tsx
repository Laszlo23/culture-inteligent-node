/**
 * Community · Apex Summit — monthly chamber for the top of the top + faction houses.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Users,
  Trophy,
  Crown,
  Sparkles,
  Check,
  Timer,
  Star,
  Lock,
  ChevronRight,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { GameState } from '../types';
import {
  buildApexCircle,
  currentApexMonth,
  msUntil,
  qualifyForApex,
  readApexClaim,
  writeApexClaim,
} from '../lib/apex-summit';
import {
  factionHouseByGuildId,
  openDiscord,
} from '../lib/discord-community';
import DiscordCommunityHub from './DiscordCommunityHub';

interface GuildHallProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  currentUser?: { username: string } | null;
  onOpenAcademy?: () => void;
  onOpenLeaderboard?: () => void;
}

export default function GuildHall({
  state,
  setState,
  addLog,
  currentUser,
  onOpenAcademy,
  onOpenLeaderboard,
}: GuildHallProps) {
  const month = useMemo(() => currentApexMonth(), []);
  const [countdown, setCountdown] = useState(() => msUntil(month.closesAt));
  const [seated, setSeated] = useState(() => readApexClaim(month.id));
  const [showHouses, setShowHouses] = useState(false);

  const academyCompleted = useMemo(() => {
    try {
      return (JSON.parse(localStorage.getItem('kronos_academy_completed') || '[]') as string[])
        .length;
    } catch {
      return 0;
    }
  }, [state.energy]);

  const outerSealed = useMemo(() => {
    try {
      const raw = localStorage.getItem('culture_outer_circuit_v1');
      if (!raw) return false;
      return !!(JSON.parse(raw) as { sealed?: boolean }).sealed;
    } catch {
      return false;
    }
  }, []);

  const qual = useMemo(
    () =>
      qualifyForApex({
        energy: state.energy,
        miningPower: state.miningPower,
        efficiency: state.efficiency,
        academyCompleted,
        guildSelected: state.guilds.some((g) => g.selected),
        outerSealed,
      }),
    [
      state.energy,
      state.miningPower,
      state.efficiency,
      academyCompleted,
      state.guilds,
      outerSealed,
    ]
  );

  const activeGuild = state.guilds.find((g) => g.selected);
  const handle = currentUser?.username || 'You';

  const circle = useMemo(
    () =>
      buildApexCircle(month.id, {
        handle,
        score: qual.score,
        faction: activeGuild?.name || 'Independent',
        seated: seated && qual.tier === 'apex',
      }),
    [month.id, handle, qual.score, qual.tier, activeGuild?.name, seated]
  );

  useEffect(() => {
    const t = setInterval(() => setCountdown(msUntil(month.closesAt)), 1000);
    return () => clearInterval(t);
  }, [month.closesAt]);

  const selectGuild = (guildId: string) => {
    setState((prev) => {
      const updatedGuilds = prev.guilds.map((g) => ({
        ...g,
        selected: g.id === guildId,
      }));
      const currentHardwarePower = prev.hardware
        .filter((h) => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 0);
      const currentWorkerPower = prev.workers
        .filter((w) => w.unlocked)
        .reduce((sum, w) => sum + w.powerBonus, 0);
      const baseCombined = 4.8 + currentHardwarePower + currentWorkerPower;
      return {
        ...prev,
        guilds: updatedGuilds,
        miningPower: parseFloat((baseCombined * 1.1).toFixed(1)),
      };
    });
    const house = factionHouseByGuildId(guildId);
    const name = house?.name || state.guilds.find((g) => g.id === guildId)?.name || 'house';
    addLog(
      `FACTION HOUSE: enlisted with "${name}". Meet them in Discord ${house?.channel || ''} · feeds Apex score.`,
      'success'
    );
  };

  const claimSeat = () => {
    if (qual.tier !== 'apex') {
      addLog('APEX DENIED: Score below Summit threshold. Keep proving attention.', 'warn');
      return;
    }
    if (!activeGuild) {
      addLog('APEX DENIED: Enlist a faction house before claiming a Summit seat.', 'warn');
      setShowHouses(true);
      return;
    }
    writeApexClaim(month.id);
    setSeated(true);
    setState((prev) => ({
      ...prev,
      efficiency: parseFloat((prev.efficiency + 0.03).toFixed(3)),
      credits: prev.credits + 150,
      notifications: [
        {
          id: `apex_${month.id}_${Date.now()}`,
          title: 'Apex Summit seat',
          message: `${month.theme} — you hold a seat among the top of the top.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          type: 'success' as const,
        },
        ...(prev.notifications || []),
      ],
    }));
    addLog(
      `APEX SUMMIT: Seat claimed for ${month.label}. +150 BCC · +0.03 efficiency. Welcome to the chamber.`,
      'success'
    );
  };

  const tierLabel =
    qual.tier === 'apex' ? 'APEX CLEAR' : qual.tier === 'contender' ? 'CONTENDER' : 'SPECTATOR';
  const tierColor =
    qual.tier === 'apex'
      ? 'text-amber-300 border-amber-400/40 bg-amber-950/30'
      : qual.tier === 'contender'
        ? 'text-cyan-300 border-cyan-400/35 bg-cyan-950/25'
        : 'text-slate-400 border-white/10 bg-white/5';

  const activeHouse = activeGuild ? factionHouseByGuildId(activeGuild.id) : undefined;

  return (
    <div id="guild-hall-room" className="space-y-6">
      <DiscordCommunityHub
        variant="compact"
        activeGuildId={activeGuild?.id}
        onJoinLogged={(channel) =>
          addLog(`DISCORD: Opening ${channel} — faction houses live here.`, 'info')
        }
      />

      {/* Apex Summit hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-[#08060a] min-h-[220px]"
      >
        <img
          src="/atmosphere/arena-hero.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover brightness-[0.35]"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-amber-950/40" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(251,191,36,0.25),_transparent_50%)]" />

        <div className="relative z-10 p-5 md:p-7 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-300" />
              <span className="text-[10px] font-mono font-black tracking-[0.22em] uppercase text-amber-300/90">
                Apex Summit · monthly chamber
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
              {month.theme}
            </h2>
            <p className="text-sm text-slate-300 mt-2 font-sans leading-relaxed">{month.tagline}</p>
            <p className="text-[11px] text-amber-200/70 font-mono mt-3">{month.prizeLine}</p>
          </div>

          <div className="shrink-0 rounded-2xl border border-amber-400/25 bg-black/50 backdrop-blur-md px-4 py-3 min-w-[200px]">
            <span className="text-[8px] font-mono font-black tracking-widest uppercase text-slate-500 flex items-center gap-1.5">
              <Timer className="w-3 h-3 text-amber-400" />
              Seating closes
            </span>
            <div className="mt-2 flex gap-2 font-mono">
              {[
                ['D', countdown.days],
                ['H', countdown.hours],
                ['M', countdown.mins],
                ['S', countdown.secs],
              ].map(([k, v]) => (
                <div key={k as string} className="text-center">
                  <div className="text-lg font-black text-amber-200 tabular-nums">
                    {String(v).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] text-slate-600">{k}</div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-2">{month.label}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your status + claim */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0c]/95 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-mono font-black tracking-widest uppercase text-slate-500">
              Your Summit status
            </span>
            <span
              className={`text-[8px] font-mono font-black tracking-wider uppercase px-2 py-0.5 rounded-lg border ${tierColor}`}
            >
              {tierLabel}
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono mb-1.5">
              <span className="text-slate-400">Apex score</span>
              <span className="text-white font-black">{qual.score}/100</span>
            </div>
            <div className="h-2 rounded-full bg-black/60 border border-white/5 overflow-hidden">
              <motion.div
                className={`h-full ${
                  qual.tier === 'apex'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                    : qual.tier === 'contender'
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-300'
                      : 'bg-slate-600'
                }`}
                animate={{ width: `${qual.score}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-sans mt-2 leading-relaxed">
              {qual.nextHint}
            </p>
          </div>

          {qual.reasons.length > 0 && (
            <ul className="space-y-1">
              {qual.reasons.map((r) => (
                <li
                  key={r}
                  className="text-[10px] font-mono text-emerald-300/90 flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}

          {seated && qual.tier === 'apex' ? (
            <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3.5 py-3 flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-300" />
              <div>
                <span className="text-[10px] font-mono font-black text-amber-200 uppercase tracking-wider block">
                  Seat held
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  You are in this month&apos;s Apex circle.
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={claimSeat}
              disabled={qual.tier !== 'apex'}
              className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-2"
            >
              {qual.tier === 'apex' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Claim Apex seat
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Summit locked · score 72+
                </>
              )}
            </button>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {onOpenAcademy && (
              <button
                type="button"
                onClick={onOpenAcademy}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
              >
                Train for Summit in Academy <ChevronRight className="w-3 h-3" />
              </button>
            )}
            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="text-[10px] font-mono text-slate-500 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                Full season arena <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* The circle — top 12 */}
        <div className="lg:col-span-2 rounded-2xl border border-amber-400/15 bg-[#0a0a0c]/95 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-4 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-xs font-bold tracking-wider text-slate-100 uppercase">
                The Circle · top of the top
              </h3>
            </div>
            <span className="text-[8px] font-mono text-amber-400/80 uppercase tracking-widest">
              12 seats · {month.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {circle.map((seat, i) => (
              <motion.div
                key={`${seat.handle}-${seat.rank}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-xl border px-3.5 py-3 flex items-center gap-3 ${
                  seat.isYou
                    ? 'border-amber-400/50 bg-amber-500/10 shadow-[0_0_24px_rgba(251,191,36,0.12)]'
                    : seat.rank <= 3
                      ? 'border-white/10 bg-gradient-to-r from-amber-950/20 to-transparent'
                      : 'border-white/5 bg-[#050506]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[11px] font-black shrink-0 ${
                    seat.rank === 1
                      ? 'bg-amber-500 text-black'
                      : seat.rank === 2
                        ? 'bg-slate-300 text-black'
                        : seat.rank === 3
                          ? 'bg-amber-800 text-amber-100'
                          : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  {seat.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-white truncate font-sans">
                      {seat.handle}
                    </span>
                    {seat.isYou && (
                      <span className="text-[7px] font-mono font-black uppercase tracking-wider text-amber-300 border border-amber-400/40 px-1 rounded">
                        You
                      </span>
                    )}
                    {seat.rank <= 3 && !seat.isYou && (
                      <Star className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 block truncate">
                    {seat.title} · {seat.faction}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-black text-amber-200/80 tabular-nums shrink-0">
                  {seat.score}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Faction houses */}
      <div className="rounded-2xl border border-white/8 bg-[#0a0a0c]/90 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHouses((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] font-mono font-black tracking-widest uppercase text-slate-200 block">
                Faction houses
              </span>
              <span className="text-[11px] text-slate-500 font-sans">
                Enlist in-app · live together in Discord
                {activeHouse ? ` · ${activeHouse.channel}` : activeGuild ? ` · ${activeGuild.name}` : ''}
              </span>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-600 transition-transform ${showHouses ? 'rotate-90' : ''}`}
          />
        </button>

        <AnimatePresence>
          {showHouses && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-2.5 border-t border-white/5 pt-3">
                {state.guilds.map((g, index) => {
                  const house = factionHouseByGuildId(g.id);
                  return (
                  <div
                    key={g.id}
                    className={`p-3.5 border rounded-2xl flex flex-wrap items-center justify-between gap-4 transition-all ${
                      g.selected
                        ? 'bg-cyan-950/20 border-cyan-500/40'
                        : 'bg-[#050506] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 font-mono text-xs w-4">#{index + 1}</span>
                      <Shield
                        className={`w-4 h-4 ${g.selected ? 'text-cyan-400' : 'text-slate-500'}`}
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-100 font-sans">{g.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {house?.channel || 'Discord'} · {g.region} · {g.members.toLocaleString()} members
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {house && (
                        <button
                          type="button"
                          onClick={() => {
                            openDiscord(house.href);
                            addLog(`DISCORD: Opening ${house.channel}`, 'info');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 text-[10px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          Discord <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      {g.selected ? (
                        <span className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Your house
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectGuild(g.id)}
                          className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-cyan-400/40 text-slate-300 text-[10px] font-mono font-bold cursor-pointer"
                        >
                          Enlist
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
                <p className="text-[9px] text-slate-600 font-mono flex items-center gap-1.5 pt-1">
                  <Radio className="w-3 h-3" />
                  Houses live in Discord — Apex Circle is the monthly crown above them.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
