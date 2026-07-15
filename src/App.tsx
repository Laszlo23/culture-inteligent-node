/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Battery, ShieldAlert, Cpu, Hammer, 
  Compass, Bot, Coins, Users, Calendar, 
  Map, LogIn, LayoutGrid, Award, Volume2, VolumeX, RefreshCw, User, Trophy
} from 'lucide-react';

import { GameState, HardwareModule, AIWorker, FacilityRoom, Guild, DailyMission, InspectionLog } from './types';
import MainReactor from './components/MainReactor';
import Workshop from './components/Workshop';
import ResearchLab from './components/ResearchLab';
import AICore from './components/AICore';
import DailyMissions from './components/DailyMissions';
import GuildHall from './components/GuildHall';
import Treasury from './components/Treasury';
import MemberProfile from './components/MemberProfile';
import Leaderboard from './components/Leaderboard';

const INITIAL_HARDWARE: HardwareModule[] = [
  { id: 'gpu_1', name: 'Quantum GPU Core', type: 'gpu', rarity: 'Common', bonusPower: 120, bonusEfficiency: 0.05, cost: 300, unlocked: true, installed: false, description: 'Basic graphics core used for computing standard blockchain hashes.' },
  { id: 'gpu_2', name: 'Legendary Silicon Matrix', type: 'gpu', rarity: 'Legendary', bonusPower: 850, bonusEfficiency: 0.25, cost: 2500, unlocked: false, installed: false, description: 'Superconducting legendary GPU cluster designed for high-density calculations.' },
  { id: 'memory_1', name: 'AI SRAM Array', type: 'memory', rarity: 'Common', bonusPower: 60, bonusEfficiency: 0.02, cost: 150, unlocked: true, installed: false, description: 'Standard high-speed caching memory for caching telemetry registers.' },
  { id: 'memory_2', name: 'Neural Holographic Memory', type: 'memory', rarity: 'Epic', bonusPower: 450, bonusEfficiency: 0.15, cost: 1200, unlocked: false, installed: false, description: 'Advanced photon-based holographic storage with deep stasis reserves.' },
  { id: 'accel_1', name: 'Neural Synapse Accelerator', type: 'accelerator', rarity: 'Rare', bonusPower: 280, bonusEfficiency: 0.08, cost: 800, unlocked: true, installed: false, description: 'Overclocks AI attention algorithms, boosting response rates.' },
  { id: 'battery_1', name: 'Solid State Fusion Battery', type: 'battery', rarity: 'Rare', bonusPower: 320, bonusEfficiency: 0.10, cost: 950, unlocked: true, installed: false, description: 'Fusion-powered nuclear backup cells providing high current stability.' },
  { id: 'cooler_1', name: 'Liquid Nitrogen Cryo Cooler', type: 'cooler', rarity: 'Epic', bonusPower: 380, bonusEfficiency: 0.16, cost: 1100, unlocked: true, installed: false, description: 'Sub-zero cryo cooling that suppresses core thermal overclocking limits.' },
  { id: 'dock_1', name: 'Autonomous Drone Dock', type: 'dock', rarity: 'Legendary', bonusPower: 1100, bonusEfficiency: 0.35, cost: 3200, unlocked: false, installed: false, description: 'Launches a visual hover drone to autonomously inspect and optimize grid conduits.' },
  { id: 'chip_1', name: 'Quantum Automation Chip', type: 'chip', rarity: 'Epic', bonusPower: 550, bonusEfficiency: 0.20, cost: 1600, unlocked: false, installed: false, description: 'Integrated circuits that automatically configure reactor balance protocols.' },
];

