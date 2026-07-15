/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Award, Zap, ShieldAlert, Timer, RefreshCw, Star, 
  Crown, TrendingUp, Sparkles, BookOpen, Compass, ShieldCheck, HelpCircle, ChevronRight, User
} from 'lucide-react';
import { GameState } from '../types';

interface LeaderboardProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

interface Season {
  id: string;
  name: string;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
  period: string;
  prizePool: string;
  description: string;
}

const SEASONS: Season[] = [
  { 
    id: 's8', 
    name: 'Season 8: Artificial Intelligence & Cognitive Core', 
    status: 'ACTIVE', 
    period: 'Jul 01 - Jul 30, 2026', 
    prizePool: '10,000,000 CP + 5x Legendary NFT Miners', 
    description: 'Calibrate your neural attention models, acquire AI worker bots, and compete for top nominal power outputs.' 
  },
  { 
    id: 's7', 
    name: 'Season 7: Cryptographic Proofs & Parallelism', 
    status: 'CLOSED', 
    period: 'Jun 01 - Jun 30, 2026', 
    prizePool: '5,000,000 CP + Genesis Rig Parts', 
    description: 'Optimized Solana smart contracts and parallel execution kernels for hardware consensus.' 
  },
  { 
    id: 's6', 
    name: 'Season 6: Edge Consensus & Physical Nodes', 
    status: 'CLOSED', 
    period: 'May 01 - May 31, 2026', 
    prizePool: '3,000,000 CP + Core CPU Blocks', 
    description: 'First stage of the physical node distribution. Standard setups calibrated for edge-computing.' 
  }
];

// Historical winners for closed seasons
const HISTORICAL_WINNERS: Record<string, { rank: number; name: string; power: string; prize: string }[]> = {
  s7: [
    { rank: 1, name: '0xAlpha_Miner', power: '5,120 PH/s', prize: '🥇 Legendary Solid State Fusion Rig + 2.5M CP' },
    { rank: 2, name: 'CyberValkyrie', power: '3,450 PH/s', prize: '🥈 Epic Liquid Nitrogen Cryo Rig + 1.2M CP' },
    { rank: 3, name: 'SolanaSurfer', power: '2,100 PH/s', prize: '🥉 Epic SRAM Memory Stack + 600k CP' },
  ],
  s6: [
    { rank: 1, name: 'NodeMaster9', power: '1,950 PH/s', prize: '🥇 Epic Cryo Cooler Module + 1.5M CP' },
    { rank: 2, name: 'CryptoNomad', power: '1,100 PH/s', prize: '🥈 Rare Synapse Accelerator + 700k CP' },
    { rank: 3, name: 'ZK_Oracle', power: '850 PH/s', prize: '🥉 Rare Solid State Battery + 350k CP' },
  ]
};

