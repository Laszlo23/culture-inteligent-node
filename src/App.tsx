/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Battery, ShieldAlert, Cpu, Hammer, 
  Compass, Bot, Coins, Users, Calendar, 
  Map, LogIn, LayoutGrid, Award, Volume2, VolumeX, RefreshCw, User, Trophy, HelpCircle, Bell, Rocket
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

import OnboardingModal from './components/OnboardingModal';
import AuthPortal from './components/AuthPortal';
import AdminPanel from './components/AdminPanel';
import FeedbackPortal from './components/FeedbackPortal';
import PartnerProgram from './components/PartnerProgram';
import OnboardingHub from './components/OnboardingHub';

const INITIAL_NOTIFICATIONS = [
  { id: 'n_1', title: 'Welcome to Culture Node!', message: 'Deploy your hardware modules and start mining $BCC tokens.', timestamp: '12:00:00 PM', read: false, type: 'info' as const },
  { id: 'n_2', title: 'System Diagnostic', message: 'Main Reactor Core energy depleted to 38%. Attention required.', timestamp: '12:15:00 PM', read: false, type: 'warn' as const },
  { id: 'n_3', title: 'Daily Wheelspin Ready!', message: 'Spin the Lucky Wheel of Fortune to get free $BCC tokens!', timestamp: '12:30:00 PM', read: false, type: 'success' as const },
  { id: 'n_4', title: 'New Message from System Admin', message: 'Admin broadcast: "Network Optimization" is waiting in your inbox.', timestamp: '12:35:00 PM', read: false, type: 'message' as const, relatedId: 'msg_1', relatedType: 'message' as const },
  { id: 'n_5', title: 'Support Ticket Resolved!', message: 'Admin responded to your Postgres Sync ticket. Read the response.', timestamp: '12:40:00 PM', read: false, type: 'success' as const, relatedId: 'fb_1', relatedType: 'ticket' as const }
];

const INITIAL_MESSAGES = [
  { id: 'msg_1', sender: 'System Admin', recipient: 'All Operators', subject: 'Network Optimization', content: 'Greeting Operator! Ensure your cooling systems are functional to maximize your daily $BCC hash rate. Let me know if you run into any validation anomalies.', timestamp: '10:00:00 AM', isRead: false },
];

const INITIAL_FEEDBACK = [
  { id: 'fb_1', user: 'Operator', type: 'Feedback' as const, subject: 'Relational Database Sync', message: 'Would be awesome if we had active Postgres DB persistence behind the Node ledger.', timestamp: 'Yesterday', status: 'Resolved' as const, reply: 'Excellent suggestion! We have prioritized this in the Season 8 roadmap.' }
];