const INITIAL_WORKERS: AIWorker[] = [
  { id: 'bot_research', name: 'Research Bot NFT', role: 'Research', rarity: 'Common', powerBonus: 100, efficiencyBoost: 4, unlocked: false, level: 1, cost: 1000, status: 'IDLE', description: 'Gleans advanced cryptographic briefs to find higher reward tasks.' },
  { id: 'bot_builder', name: 'Builder Bot NFT', role: 'Builder', rarity: 'Epic', powerBonus: 220, efficiencyBoost: 8, unlocked: false, level: 1, cost: 1400, status: 'IDLE', description: 'Reconstructs damaged hardware pipelines and speeds up module mounting.' },
  { id: 'bot_teacher', name: 'Teacher Bot NFT', role: 'Teacher', rarity: 'Epic', powerBonus: 260, efficiencyBoost: 10, unlocked: false, level: 1, cost: 1800, status: 'IDLE', description: 'Guides attention tunnels to ensure cognitive verification speed increases.' },
  { id: 'bot_trader', name: 'Trader Bot NFT', role: 'Trader', rarity: 'Legendary', powerBonus: 500, efficiencyBoost: 15, unlocked: false, level: 1, cost: 2500, status: 'IDLE', description: 'Executes hedge positions in ecosystem pools to yield massive credits.' },
];

const INITIAL_ROOMS: FacilityRoom[] = [
  { id: 'reactor', name: 'Mining Power Reactor', level: 1, maxLevel: 5, unlocked: true, costToUnlock: 0, costToUpgrade: 500, description: 'Generates your core mining hash power and monitors system state.', perk: '+15% Core Energy Capacity' },
  { id: 'workshop', name: 'Hardware Marketplace', level: 1, maxLevel: 5, unlocked: true, costToUnlock: 0, costToUpgrade: 600, description: 'Purchase and install high-performance hardware upgrades.', perk: '-10% Part Purchasing Costs' },
  { id: 'lab', name: 'Attention Academy', level: 1, maxLevel: 5, unlocked: true, costToUnlock: 0, costToUpgrade: 700, description: 'Verify focus logs and complete micro-courses to refuel system energy.', perk: '+20% Energy Refuel Multiplier' },
  { id: 'ai', name: 'Automation Center', level: 0, maxLevel: 3, unlocked: false, costToUnlock: 800, costToUpgrade: 1200, description: 'Deploy helpful helper AI bots to passively boost mining rates.', perk: '+5% Worker Passive Speed' },
  { id: 'treasury', name: 'Ecosystem Vault', level: 0, maxLevel: 3, unlocked: false, costToUnlock: 1200, costToUpgrade: 1500, description: 'Track ticking ecosystem yield drops and claim your token balances.', perk: '+12% Hourly Claim Multiplier' },
  { id: 'guild', name: 'Community Guilds', level: 0, maxLevel: 1, unlocked: false, costToUnlock: 1500, costToUpgrade: 0, description: 'Align with global Web3 builder groups to earn team rewards.', perk: '+10% Team Output Boost' },
];

const INITIAL_GUILDS: Guild[] = [
  { id: 'guild_builders', name: 'Web3 Builders', region: 'Global', members: 2420, output: 6.8, bonus: '+10% Construction Speed Boost', selected: true },
  { id: 'guild_developers', name: 'Rust Core Developers', region: 'Europe', members: 1980, output: 6.2, bonus: '+10% Protocol Deserialization Boost', selected: false },
  { id: 'guild_analysts', name: 'Quant Researchers', region: 'America', members: 1450, output: 5.5, bonus: '+10% Data Pipeline Yield', selected: false },
];

const INITIAL_MISSIONS: DailyMission[] = [
  { id: 'm1', label: 'Watch Solana Developer AI Masterclass (12m)', completed: false, energyReward: 20, powerReward: 10, category: 'video' },
  { id: 'm2', label: 'Analyze Solana Parallel Execution Docs', completed: false, energyReward: 20, powerReward: 12, category: 'article' },
  { id: 'm3', label: 'Solve 1 Smart Contract Assembly Bug', completed: false, energyReward: 25, powerReward: 15, category: 'quest' },
  { id: 'm4', label: 'Contribute Code Snippet to Dev Guild Hub', completed: false, energyReward: 35, powerReward: 20, category: 'build' },
];