export default function Leaderboard({ state, setState, addLog }: LeaderboardProps) {
  const [activeSeasonTab, setActiveSeasonTab] = useState<string>('s8');
  const [showFaq, setShowFaq] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState({ days: 14, hours: 18, mins: 12, secs: 44 });
  const [lastCheckIn, setLastCheckIn] = useState<number>(() => {
    const saved = localStorage.getItem('last_check_in_timestamp');
    return saved ? parseInt(saved) : Date.now() - 3600000; // default 1 hour ago
  });

  // Calculate Decay Multiplier based on time since last check-in
  // 100% at check-in, decays 1.5% per minute of inactive stasis (cap at 40% minimum)
  const [nodeHealth, setNodeHealth] = useState<number>(100);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - lastCheckIn;
      const elapsedMinutes = elapsedMs / 60000;
      const decay = elapsedMinutes * 1.5; // 1.5% decay per minute
      const currentHealth = Math.max(40, Math.round(100 - decay));
      setNodeHealth(currentHealth);

      // Decrement countdown seconds for fun
      setCountdown(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lastCheckIn]);

  // Handle active check-in button
  const triggerCheckIn = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog("SYNCING COGNITIVE FREQUENCIES: Handshaking with physical node...", "info");

    setTimeout(() => {
      const now = Date.now();
      setLastCheckIn(now);
      localStorage.setItem('last_check_in_timestamp', now.toString());
      setNodeHealth(100);
      setIsSyncing(false);

      setState(prev => ({
        ...prev,
        credits: prev.credits + 50,
        energy: Math.min(100, prev.energy + 10)
      }));

      addLog("SYNC SUCCESSFUL: Core Rig Calibration validated! +50 CP earned, Node Health restored to 100%.", "success");
    }, 1500);
  };

  interface CompetitorEntry {
    name: string;
    basePower: number;
    powerOverride?: number;
    avatar: string;
    tag: string;
    tier: string;
    isUser?: boolean;
  }

  // Base list of competitors
  const competitors: CompetitorEntry[] = [
    { name: "0xAlpha_Miner", basePower: 4100, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80", tag: "GENESIS_RIG", tier: "Legendary Node" },
    { name: "CyberValkyrie", basePower: 2950, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", tag: "CORE_NODE", tier: "Legendary Node" },
    { name: "SolanaSurfer", basePower: 1850, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", tag: "DEEP_POOL", tier: "Epic Node" },
    { name: "NodeMaster9", basePower: 1100, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80", tag: "SECTOR_CHIEF", tier: "Epic Node" },
    { name: "CryptoNomad", basePower: 780, avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80", tag: "EDGE_RUNNER", tier: "Rare Node" },
    { name: "ZK_Oracle", basePower: 420, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80", tag: "ORACLE_LINK", tier: "Rare Node" },
    { name: "Satoshi_Vision", basePower: 220, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80", tag: "LEGACY_RIG", tier: "Common Node" },
    { name: "MemeLord_X", basePower: 95, avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&auto=format&fit=crop&q=80", tag: "DEFI_REBEL", tier: "Common Node" },
  ];

  // Map user with active decayed power
  const userXUsername = state.profile?.xUsername || 'laszlo_bihary';
  const displayUserXName = userXUsername.startsWith('@') ? userXUsername : `@${userXUsername}`;
  
  // Decayed power calculation
  const calculatedActivePower = state.miningPower * state.efficiency * (nodeHealth / 100);

  const userEntry: CompetitorEntry = {
    name: `${displayUserXName} (YOU)`,
    basePower: state.miningPower * state.efficiency,
    powerOverride: calculatedActivePower,
    avatar: state.profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    tag: "YOU",
    tier: calculatedActivePower > 2000 ? "Legendary Node" : calculatedActivePower > 800 ? "Epic Node" : calculatedActivePower > 300 ? "Rare Node" : "Common Node",
    isUser: true
  };

  // Compile active season rankings sorted dynamically
  const activeRankings = [...competitors, userEntry]
    .map(c => ({
      ...c,
      activePower: c.isUser ? calculatedActivePower : c.basePower
    }))
    .sort((a, b) => b.activePower - a.activePower);

  const userRankIdx = activeRankings.findIndex(r => r.isUser);
  const userRank = userRankIdx + 1;

  return (
    <div id="leaderboard-room" className="space-y-6">

      {/* Rhythmic Banner with Season and Live Countdown */}
      <div className="bg-gradient-to-br from-[#120e0a] to-[#0a0705] border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10 relative">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-amber-500 tracking-[0.2em] block uppercase font-black flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 animate-pulse" />
              GLOBAL SEASON COMPETITION
            </span>
            <h2 className="text-xl lg:text-2xl font-black italic text-white leading-none">
              SEASON 8: ARTIFICIAL INTELLIGENCE
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-2xl leading-relaxed">
              Mining nodes adapt based on learning coherence and computational weight. Maintain check-ins to prevent physical hardware cooling loss and secure your share of the massive CP pools.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="bg-[#050506]/80 border border-white/5 p-4 rounded-xl font-mono text-center flex gap-4 min-w-[280px] justify-center items-center shadow-lg">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500">DAYS</span>
              <span className="text-lg font-black text-white">{countdown.days}</span>
            </div>
            <span className="text-slate-600 font-bold">:</span>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500">HOURS</span>
              <span className="text-lg font-black text-white">{String(countdown.hours).padStart(2, '0')}</span>
            </div>
            <span className="text-slate-600 font-bold">:</span>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500">MINS</span>
              <span className="text-lg font-black text-white">{String(countdown.mins).padStart(2, '0')}</span>
            </div>
            <span className="text-slate-600 font-bold">:</span>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500">SECS</span>
              <span className="text-lg font-black text-amber-500 animate-pulse">{String(countdown.secs).padStart(2, '0')}</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="text-left">
              <span className="text-[8px] text-amber-500 font-bold tracking-widest block">ACTIVE RUN</span>
              <span className="text-[10px] text-slate-400 font-bold">14d remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Mining Power Decay & Interactive Check-In Node */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Active Check-In & Rig Calibration */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-cyan-400" />
                NODE ACTIVITY CALIBRATION
              </h4>
              <span className="text-[8px] font-mono bg-cyan-950/40 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                10-15m REQ
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-5">
              To mirror a real-world physical mining rig, your node power depends on regular check-ins. Long stasis causes cooling friction, decaying power down to a minimum of 40%.
            </p>

            {/* Health / Decay Gauge */}
            <div className="space-y-2 mb-4 font-mono">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500">CURRENT RIG CAPACITANCE:</span>
                <span className={`font-black ${nodeHealth > 80 ? 'text-cyan-400' : nodeHealth > 50 ? 'text-yellow-400' : 'text-red-400 animate-pulse'}`}>
                  {nodeHealth}% NOMINAL
                </span>
              </div>
              <div className="h-3.5 bg-[#050506] border border-white/5 rounded-lg overflow-hidden p-0.5 relative flex items-center">
                <div 
                  className={`h-full rounded-md transition-all duration-1000 ${
                    nodeHealth > 80 
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' 
                      : nodeHealth > 50 
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                      : 'bg-gradient-to-r from-red-500 to-orange-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'
                  }`}
                  style={{ width: `${nodeHealth}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                {nodeHealth === 100 
                  ? '✔ Systems running at full thermal efficiency! Maximum hash rate achieved.' 
                  : `⚠ Rig has decayed by -${100 - nodeHealth}%. Synchronize frequencies to restore.`
                }
              </p>
            </div>
          </div>

          <button
            onClick={triggerCheckIn}
            disabled={isSyncing || nodeHealth >= 100}
            className={`w-full py-3 rounded-xl font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              nodeHealth >= 100
                ? 'bg-[#050506] border border-white/5 text-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white shadow-lg shadow-cyan-950/30'
            }`}
          >
            <RefreshCw className={`w-4 h-4 text-cyan-300 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "SYNCING HARDWARE LEDGER..." : nodeHealth >= 100 ? "COILS THERMALLY STABLE" : "SYNC RIG & CHECK IN (+50 CP)"}
          </button>
        </div>

        {/* Center Card: Season Rewards & Gamified NFTs */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[240px]">
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              NFT MINER REWARDS (SEASON 8)
            </h4>

            <p className="text-xs text-slate-400 leading-relaxed font-sans mb-4">
              Real-life miners are gamified into tradable NFTs. Win epic drops by securing high leader positions at the end of the season.
            </p>

            <div className="bg-[#050506] p-3 border border-white/5 rounded-xl flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-fuchsia-600/30 to-indigo-900/30 border border-fuchsia-500/40 flex items-center justify-center relative overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=120&auto=format&fit=crop&q=80" 
                  alt="Legendary Rig"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-fuchsia-950/20" />
                <Sparkles className="absolute top-1 right-1 w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
              <div className="font-mono text-xs flex-1">
                <span className="text-[8px] text-fuchsia-400 font-bold block">1ST PLACE DROP</span>
                <span className="text-slate-200 font-bold text-[11px] block">LEGENDARY KRONOS-V3 RIG</span>
                <span className="text-amber-500 font-black text-[10px]">+1,500 PH/s Boost • Tradable</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-slate-500 font-mono flex justify-between items-center">
            <span>Estimated Mint Price: 5000 CP</span>
            <span className="text-amber-500 font-bold">LIMITED COLLECTION</span>
          </div>
        </div>

        {/* Right Card: Your Current Performance */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[240px]">
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <User className="w-4 h-4 text-fuchsia-400" />
              YOUR RIG DIAGNOSTICS
            </h4>

            <div className="space-y-3.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-500">Global Rank:</span>
                <span className="text-amber-400 font-black flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  #{userRank} / {activeRankings.length}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-500">Nominal Rig Output:</span>
                <span className="text-slate-200 font-bold">{(state.miningPower * state.efficiency).toFixed(1)} PH/s</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-500">Decayed Rig Output:</span>
                <span className="text-cyan-400 font-black">{calculatedActivePower.toFixed(1)} PH/s</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tier Status:</span>
                <span className="text-fuchsia-400 font-black uppercase text-[10px]">{userEntry.tier}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[10px] font-mono text-slate-500 leading-relaxed bg-[#050506] p-2.5 rounded-lg border border-white/5">
            💡 <strong className="text-slate-300">Tip:</strong> Buying more parts in the <strong className="text-fuchsia-400">Workshop</strong> and unlocking miners in <strong className="text-cyan-400">AI Core</strong> will multiply your power to pass competitors!
          </div>
        </div>

      </div>

      {/* Main Sections: Leaderboard Rankings and Seasonal History Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rankings Listing Block */}
        <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">SEASON COMPETITOR LEADERBOARD</h3>
            </div>

            {/* Season switcher tabs */}
            <div className="flex gap-2 font-mono text-[10px]">
              {SEASONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSeasonTab(s.id)}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activeSeasonTab === s.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold'
                      : 'bg-[#050506] border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s.id.toUpperCase()} {s.status === 'ACTIVE' && '●'}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeSeasonTab === 's8' ? (
              <motion.div
                key="s8-active-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5"
              >
                {/* Ranks list */}
                {activeRankings.map((competitor, idx) => {
                  const rank = idx + 1;
                  const isGold = rank === 1;
                  const isSilver = rank === 2;
                  const isBronze = rank === 3;

                  return (
                    <div
                      key={competitor.name}
                      className={`p-3 border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                        competitor.isUser
                          ? 'bg-gradient-to-r from-fuchsia-950/20 to-cyan-950/10 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.05)] ring-1 ring-fuchsia-500/10'
                          : 'bg-[#050506] hover:bg-white/[0.01] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank index / medal */}
                        <div className="w-8 font-mono font-black text-center flex items-center justify-center">
                          {isGold ? (
                            <span className="text-xl">🥇</span>
                          ) : isSilver ? (
                            <span className="text-xl">🥈</span>
                          ) : isBronze ? (
                            <span className="text-xl">🥉</span>
                          ) : (
                            <span className="text-slate-500 text-xs">#{rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-[#111115] relative">
                          <img 
                            src={competitor.avatar} 
                            alt={competitor.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {competitor.isUser && (
                            <div className="absolute inset-0 bg-fuchsia-600/10" />
                          )}
                        </div>

                        {/* Name and tags */}
                        <div className="font-mono">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${competitor.isUser ? 'text-fuchsia-300 font-black' : 'text-slate-200'}`}>
                              {competitor.name}
                            </span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest ${
                              competitor.isUser 
                                ? 'bg-fuchsia-950 border border-fuchsia-800 text-fuchsia-400' 
                                : 'bg-slate-900 border border-slate-800 text-slate-500'
                            }`}>
                              {competitor.tag || "MINER"}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">{competitor.tier}</span>
                        </div>
                      </div>

                      {/* Power score output */}
                      <div className="text-right font-mono">
                        <span className="text-[9px] text-slate-500 block">COGNITIVE HASH RATE</span>
                        <span className={`text-xs font-black italic ${competitor.isUser ? 'text-fuchsia-400' : 'text-slate-200'}`}>
                          {competitor.activePower.toFixed(1)} <span className="text-[9px] font-normal not-italic text-slate-500">PH/s</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="closed-season-winners"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-amber-950/10 border border-amber-500/10 p-4 rounded-xl text-center">
                  <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest block">⚠ SEASON CLOSED</span>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    The ledger state has been finalized. Rewards have been distributed to the winners' decentralized wallets.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {HISTORICAL_WINNERS[activeSeasonTab]?.map((winner) => (
                    <div key={winner.rank} className="bg-[#050506] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black w-6">{winner.rank === 1 ? '🥇' : winner.rank === 2 ? '🥈' : '🥉'}</span>
                        <div>
                          <span className="text-slate-200 font-bold block">{winner.name}</span>
                          <span className="text-[10px] text-slate-500">Record Output: {winner.power}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block uppercase">SECURED AWARD</span>
                        <span className="text-amber-400 font-bold text-[11px]">{winner.prize}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Sidebar details panel */}
        <div className="space-y-6">
          
          {/* Season Rules and Structure Details */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5 uppercase">
              <BookOpen className="w-4 h-4 text-amber-500" />
              CONVENANT RULES & CYCLE
            </h4>

            <div className="space-y-3 font-sans text-xs text-slate-400 leading-relaxed">
              <div className="p-3 bg-[#050506] border border-white/5 rounded-xl space-y-1">
                <span className="font-mono text-slate-200 font-bold text-[10px] block uppercase text-amber-500">1. HOW TO COMPETE</span>
                <p>Buy upgrades in the **Workshop** and recruit bots in the **AI Core** to raise your base PH/s rate. Maintain active learning sessions to keep your Efficiency Multiplier high.</p>
              </div>

              <div className="p-3 bg-[#050506] border border-white/5 rounded-xl space-y-1">
                <span className="font-mono text-slate-200 font-bold text-[10px] block uppercase text-amber-500">2. RIG COOLING / DECAY</span>
                <p>If you don't check in or log learning sessions, your active mining output decays down to **40%**. Do a quick "Sync Rig" in this Leaderboard panel to restore power to 100% instantly!</p>
              </div>

              <div className="p-3 bg-[#050506] border border-white/5 rounded-xl space-y-1">
                <span className="font-mono text-slate-200 font-bold text-[10px] block uppercase text-amber-500">3. SEASONAL ROLLOVER</span>
                <p>Every 30 days, the active season closes. Top ranks receive direct CP deposits and tradable NFT miners. Ranks are reset for the next educational topic cluster.</p>
              </div>
            </div>
          </div>

          {/* Interactive FAQ Dropdown Accordion */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl">
            <button
              onClick={() => setShowFaq(!showFaq)}
              className="w-full flex items-center justify-between text-left focus:outline-none"
            >
              <span className="text-xs font-mono font-bold tracking-widest text-slate-400 flex items-center gap-1.5 uppercase">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                DOPAMINE & LEARNING PROTOCOL
              </span>
              <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showFaq ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showFaq && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-3 font-sans text-xs text-slate-400 leading-relaxed border-t border-white/5 mt-3">
                    <p>
                      <strong>Why do my mining outputs matter?</strong><br />
                      Mining outputs correspond directly to point drops. Points allow you to claim real-life pendants, upgrade your hardware systems, and compete on the global stage.
                    </p>
                    <p>
                      <strong>Are the NFT miners tradeable?</strong><br />
                      Yes! The AI Worker Bots and Rig enhancements function as on-chain gamified nodes. You can level them up using accumulated credits and sell them inside the AI Core Requisition terminal.
                    </p>
                    <p>
                      <strong>What is the point of the Attention Academy?</strong><br />
                      Instead of watching short-term mindless content, our lessons teach profound, real-world concepts (like physical hardware architectures, neuroplasticity, cognitive firewall techniques, and cryptography) designed to empower builders with genuine, friend-shareable knowledge.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
}