const INITIAL_PARTNERS = [
  { id: 'p_1', name: 'Solana Devnet Syndicate', logo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300&auto=format&fit=crop&q=80', bonus: '+5% Global Efficiency Multiplier', bccRequired: 500, active: false, description: 'Direct data pipeline bridge to the devnet cluster validator.' },
  { id: 'p_2', name: 'Rust Core Foundation', logo: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=300&auto=format&fit=crop&q=80', bonus: '+15 PH/s Core Mining Power boost', bccRequired: 1200, active: false, description: 'Optimizes microcode loops using high-performance compiler tools.' },
  { id: 'p_3', name: 'Jupiter Aggregator', logo: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&auto=format&fit=crop&q=80', bonus: '+10% Global Efficiency booster', bccRequired: 800, active: false, description: 'Routes and pools swap volume across multiple decentralized DEX platforms.' }
];

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
    miningPower: 154.8, // Base (4.8) + Initial owned Miner NFT (150)
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
    },
    cognitiveTokens: 250, // Starting COGNITIVE utility tokens (CGT)
    minerNFTs: [
      {
        id: 'miner_1',
        name: 'Obsidian Pulse-Core',
        image: 'obsidian',
        hashrate: 150,
        level: 1,
        maxLevel: 5,
        rarity: 'Common',
        isListed: false,
        listingPrice: 0,
        upgradeCost: 50,
        mintAddress: 'ObsDN4b1tD777777777777777777777777777777',
        owner: 'Me',
        description: 'A dark obsidian rig housing dense silicon matrix processors.'
      },
      {
        id: 'miner_2',
        name: 'Helix Fusion-Cell',
        image: 'helix',
        hashrate: 450,
        level: 1,
        maxLevel: 5,
        rarity: 'Epic',
        isListed: true,
        listingPrice: 150,
        upgradeCost: 150,
        mintAddress: 'HlxFS4b1tD777777777777777777777777777777',
        owner: 'HackerStation9',
        description: 'Bends neural magnetic fields to optimize hash rate density.'
      },
      {
        id: 'miner_3',
        name: 'Quantum Nexus-Shard',
        image: 'quantum',
        hashrate: 1200,
        level: 1,
        maxLevel: 5,
        rarity: 'Mythic',
        isListed: true,
        listingPrice: 500,
        upgradeCost: 500,
        mintAddress: 'QtmNX4b1tD777777777777777777777777777777',
        owner: 'EcosystemVentures',
        description: 'Our top-tier quantum supercomputer rig with real on-chain ledger proofing.'
      }
    ],
    notifications: INITIAL_NOTIFICATIONS,
    messages: INITIAL_MESSAGES,
    feedback: INITIAL_FEEDBACK,
    partners: INITIAL_PARTNERS
  });

  const [activeRoom, setActiveRoom] = useState<string>('map');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);
  const [notificationTarget, setNotificationTarget] = useState<{ type: 'message' | 'ticket'; id: string } | null>(null);

  // Auth Session State
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string; walletAddress?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solana_current_user_session_v1');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const handleLoginSuccess = (user: { username: string; email: string; walletAddress?: string }) => {
    setCurrentUser(user);
    localStorage.setItem('solana_current_user_session_v1', JSON.stringify(user));
    
    // Check if there is a saved game state for this specific user
    const userSavedState = localStorage.getItem(`building_culture_state_${user.username}_v1`);
    if (userSavedState) {
      try {
        const parsed = JSON.parse(userSavedState);
        setState({
          ...parsed,
          notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
          messages: parsed.messages || INITIAL_MESSAGES,
          feedback: parsed.feedback || INITIAL_FEEDBACK,
          partners: parsed.partners || INITIAL_PARTNERS
        });
        addLog(`DATA SYNCHRONIZED: Loaded operational state from secure cloud ledger for "${user.username}".`, "success");
      } catch (e) {
        console.error("Failed to parse user saved state", e);
      }
    } else {
      // Migrate guest progress to this new user slot
      localStorage.setItem(`building_culture_state_${user.username}_v1`, JSON.stringify(state));
      addLog(`DATA SECURED: Progress linked to registered account "${user.username}".`, "info");
    }
    
    addLog(`GATEWAY AUTHORIZED: Active credential session established for "${user.username}".`, "success");
  };

  const handleLogout = () => {
    if (currentUser) {
      // Secure current progress into user slot
      localStorage.setItem(`building_culture_state_${currentUser.username}_v1`, JSON.stringify(state));
      localStorage.removeItem('solana_current_user_session_v1');
      addLog(`GATEWAY SECURED: Active session for "${currentUser.username}" closed. Cryptographic locks engaged.`, "system");
      setCurrentUser(null);
      setActiveRoom('map');
    }
  };

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solana_onboarding_dismissed');
      return saved !== 'true';
    }
    return true;
  });
  const [logs, setLogs] = useState<InspectionLog[]>([]);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const lastUserActionStateRef = React.useRef<string>('');

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
        setState({
          ...parsed,
          notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
          messages: parsed.messages || INITIAL_MESSAGES,
          feedback: parsed.feedback || INITIAL_FEEDBACK,
          partners: parsed.partners || INITIAL_PARTNERS
        });
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
    if (currentUser) {
      localStorage.setItem(`building_culture_state_${currentUser.username}_v1`, JSON.stringify(state));
    }

    // Construct a signature representing only the user-driven values of the state.
    // This filters out passive, high-frequency background updates (like the Treasury's ticker).
    const userActionSignature = JSON.stringify({
      credits: state.credits,
      miningPower: state.miningPower,
      energy: state.energy,
      efficiency: state.efficiency,
      facilityLevel: state.facilityLevel,
      hardware: state.hardware.map(h => ({ installed: h.installed, unlocked: h.unlocked })),
      workers: state.workers.map(w => ({ unlocked: w.unlocked, level: w.level, status: w.status })),
      rooms: state.rooms.map(r => ({ level: r.level, unlocked: r.unlocked })),
      dailyMissions: state.dailyMissions.map(m => m.completed),
      profile: state.profile
    });

    if (lastUserActionStateRef.current && lastUserActionStateRef.current !== userActionSignature) {
      setShowSaveToast(true);
      const timer = setTimeout(() => {
        setShowSaveToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    lastUserActionStateRef.current = userActionSignature;
  }, [state]);

  const changeRoom = (roomId: string) => {
    setActiveRoom(roomId);
    let roomName = "Facility Schematic";
    if (roomId === 'admin') {
      roomName = "Backstage Admin Control Centre";
    } else if (roomId === 'feedback') {
      roomName = "Feedback & Telemetry Support Portal";
    } else if (roomId === 'partners') {
      roomName = "Cooperative Node Alliances";
    } else if (roomId === 'onboarding') {
      roomName = "Ecosystem Hub & Onboarding Portal";
    } else {
      roomName = state.rooms.find(r => r.id === roomId)?.name || "Facility Schematic";
    }
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
      
      <AnimatePresence>
        {!currentUser && (
          <AuthPortal onLoginSuccess={handleLoginSuccess} />
        )}
      </AnimatePresence>

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
            <span className="text-[9px] font-mono tracking-widest uppercase text-amber-500 font-bold">WALLET ($BCC)</span>
            <span className="text-base font-black text-amber-400" title="Building Culture Coins">{state.credits} <span className="text-[10px] font-normal">BCC</span></span>
          </div>
        </div>

        {/* Global Season / Reset controls */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyan-950/20 border border-cyan-500/20 rounded-lg font-mono text-[10px] text-cyan-400 font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>@{currentUser.username}</span>
            </div>
          )}

          <button
            onClick={() => setShowOnboarding(true)}
            title="Open Operational Handbook / Onboarding Guide"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-950/10 text-slate-400 hover:text-cyan-400 rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>GUIDE</span>
          </button>

          <button
            onClick={() => changeRoom('onboarding')}
            title="Open Building Culture Onboarding & Ecosystem Hub"
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer ${
              activeRoom === 'onboarding'
                ? 'bg-amber-600/20 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : 'bg-white/5 border-white/10 hover:border-amber-500/30 hover:bg-amber-950/10 text-slate-400 hover:text-amber-400'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-amber-400" />
            <span>ECOSYSTEM HUB</span>
          </button>

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

          {/* Notifications Bell Center */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                if (!showNotificationsDropdown) {
                  setState(prev => ({
                    ...prev,
                    notifications: (prev.notifications || []).map(n => ({ ...n, read: true }))
                  }));
                }
              }}
              title="Notifications Center"
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/10 text-slate-400 hover:text-cyan-400 flex items-center justify-center transition-all cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              {(state.notifications || []).filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-[#0a0a0c] text-[8px] font-black font-mono text-white flex items-center justify-center animate-bounce">
                  {(state.notifications || []).filter(n => !n.read).length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotificationsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-72 bg-[#0a0a0c]/95 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 font-mono text-xs space-y-3 backdrop-blur-md"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="font-bold text-slate-200 uppercase tracking-widest text-[9px] flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-cyan-400" /> Notifications Centre
                    </span>
                    <button
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          notifications: []
                        }));
                      }}
                      className="text-[8px] text-slate-500 hover:text-red-400 uppercase font-black"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-white/[0.03]">
                    {(state.notifications || []).length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-[10px] italic">
                        No notifications to report. Node is peaceful.
                      </div>
                    ) : (
                      (state.notifications || []).map(noti => (
                        <div 
                          key={noti.id} 
                          onClick={() => {
                            if (noti.relatedId && noti.relatedType) {
                              setNotificationTarget({ type: noti.relatedType, id: noti.relatedId });
                              changeRoom('feedback');
                              setShowNotificationsDropdown(false);
                            }
                          }}
                          className={`pt-2 pb-1.5 px-1.5 flex gap-2 items-start text-[10px] rounded-lg transition-colors ${noti.relatedId ? 'cursor-pointer hover:bg-white/5 border border-white/5 hover:border-cyan-500/20' : ''}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                            noti.type === 'warn' ? 'bg-red-500 animate-pulse' :
                            noti.type === 'success' ? 'bg-emerald-500' :
                            noti.type === 'message' ? 'bg-purple-500' : 'bg-cyan-500'
                          }`} />
                          <div className="flex-1">
                            <span className="text-white font-bold block">{noti.title}</span>
                            <p className="text-slate-400 mt-0.5 leading-relaxed text-[9px]">{noti.message}</p>
                            <span className="text-[8px] text-slate-600 block mt-1 flex justify-between items-center">
                              <span>{noti.timestamp}</span>
                              {noti.relatedId && <span className="text-[7px] text-cyan-400 font-bold uppercase tracking-widest">View details &rarr;</span>}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              {activeRoom === 'profile' && <MemberProfile state={state} setState={setState} addLog={addLog} currentUser={currentUser} onLogout={handleLogout} />}
              {activeRoom === 'leaderboard' && <Leaderboard state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'admin' && <AdminPanel state={state} setState={setState} addLog={addLog} currentUser={currentUser} />}
              {activeRoom === 'feedback' && (
                <FeedbackPortal 
                  state={state} 
                  setState={setState} 
                  addLog={addLog} 
                  currentUser={currentUser} 
                  notificationTarget={notificationTarget} 
                  setNotificationTarget={setNotificationTarget} 
                />
              )}
              {activeRoom === 'partners' && <PartnerProgram state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'onboarding' && <OnboardingHub state={state} setState={setState} addLog={addLog} onEnterApp={() => changeRoom('reactor')} />}
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
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => changeRoom('onboarding')}
            className={`hover:text-cyan-400 transition-colors cursor-pointer uppercase font-mono text-[9px] tracking-widest flex items-center gap-1 ${activeRoom === 'onboarding' ? 'text-cyan-400 font-bold' : ''}`}
          >
            <Rocket className="w-2.5 h-2.5 text-cyan-400" /> Onboarding & Ecosystem
          </button>
          <span>•</span>
          <button
            onClick={() => changeRoom('partners')}
            className={`hover:text-amber-400 transition-colors cursor-pointer uppercase font-mono text-[9px] tracking-widest ${activeRoom === 'partners' ? 'text-amber-400 font-bold' : ''}`}
          >
            Partners Program
          </button>
          <span>•</span>
          <button
            onClick={() => changeRoom('feedback')}
            className={`hover:text-cyan-400 transition-colors cursor-pointer uppercase font-mono text-[9px] tracking-widest ${activeRoom === 'feedback' ? 'text-cyan-400 font-bold' : ''}`}
          >
            Lodge Feedback
          </button>
          <span>•</span>
          <button
            onClick={() => changeRoom('admin')}
            className={`hover:text-red-400 font-bold transition-colors cursor-pointer uppercase font-mono text-[9px] tracking-widest flex items-center gap-1 ${activeRoom === 'admin' ? 'text-red-400' : ''}`}
          >
            <span className="w-1 h-1 bg-red-500 rounded-full animate-ping" /> Admin Panel
          </button>
        </div>
      </footer>

      {/* Subtle 'System State Saved' Toast Notification */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#07070a]/95 border border-emerald-500/20 backdrop-blur-md px-4 py-3 rounded-xl shadow-[0_10px_30px_-5px_rgba(16,185,129,0.1)] pointer-events-none"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-black tracking-widest text-emerald-400 leading-none">
                LEDGER SECURED
              </span>
              <span className="font-sans text-[11px] font-semibold text-slate-200 mt-1">
                System State Saved
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Handbook Modal Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            onClose={(dontShowAgain) => {
              setShowOnboarding(false);
              if (dontShowAgain) {
                localStorage.setItem('solana_onboarding_dismissed', 'true');
                addLog("ONBOARDING: Handbook permanently dismissed from startup.", "system");
              } else {
                addLog("ONBOARDING: Handbook completed. Safe travels!", "info");
              }
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