export default function App() {
  const [state, setState] = useState<GameState>({
    credits: 1200,
    miningPower: 4.8, // starts at base 4.8 PH/s
    energy: 38, // Starts at 38% low as requested!
    efficiency: 1.0,
    facilityLevel: 1,
    currentSeason: 'Season 8: Artificial Intelligence',
    hardware: INITIAL_HARDWARE,
    workers: INITIAL_WORKERS,
    rooms: INITIAL_ROOMS,
    guilds: INITIAL_GUILDS,
    dailyMissions: INITIAL_MISSIONS,
    lastMaintenanceDate: new Date().toDateString(),
    ecosystemRewards: 0,
    accumulatedRewards: 0,
    profile: {
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      aboutMe: '',
      xUsername: '',
      telegramUsername: '',
      discordUsername: '',
      profileCompletedRewardClaimed: false,
      xFollowClaimed: false,
      telegramJoinClaimed: false,
      discordJoinClaimed: false,
      xPostInteractionClaimed: false
    }
  });

  const [activeRoom, setActiveRoom] = useState<string>('map');
  const [logs, setLogs] = useState<InspectionLog[]>([]);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // Helper log function
  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'system') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      { timestamp: timeStr, message, type }
    ]);
  };

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('building_culture_state_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Failed to parse local storage game state.", e);
      }
    }

    // Add introductory greeting logs
    addLog("Facility online. Connection stable.", "system");
    addLog("WARNING: Main Reactor Core energy depleted to 38%. Attention required.", "warn");
  }, []);

  // Save state to localStorage whenever it modifies
  useEffect(() => {
    localStorage.setItem('building_culture_state_v1', JSON.stringify(state));
  }, [state]);

  const changeRoom = (roomId: string) => {
    setActiveRoom(roomId);
    const roomName = state.rooms.find(r => r.id === roomId)?.name || "Facility Schematic";
    addLog(`Entering ${roomName}...`, "info");
  };

  const unlockRoom = (roomId: string) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return;

    if (state.credits < room.costToUnlock) {
      addLog(`TRANSACTION DENIED: Insufficient balance to expand ${room.name}. Required: ${room.costToUnlock} CP`, "warn");
      return;
    }

    setState(prev => {
      const updatedRooms = prev.rooms.map(r => {
        if (r.id === roomId) {
          return { ...r, unlocked: true };
        }
        return r;
      });

      return {
        ...prev,
        credits: prev.credits - room.costToUnlock,
        rooms: updatedRooms,
        facilityLevel: prev.facilityLevel + 1
      };
    });

    addLog(`FACILITY EXPANDED: "${room.name}" chamber is now online.`, "success");
  };

  const upgradeRoom = (roomId: string) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return;

    if (state.credits < room.costToUpgrade) {
      addLog(`UPGRADE DENIED: Insufficient balance to upgrade ${room.name}. Required: ${room.costToUpgrade} CP`, "warn");
      return;
    }

    setState(prev => {
      const updatedRooms = prev.rooms.map(r => {
        if (r.id === roomId) {
          return { ...r, level: Math.min(r.maxLevel, r.level + 1) };
        }
        return r;
      });

      return {
        ...prev,
        credits: prev.credits - room.costToUpgrade,
        rooms: updatedRooms
      };
    });

    addLog(`UPGRADE COMPLETE: "${room.name}" upgraded to Level ${room.level + 1}.`, "success");
  };

  const resetProgress = () => {
    if (confirm("Reset operations? This will clear all upgrades, workers, and credits.")) {
      setState({
        credits: 1200,
        miningPower: 4.8,
        energy: 38,
        efficiency: 1.0,
        facilityLevel: 1,
        currentSeason: 'Season 8: Artificial Intelligence',
        hardware: INITIAL_HARDWARE,
        workers: INITIAL_WORKERS,
        rooms: INITIAL_ROOMS,
        guilds: INITIAL_GUILDS,
        dailyMissions: INITIAL_MISSIONS,
        lastMaintenanceDate: new Date().toDateString(),
        ecosystemRewards: 0,
        accumulatedRewards: 0,
        profile: {
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          aboutMe: '',
          xUsername: '',
          telegramUsername: '',
          discordUsername: '',
          profileCompletedRewardClaimed: false,
          xFollowClaimed: false,
          telegramJoinClaimed: false,
          discordJoinClaimed: false,
          xPostInteractionClaimed: false
        }
      });
      localStorage.removeItem('building_culture_state_v1');
      addLog("SYSTEM REBOOTED: Settings reset to defaults.", "system");
      setActiveRoom('map');
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-slate-300 flex flex-col justify-between font-sans selection:bg-cyan-500/30 selection:text-cyan-300 relative overflow-hidden">
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-950/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Main Navigation Bar */}
      <header className="border border-white/5 bg-[#0a0a0c]/90 backdrop-blur-md sticky top-2 z-40 mx-4 mt-2 px-6 py-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Node Network</span>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              CULTURE NODE <span className="text-[8px] font-mono tracking-widest uppercase bg-cyan-950/60 border border-cyan-800 text-cyan-400 px-1.5 py-0.5 rounded">MAINNET-v1.0</span>
            </h1>
          </div>
        </div>

        {/* Global Facility Live Metrics */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-8 font-mono text-xs">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono tracking-widest uppercase text-cyan-400">MINING RATE</span>
            <span className="text-lg font-black text-white italic">
              {state.miningPower.toFixed(1)} <span className="text-[10px] text-cyan-500 font-normal not-italic">PH/s</span>
            </span>
          </div>

          <div className="flex flex-col min-w-[110px]">
            <span className="text-[9px] font-mono tracking-widest uppercase text-orange-500">CORE ENERGY</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-black italic ${state.energy < 40 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {state.energy}%
              </span>
              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    state.energy < 40 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                  }`}
                  style={{ width: `${state.energy}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-mono tracking-widest uppercase text-slate-500">MULTIPLIER</span>
            <span className="text-base font-bold text-cyan-400">x{state.efficiency.toFixed(2)}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] font-mono tracking-widest uppercase text-slate-500">WALLET</span>
            <span className="text-base font-black text-amber-400">{state.credits} <span className="text-[10px] font-normal">CP</span></span>
          </div>
        </div>

        {/* Global Season / Reset controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeRoom('profile')}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer ${
              activeRoom === 'profile'
                ? 'bg-fuchsia-600/20 border-fuchsia-500/50 text-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.15)] animate-pulse'
                : 'bg-white/5 border-white/10 hover:border-fuchsia-500/30 hover:bg-fuchsia-950/10 text-slate-400 hover:text-fuchsia-400'
            }`}
          >
            <User className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>MEMBER PROFILE</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg font-mono text-[10px] tracking-tight text-slate-400">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>{state.currentSeason.toUpperCase()}</span>
          </div>
          <button
            onClick={resetProgress}
            title="Wipe diagnostics ledger & restart simulation"
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-950/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 z-10 relative">
        
        {/* Navigation Breadcrumb back button when inside a room */}
        {activeRoom !== 'map' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex justify-between items-center"
          >
            <button
              onClick={() => setActiveRoom('map')}
              className="px-4 py-2 bg-[#0a0a0c] hover:bg-[#111115] border border-white/10 text-slate-200 font-mono text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <Map className="w-4 h-4 text-cyan-400" />
              BACK TO OVERVIEW
            </button>

            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline uppercase tracking-widest">
              SECTOR 0{state.rooms.findIndex(r => r.id === activeRoom) + 1}
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeRoom === 'map' ? (
            <motion.div
              key="map-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Dynamic Warning Alert on blueprint map screen if Reactor Low */}
              {state.energy < 40 && (
                <div className="bg-orange-500/5 border border-orange-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/40 animate-pulse">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-orange-400 block tracking-widest uppercase">⚠ LOW CORE RESERVES DETECTED</span>
                      <h4 className="text-sm font-semibold font-mono text-slate-200 mt-0.5">Core energy level is low ({state.energy}%).</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
                        Complete courses in the <span className="text-cyan-400 font-bold font-mono">Attention Academy</span> or tackle study tasks to refuel the system now.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => changeRoom('missions')}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-black font-mono text-xs rounded-xl tracking-wider transition-colors cursor-pointer"
                  >
                    GO TO MISSIONS
                  </button>
                </div>
              )}

              {/* Blueprint map Hero */}
              <div className="p-8 bg-[#0a0a0c] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-cyber-grid bg-[size:24px_24px] opacity-[0.03]" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl">
                  <span className="text-[10px] font-mono text-cyan-400 tracking-[0.2em] block uppercase font-bold">BUILDING CULTURE PROTOCOL</span>
                  <h2 className="text-3xl lg:text-4xl font-black italic text-white leading-none mt-2 mb-3">
                    FUEL YOUR NODE<br />WITH KNOWLEDGE
                  </h2>
                  <p className="text-xs lg:text-sm text-slate-400 font-sans mt-3.5 leading-relaxed max-w-xl">
                    Build a decentralized culture node powered by your real-world learning. Complete focus academy courses, buy high-efficiency hardware upgrades, and coordinate with active global builder guilds.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-6 font-mono text-xs">
                    <button
                      onClick={() => changeRoom('reactor')}
                      className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      Manage Reactor Core
                    </button>
                    <button
                      onClick={() => changeRoom('workshop')}
                      className="px-5 py-3 bg-[#0a0a0c] hover:bg-[#111115] border border-white/10 text-slate-300 font-black uppercase tracking-wider rounded-xl cursor-pointer"
                    >
                      Upgrade Hardware
                    </button>
                  </div>
                </div>
              </div>

              {/* The living blueprints of "My Facility" Expandable rooms */}
              <div>
                <h3 className="font-mono text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-cyan-400" />
                  FACILITY SCHEMATIC BLUEPRINT
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.rooms.map((room, idx) => {
                    const getRoomStatus = () => {
                      if (!room.unlocked) return { text: 'DECRYPTED / LOCKED', color: 'text-slate-500 border-white/5 bg-white/[0.02]' };
                      if (room.id === 'reactor' && state.energy < 40) return { text: 'REACTOR EMERGENCY', color: 'text-orange-400 animate-pulse border-orange-500/40 bg-orange-950/10' };
                      return { text: `LEVEL ${room.level} NOMINAL`, color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/5' };
                    };

                    const rStatus = getRoomStatus();

                    return (
                      <div
                        key={room.id}
                        className={`bg-[#0a0a0c] border rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300 ${
                          room.unlocked 
                            ? 'border-white/5 hover:border-cyan-500/40' 
                            : 'border-white/5 opacity-50'
                        }`}
                      >
                        {/* Blueprint grid coordinate numbers */}
                        <span className="absolute top-4 right-4 font-mono text-[9px] text-slate-600">SECTOR_0{idx + 1}</span>

                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            {room.id === 'reactor' ? <Cpu className="w-4 h-4 text-cyan-400" /> :
                             room.id === 'workshop' ? <Hammer className="w-4 h-4 text-fuchsia-400" /> :
                             room.id === 'lab' ? <Compass className="w-4 h-4 text-teal-400" /> :
                             room.id === 'ai' ? <Bot className="w-4 h-4 text-pink-400" /> :
                             room.id === 'treasury' ? <Coins className="w-4 h-4 text-emerald-400" /> :
                             <Users className="w-4 h-4 text-amber-400" />}
                            <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                              {room.name}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-400 font-sans leading-relaxed">
                            {room.description}
                          </p>
                        </div>

                        {/* Room stats / purchase controls */}
                        <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                          <span className={`border px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase ${rStatus.color}`}>
                            {rStatus.text}
                          </span>

                          {room.unlocked ? (
                            <div className="flex gap-2">
                              {room.costToUpgrade > 0 && room.level < room.maxLevel && (
                                <button
                                  onClick={() => upgradeRoom(room.id)}
                                  className="px-2.5 py-1.5 bg-[#0a0a0c] hover:bg-[#111115] border border-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] cursor-pointer font-bold"
                                  title={`Upgrade Room to increase operations (+${room.perk})`}
                                >
                                  UPGRADE({room.costToUpgrade} CP)
                                </button>
                              )}
                              <button
                                onClick={() => changeRoom(room.id)}
                                className="px-3.5 py-1.5 bg-cyan-600 text-black hover:bg-cyan-500 font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                              >
                                ENTER
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => unlockRoom(room.id)}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                            >
                              CONSTRUCT ({room.costToUnlock} CP)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* 7th Premium Card: Member Profile & Social Hub */}
                  <div
                    className="bg-gradient-to-br from-[#0c0a12] to-[#07050a] border border-fuchsia-500/20 hover:border-fuchsia-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300 shadow-[0_0_20px_rgba(217,70,239,0.02)] hover:shadow-[0_0_35px_rgba(217,70,239,0.06)]"
                  >
                    {/* Blueprint grid coordinate numbers */}
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-fuchsia-500/60">SECTOR_HQ</span>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-fuchsia-400" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          Member Profile & Social Hub
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Authorize your Web3 profiles, edit your personal metadata card, and verify social campaign milestones to earn exclusive credit drops.
                      </p>
                    </div>

                    {/* Stats / active indicators */}
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-fuchsia-500/20 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-fuchsia-950/20 text-fuchsia-400 font-black">
                        CENTRAL NOMINAL
                      </span>

                      <button
                        onClick={() => changeRoom('profile')}
                        className="px-3.5 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        ENTER HUB
                      </button>
                    </div>
                  </div>

                  {/* 8th Premium Card: Global Season Leaderboard */}
                  <div
                    className="bg-gradient-to-br from-[#120e0a] to-[#070503] border border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.02)] hover:shadow-[0_0_35px_rgba(245,158,11,0.06)]"
                  >
                    {/* Blueprint grid coordinate numbers */}
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-amber-500/60">SECTOR_ARENA</span>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          Global Season Leaderboard
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Compete in Season 8: AI & Cognitive Core. Maintain regular check-ins to prevent rig stasis cooling and secure exclusive NFT Miner rewards.
                      </p>
                    </div>

                    {/* Stats / active indicators */}
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-amber-500/20 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-amber-950/20 text-amber-400 font-black">
                        SEASON 8 ACTIVE
                      </span>

                      <button
                        onClick={() => changeRoom('leaderboard')}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        ENTER ARENA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // Room viewport render
            <motion.div
              key="room-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              {activeRoom === 'reactor' && <MainReactor state={state} setState={setState} addLog={addLog} logs={logs} />}
              {activeRoom === 'workshop' && <Workshop state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'lab' && <ResearchLab state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'ai' && <AICore state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'missions' && <DailyMissions state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'guild' && <GuildHall state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'treasury' && <Treasury state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'profile' && <MemberProfile state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'leaderboard' && <Leaderboard state={state} setState={setState} addLog={addLog} />}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Futuristic Cyber-Footer */}
      <footer className="border-t border-white/5 bg-[#0a0a0c] py-4 px-6 mx-4 mb-2 rounded-2xl text-center font-mono text-[9px] tracking-widest text-slate-500 flex flex-col md:flex-row justify-between items-center gap-2 shadow-lg z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
          <span>COGNITIVE COLD STATION DEPLOYED // RIG SYNC ACTIVE</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-cyan-400 transition-colors">DECENTRALIZED CONSENSUS</a>
          <span>•</span>
          <a href="#" className="hover:text-cyan-400 transition-colors">SYSTEM STABILITY CERTIFIED</a>
        </div>
      </footer>

    </div>
  );
}
