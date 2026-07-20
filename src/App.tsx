/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Battery, ShieldAlert, Cpu, Hammer, 
  Compass, Bot, Coins, Users, Calendar, 
  Map, LogIn, LayoutGrid, Award, Ear, Focus, Activity, RefreshCw, User, Trophy, HelpCircle, Bell, Rocket, Menu, Images, X, EyeOff, Share2, Sparkles
} from 'lucide-react';

import {
  api,
  clearWalletToken,
  ensureWalletApiSession,
  getCultureNameByWallet,
  getWalletToken,
} from './lib/api';
import type { Keypair } from '@solana/web3.js';
import { isEconomyConfigured } from './lib/solana-economy';
import { GameState, HardwareModule, AIWorker, FacilityRoom, Guild, DailyMission, InspectionLog } from './types';
import MainReactor from './components/MainReactor';
import Workshop from './components/Workshop';
import ResearchLab from './components/ResearchLab';
import ProductRoadmap from './components/ProductRoadmap';
import AICore from './components/AICore';
import DailyMissions from './components/DailyMissions';
import GuildHall from './components/GuildHall';
import Treasury from './components/Treasury';
import MemberProfile from './components/MemberProfile';
import Leaderboard from './components/Leaderboard';
import NftGallery from './components/nft/NftGallery';
import DashboardNftDeck from './components/nft/DashboardNftDeck';
import { NFT_POSTERS } from './lib/nft-media';
import AttentionShareModal from './components/AttentionShareModal';
import {
  markAttentionShareShown,
  pickAttentionShareTask,
  type AttentionShareTask,
} from './lib/attention-share-prompt';
import AuthPortal, { AuthAutoStart } from './components/AuthPortal';
import EconomyStatusBanner, { EconomyStatus } from './components/EconomyStatusBanner';
import AdminPanel from './components/AdminPanel';
import FeedbackPortal from './components/FeedbackPortal';
import PartnerProgram from './components/PartnerProgram';
import OnboardingHub from './components/OnboardingHub';
import { mergePartnerSeeds } from './lib/ecosystem-allies';
import { guildsFromDiscordHouses } from './lib/discord-community';
import NavMenu, { NavDestination, NavPhase } from './components/NavMenu';
import MobileBottomNav from './components/MobileBottomNav';
import LegalPages, { LegalPageId } from './components/LegalPages';
import InstallPrompt from './components/InstallPrompt';
import {
  AmbientField,
  AttentionBriefStrip,
  CinematicBackdrop,
  ClaimBurst,
  EnergyFlow,
  GlowPulse,
  RoomEnter,
  buildAttentionBrief,
} from './components/fx';
import RewardToastHost from './components/RewardToastHost';
import PlayerLevelChip from './components/PlayerLevelChip';
import { rewardAction } from './lib/reward-bus';
import FacilitySectorCard from './components/FacilitySectorCard';
import FieldDeckClaim from './components/FieldDeckClaim';
import HookLoopCampaign from './components/HookLoopCampaign';
import TrapIdRitual from './components/TrapIdRitual';
import CultureNameMine from './components/CultureNameMine';
import InviteSharePanel from './components/InviteSharePanel';
import GrowthFunStrip from './components/GrowthFunStrip';
import SoundControls from './components/SoundControls';
import { resolveDisplayIdentity, shareDisplayName } from './lib/display-identity';
import { useSound } from './lib/sound/SoundContext';
import { CORE_ATTENTION_SESSIONS } from './content/attention-intelligence';
import { normalizeCardCode } from './lib/field-deck';
import { getTruthById } from './lib/hook-loop-campaign';
import { getTrapById } from './lib/trap-id';
import { normalizeCultureLabel } from './lib/culture-names';
import { getPhantomProvider } from './lib/phantom';
import {
  dismissStory,
  ensureFirstRitualPending,
  isFirstRitualPending,
  isStoryDismissed,
} from './lib/first-run';
import {
  friendlyFailureDetail,
  isRecoverableUserErrorMessage,
  recoverableToastCooldownMs,
} from './lib/user-errors';
import {
  classifySuccessBeat,
  peekMomentum,
  tickMomentum,
} from './lib/play-momentum';
import PlayMomentumBar from './components/PlayMomentumBar';
import {
  advanceMetaQuest,
  bootstrapMetaQuestFromWorld,
  classifyMetaEvent,
  markChapterRewarded,
  markSealRewarded,
  peekMetaQuest,
  wasChapterRewarded,
  wasSealRewarded,
  type MetaQuestView,
} from './lib/meta-quest';
import MetaQuestWhisper from './components/MetaQuestWhisper';
import AnonymousChamber from './components/AnonymousChamber';
import HumanEconomyLanding from './components/HumanEconomyLanding';
import HumanPassportClaim from './components/HumanPassportClaim';
import HumanPassportDashboard from './components/HumanPassportDashboard';
import FirstContributionRitual from './components/FirstContributionRitual';
import PassportPreview from './components/PassportPreview';
import PassportShareCard from './components/PassportShareCard';
import {
  buildMemberInvitePost,
  hasHumanPassport,
  hasSpreadLove,
  markSpreadLove,
} from './lib/human-passport';
import {
  hasCompletedFirstContribution,
  hasSharedPassport,
  readFirstContribution,
} from './lib/first-contribution';
import { computeHumanScores } from './lib/human-economy';
import { pickQuote } from './lib/motivating-quotes';
import { resolveProgressTitle } from './lib/progress-title';
import { decodePassportShare } from './lib/passport-share';
import {
  captureInviteFromUrl,
  inviteWelcomeLine,
  markInviteClaimed,
} from './lib/community-invite';
import {
  fetchMyGrowthStats,
  inviteCodeFromWallet,
  reportGrowthEvent,
} from './lib/growth-loop';
import { signalMiniAppReady } from './lib/farcaster/miniapp-ready';
import { sendAttentionProofMemo } from './lib/poa-chain';
import { BRAND, SLOGANS } from './lib/brand-slogans';
import {
  CULTURE_BROADCAST,
  HEARING_MODE_URL,
  hasSeenCultureBroadcast,
  markCultureBroadcastSeen,
  shareCultureText,
} from './lib/culture-broadcast';
import { withRotatingOg } from './lib/og-share';
import { HearingModeContext } from './lib/hearing/context';
import { dispatchHearingSessionCommand } from './lib/hearing/session-bridge';
import {
  academyOpenScript,
  broadcastCopiedScript,
  broadcastScript,
  clubScript,
  hearingBannerLine,
  spreadDoneScript,
  statusScript,
} from './lib/hearing/scripts';
import { dispatchZenDecision } from './lib/hearing/zen-bridge';
import {
  isZenMode,
  setZenMode,
  zenModeOffScript,
  zenModeOnScript,
  type LearningDecision,
} from './lib/zen-duality';
import {
  hasAnyZenDecision,
  hasZenForFirstSpark,
  isHearTouched,
  markHearTouched,
  peekReturnGreetingNeeded,
  resolveMainLoopFlags,
  touchLoopVisit,
} from './lib/main-loop';
import { clearLoopWinningNext, type WinRail } from './lib/winning-flows';
import {
  mergeRealMissions,
  questDefsToMissions,
  getDailyClaimStatus,
  completedQuestCount,
  nextIncompleteQuest,
  wheelUnlocked,
  REAL_DAILY_QUESTS,
} from './lib/daily-quests';
import MainLoopStage from './components/MainLoopStage';
import StayLoopStrip from './components/StayLoopStrip';
import AwarenessStoryOverlay from './components/AwarenessStoryOverlay';
import MakeItRainDeck from './components/MakeItRainDeck';
import {
  buildAttentionSnapshot,
  isFocusModeStored,
  setFocusModeStored,
  track,
} from './lib/attention-metrics';
import {
  HEARING_BANNER_KEY,
  useHearingMode,
  type HearingCommandHandler,
} from './hooks/useHearingMode';
import HearingModeShell from './components/HearingModeShell';
import AttentionMetricsPanel from './components/AttentionMetricsPanel';

/** Demo seed IDs — stripped on hydrate so the bell isn't permanently "5 unread". */
const LEGACY_SEED_NOTIFICATION_IDS = new Set(['n_1', 'n_2', 'n_3', 'n_4', 'n_5']);
const INITIAL_NOTIFICATIONS: GameState['notifications'] = [];
const TOAST_ONCE_KEY = 'culture_toast_seen_v1';
/** Success celebrations can reappear in a long session; warns stay once-forever. */
const SUCCESS_TOAST_COOLDOWN_MS = 90_000;

function countsTowardMomentum(message: string): boolean {
  const m = message.toUpperCase();
  if (m.startsWith('MOMENTUM') || m.startsWith('OUTER CIRCUIT')) return false;
  if (
    m.includes('DATA SYNCHRONIZED') ||
    m.includes('DATA SECURED') ||
    m.includes('API SESSION') ||
    m.includes('ONBOARDING') ||
    m.includes('GATEWAY') ||
    m.includes('WALLET CONNECTED') ||
    m.includes('LOCAL WALLET') ||
    m.includes('ECONOMY SYNC') ||
    m.includes('SYSTEM REBOOTED') ||
    m.includes('GUIDE:')
  ) {
    return false;
  }
  return true;
}

function toastFingerprint(message: string): string {
  return message.replace(/\d+(\.\d+)?%/g, '%').replace(/\s+/g, ' ').trim().slice(0, 140);
}

function hasSeenToastOnce(fp: string): boolean {
  try {
    const raw = localStorage.getItem(TOAST_ONCE_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(fp);
  } catch {
    return false;
  }
}

function markToastSeenOnce(fp: string) {
  try {
    const raw = localStorage.getItem(TOAST_ONCE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (list.includes(fp)) return;
    list.push(fp);
    localStorage.setItem(TOAST_ONCE_KEY, JSON.stringify(list.slice(-40)));
  } catch {
    // ignore
  }
}

function stripLegacySeedNotifications(
  list: GameState['notifications'] | undefined
): NonNullable<GameState['notifications']> {
  return (list || []).filter((n) => !LEGACY_SEED_NOTIFICATION_IDS.has(n.id));
}

const INITIAL_MESSAGES = [
  { id: 'msg_1', sender: 'System Admin', recipient: 'All Operators', subject: 'Network Optimization', content: 'Greeting Operator! Keep your attention channel warm to maximize daily BCC yield. Report any verification anomalies.', timestamp: '10:00:00 AM', isRead: false },
];

const INITIAL_FEEDBACK = [
  { id: 'fb_1', user: 'Operator', type: 'Feedback' as const, subject: 'Relational Database Sync', message: 'Would be awesome if we had active Postgres DB persistence behind the Node ledger.', timestamp: 'Yesterday', status: 'Resolved' as const, reply: 'Excellent suggestion! We have prioritized this in the Season 8 roadmap.' }
];

const INITIAL_PARTNERS = [
  {
    id: 'p_1',
    name: 'Solana',
    logo: '/ecosystem/solana-mark.svg',
    url: 'https://solana.com/',
    role: 'Settlement Layer',
    bonus: '+5% Global Efficiency Multiplier',
    bccRequired: 500,
    active: false,
    description: 'Culture Node settles Proof of Attention on Solana Devnet — sub-second blocks, cheap memos, one shared ledger.',
    wow: 'Blocks land in ~400ms. No L2 maze — attention proofs can feel instant.',
  },
  {
    id: 'p_2',
    name: 'Rust',
    logo: '/ecosystem/rust-mark.svg',
    url: 'https://www.rust-lang.org/',
    role: 'Program Language',
    bonus: '+15 PH/s Core Mining Power boost',
    bccRequired: 1200,
    active: false,
    description: 'Solana programs are written in Rust — memory-safe systems code underwriting on-chain attention proofs.',
    wow: 'The language of Solana programs is the same “fearless concurrency” stack that shipped Firefox and Cloudflare.',
  },
  {
    id: 'p_3',
    name: 'Jupiter',
    logo: '/ecosystem/jupiter.svg',
    url: 'https://jup.ag/',
    role: 'Liquidity Meta-Router',
    bonus: '+10% Global Efficiency booster',
    bccRequired: 800,
    active: false,
    description: 'Jupiter meta-aggregates Solana DEX liquidity so facility yield can meet the deepest route in one quote.',
    wow: 'One Jupiter quote can beat any single DEX — the default swap brain of Solana.',
  },
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
  { id: 'reactor', name: 'Attention Reactor', level: 1, maxLevel: 5, unlocked: true, costToUnlock: 0, costToUpgrade: 500, description: 'Converts verified attention into node energy and monitors core stability.', perk: '+15% Core Energy Capacity' },
  { id: 'workshop', name: 'Hardware Marketplace', level: 1, maxLevel: 5, unlocked: true, costToUnlock: 0, costToUpgrade: 600, description: 'Acquire and mount modules that amplify your facility’s attention throughput.', perk: '-10% Part Purchasing Costs' },
  { id: 'lab', name: 'Proof of Attention', level: 1, maxLevel: 5, unlocked: true, costToUnlock: 0, costToUpgrade: 700, description: 'Learn, create, and prove contribution — updates your Human Passport.', perk: '+20% Knowledge path boost' },
  { id: 'ai', name: 'Automation Center', level: 0, maxLevel: 3, unlocked: false, costToUnlock: 800, costToUpgrade: 1200, description: 'Deploy AI companions that passively boost facility output.', perk: '+5% Worker Passive Speed' },
  { id: 'treasury', name: 'Ecosystem Vault', level: 1, maxLevel: 3, unlocked: true, costToUnlock: 0, costToUpgrade: 1500, description: 'Claim yields, attest daily streaks, and operate the Solana Devnet portal.', perk: '+12% Hourly Claim Multiplier' },
  { id: 'guild', name: 'Apex Summit', level: 1, maxLevel: 1, unlocked: true, costToUnlock: 0, costToUpgrade: 0, description: 'Monthly chamber for the top of the top — faction houses feed the Apex Circle.', perk: '+10% Team Output · Apex seating' },
];

/** Faction houses — mirrored from Discord HQ (`discord-community.ts`) */
const INITIAL_GUILDS: Guild[] = guildsFromDiscordHouses();

const INITIAL_MISSIONS: DailyMission[] = questDefsToMissions();

export default function App() {
  // Farcaster Mini App: hide host splash once React is alive
  useEffect(() => {
    void signalMiniAppReady('app-mount');
  }, []);

  const settlementConfigured = isEconomyConfigured();
  const [state, setState] = useState<GameState>({
    // When Devnet mints are baked, start at zero — hydrate from chain after login
    credits: settlementConfigured ? 0 : 1200,
    miningPower: settlementConfigured ? 4.8 : 154.8,
    energy: 0, // Empty until First Spark / Academy earn
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
      farcasterUsername: '',
      profileCompletedRewardClaimed: false,
      xFollowClaimed: false,
      telegramJoinClaimed: false,
      discordJoinClaimed: false,
      xPostInteractionClaimed: false
    },
    cognitiveTokens: settlementConfigured ? 0 : 250,
    minerNFTs: settlementConfigured
      ? []
      : [
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

  const [pendingCardCode, setPendingCardCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return normalizeCardCode(new URLSearchParams(window.location.search).get('card'));
    } catch {
      return null;
    }
  });

  const [pendingTruthId, setPendingTruthId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const id = new URLSearchParams(window.location.search).get('truth');
      return getTruthById(id)?.id ?? null;
    } catch {
      return null;
    }
  });

  const [pendingTrapId, setPendingTrapId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const id = new URLSearchParams(window.location.search).get('trap');
      return getTrapById(id)?.id ?? null;
    } catch {
      return null;
    }
  });

  const [pendingCultureName, setPendingCultureName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const n = new URLSearchParams(window.location.search).get('name');
      const label = normalizeCultureLabel(n || '');
      return label || null;
    } catch {
      return null;
    }
  });

  const [inviteCode, setInviteCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return captureInviteFromUrl().record?.code ?? null;
  });

  const [activeRoom, setActiveRoom] = useState<string>(() => {
    if (typeof window === 'undefined') return 'map';
    try {
      const params = new URLSearchParams(window.location.search);
      if (normalizeCardCode(params.get('card'))) return 'field-deck';
      if (getTrapById(params.get('trap'))) return 'trap-id';
      if (getTruthById(params.get('truth'))) return 'hook-loop';
      const room = params.get('room');
      if (
        room === 'legal-privacy' ||
        room === 'legal-terms' ||
        room === 'legal-disclaimer' ||
        room === 'treasury' ||
        room === 'lab' ||
        room === 'map' ||
        room === 'field-deck' ||
        room === 'hook-loop' ||
        room === 'trap-id' ||
        room === 'culture-name' ||
        room === 'invite-share' ||
        room === 'passport'
      ) {
        return room;
      }
    } catch {
      // ignore
    }
    return 'map';
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);
  const [notificationTarget, setNotificationTarget] = useState<{ type: 'message' | 'ticket'; id: string } | null>(null);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsPanelRef = useRef<HTMLDivElement | null>(null);
  const shownToastsRef = useRef<Set<string>>(new Set());
  const successToastAtRef = useRef<globalThis.Map<string, number>>(new globalThis.Map());
  const recoverableWarnToastAtRef = useRef<globalThis.Map<string, number>>(new globalThis.Map());
  const flowToastTimerRef = useRef<number | null>(null);
  const [momentumUi, setMomentumUi] = useState(() => {
    const p = peekMomentum();
    return { beats: p.beats, nextAt: p.nextAt, progress: p.progressToNext };
  });
  const [metaView, setMetaView] = useState<MetaQuestView>(() => peekMetaQuest());
  const [rewardBurst, setRewardBurst] = useState<string | null>(null);

  // Auth Session State (wallet-only — no Firebase email/password gate)
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    email: string;
    walletAddress?: string;
    walletType?: import('./lib/wallet/types').SessionWalletType;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solana_current_user_session_v1');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  /** Cold-start story before wallet; GUIDE can reopen as replay. */
  const [showStory, setShowStory] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('solana_current_user_session_v1')) {
      return false;
    }
    return !isStoryDismissed();
  });
  const [storyDismissed, setStoryDismissed] = useState<boolean>(() => isStoryDismissed());
  const [firstRitualPending, setFirstRitualPending] = useState<boolean>(() =>
    isFirstRitualPending()
  );
  /** In-app Awareness Story (GUIDE / Why learn / ?story=1) */
  const [showAwarenessStory, setShowAwarenessStory] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return new URLSearchParams(window.location.search).get('story') === '1';
    } catch {
      return false;
    }
  });
  const [authAutoStart, setAuthAutoStart] = useState<AuthAutoStart>(null);
  const [economyStatus, setEconomyStatus] = useState<EconomyStatus | null>(null);
  const [economyStatusLoading, setEconomyStatusLoading] = useState(true);
  const [showMintMinerCta, setShowMintMinerCta] = useState(false);
  /** After First Spark: show from→to fuel strip before economy CTAs */
  const [fuelWin, setFuelWin] = useState<{ from: number; to: number } | null>(null);
  /** Loop Stage: Zen celebration line after Mind/Machine */
  const [zenNote, setZenNote] = useState<string | null>(null);
  /** Loop Stage: return after 20h+ away */
  const [returnGreeting, setReturnGreeting] = useState<string | null>(null);
  const [hearTouched, setHearTouched] = useState(() => isHearTouched());
  const [loopConnections, setLoopConnections] = useState<number | null>(null);
  /** Guided: peek facility without leaving Loop Stage default */
  const [loopFacilityOpen, setLoopFacilityOpen] = useState(false);
  /** Attention Toll shop deep-link highlight */
  const [tollHighlightSku, setTollHighlightSku] = useState<
    'spark_refill' | 'academy_retake' | 'claim_turbo' | 'list_slot' | 'spark_pack_100' | null
  >(null);
  /** Surface warn/fail where members actually look (not only Reactor logs) */
  const [flowToast, setFlowToast] = useState<{
    id: number;
    message: string;
    tone: 'warn' | 'success' | 'info';
  } | null>(null);
  const [apiSessionMissing, setApiSessionMissing] = useState(false);
  const [retryingApiSession, setRetryingApiSession] = useState(false);
  /** Human Passport claim — once per identity before workspace opens */
  const [passportPending, setPassportPending] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('solana_current_user_session_v1');
      if (!saved) return false;
      const user = JSON.parse(saved) as { walletAddress?: string };
      if (!user.walletAddress) return false;
      return !hasHumanPassport(user.walletAddress);
    } catch {
      return false;
    }
  });
  /** Magical first 5 min — First Contribution before claim / facility */
  const [firstContributionDone, setFirstContributionDone] = useState(() =>
    hasCompletedFirstContribution()
  );
  const [ritualStarted, setRitualStarted] = useState(() => hasCompletedFirstContribution());
  const [passportPreview, setPassportPreview] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const code = new URLSearchParams(window.location.search).get('passport');
      return code ? decodePassportShare(code) : null;
    } catch {
      return null;
    }
  });
  const [showCultureBroadcast, setShowCultureBroadcast] = useState(
    () => !hasSeenCultureBroadcast()
  );
  const [attentionShareTask, setAttentionShareTask] = useState<AttentionShareTask | null>(
    null
  );
  const [showAttentionShare, setShowAttentionShare] = useState(false);

  const dismissStoryToAuth = (auto: AuthAutoStart = null) => {
    dismissStory();
    setStoryDismissed(true);
    setShowStory(false);
    setAuthAutoStart(auto);
  };

  const openAwarenessStory = () => setShowAwarenessStory(true);

  const finishAwarenessStory = () => {
    setShowAwarenessStory(false);
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.has('story')) {
        u.searchParams.delete('story');
        window.history.replaceState({}, '', u.pathname + u.search + u.hash);
      }
    } catch {
      /* ignore */
    }
    setRewardBurst(
      firstRitualPending
        ? 'STORY LOCKED IN · START YOUR SPARK'
        : 'STORY LOCKED IN · PROVE ATTENTION'
    );
    changeRoom('lab');
    addLog(
      firstRitualPending
        ? 'STORY: Awareness complete — begin Proof of Attention (First Spark).'
        : 'STORY: Awareness complete — prove attention again.',
      'success'
    );
  };

  useEffect(() => {
    if (!showAwarenessStory) return;
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get('story') === '1') {
        u.searchParams.delete('story');
        window.history.replaceState({}, '', u.pathname + u.search + u.hash);
      }
    } catch {
      /* ignore */
    }
  }, [showAwarenessStory]);

  useEffect(() => {
    if (!currentUser) return;
    ensureFirstRitualPending();
    setFirstRitualPending(isFirstRitualPending());
  }, [currentUser]);

  // Main loop — return greeting (20h+) + connection chip
  useEffect(() => {
    if (!currentUser) return;
    const needed = peekReturnGreetingNeeded();
    touchLoopVisit();
    if (needed) {
      try {
        const streak = Number(localStorage.getItem('solana_daily_streak_v1') || '0');
        setReturnGreeting(
          streak > 0
            ? `Day ${streak} — claim Impact or prove again. The loop is waiting.`
            : 'Welcome back — claim Impact or prove again. One clear next step.'
        );
      } catch {
        setReturnGreeting('Welcome back — one clear next step on the loop.');
      }
    }
    const code = inviteCodeFromWallet(currentUser.walletAddress);
    if (!code) return;
    void fetchMyGrowthStats(code).then((stats) => {
      if (stats) setLoopConnections(stats.connections);
    });
  }, [currentUser?.walletAddress]);

  // After a return greeting, room changes rotate into motivating quotes
  const prevMotivationRoom = useRef(activeRoom);
  useEffect(() => {
    if (prevMotivationRoom.current === activeRoom) return;
    prevMotivationRoom.current = activeRoom;
    setReturnGreeting(null);
  }, [activeRoom]);

  useEffect(() => {
    if (!currentUser?.walletAddress) {
      setApiSessionMissing(false);
      return;
    }
    setApiSessionMissing(!getWalletToken());
  }, [currentUser?.walletAddress]);

  // Drop legacy demo alerts once so the bell badge isn't stuck at 5
  useEffect(() => {
    setState((prev) => {
      const current = prev.notifications || [];
      if (!current.some((n) => LEGACY_SEED_NOTIFICATION_IDS.has(n.id))) return prev;
      return { ...prev, notifications: stripLegacySeedNotifications(current) };
    });
  }, []);

  // Notifications panel: outside click / Escape closes — no second bell press required
  useEffect(() => {
    if (!showNotificationsDropdown) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const bell = notificationsMenuRef.current;
      const panel = notificationsPanelRef.current;
      const inBell = bell?.contains(target);
      const inPanel = panel?.contains(target);
      if (!inBell && !inPanel) {
        setShowNotificationsDropdown(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotificationsDropdown(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showNotificationsDropdown]);

  const retryFacilityApiSession = async () => {
    if (!currentUser?.walletAddress) return;
    setRetryingApiSession(true);
    try {
      let localKeypair: Keypair | null = null;
      if (currentUser.walletType === 'local') {
        const raw = localStorage.getItem('solana_local_secret');
        if (raw) {
          const { Keypair } = await import('@solana/web3.js');
          localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
        }
      }
      await ensureWalletApiSession({
        walletAddress: currentUser.walletAddress,
        walletType: currentUser.walletType,
        localKeypair,
      });
      setApiSessionMissing(false);
      addLog('API SESSION: restored — Academy proofs can attach.', 'success');
    } catch (e: any) {
      addLog(`API SESSION RETRY FAILED: ${friendlyFailureDetail(e)}`, 'warn');
    } finally {
      setRetryingApiSession(false);
    }
  };

  // Economy status + hydrate Player PDA / miners when configured
  useEffect(() => {
    if (!currentUser?.walletAddress) {
      setEconomyStatus(null);
      setEconomyStatusLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setEconomyStatusLoading(true);
      try {
        const { fetchEconomyStatus } = await import('./lib/api');
        const {
          ensurePlayerOnChain,
          syncLedgerToState,
          syncMinersToState,
        } = await import('./lib/economy-actions');
        const status = await fetchEconomyStatus();
        if (cancelled) return;
        setEconomyStatus(status);
        if (!status.ready) {
          addLog(
            'ECONOMY: Not configured — Academy/fuel settle locally until bootstrap (see banner).',
            'warn'
          );
          return;
        }
        await ensurePlayerOnChain();
        if (cancelled) return;
        await syncLedgerToState(setState);
        if (cancelled) return;
        const miners = await syncMinersToState(setState);
        if (!cancelled) {
          addLog(
            `ECONOMY SYNC: On-chain ledger + ${(miners?.owned || []).length} miner(s) (program ${status.programId.slice(0, 8)}…).`,
            'success'
          );
          const hasOnchain = (miners?.owned || []).length > 0;
          setShowMintMinerCta(!hasOnchain && !isFirstRitualPending());
        }
      } catch (e: any) {
        if (!cancelled) {
          setEconomyStatus({
            ready: false,
            programId: 'unknown',
            bccMint: null,
            cgtMint: null,
            reasons: [e?.message || 'Failed to reach /api/economy/status'],
          });
          addLog(`ECONOMY SYNC deferred: ${friendlyFailureDetail(e)}`, 'warn');
        }
      } finally {
        if (!cancelled) setEconomyStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.walletAddress]);

  /** Prefer mined Culture Name (laszlo.culture) over Op_… handle */
  useEffect(() => {
    const wallet = currentUser?.walletAddress;
    if (!wallet) return;
    let cancelled = false;
    void getCultureNameByWallet(wallet)
      .then((r) => {
        if (cancelled || !r.claimed || !r.full) return;
        setCurrentUser((prev) => {
          if (!prev || prev.username === r.full) return prev;
          const next = { ...prev, username: r.full! };
          try {
            localStorage.setItem('solana_current_user_session_v1', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [currentUser?.walletAddress]);

  const handleLoginSuccess = (user: {
    username: string;
    email: string;
    walletAddress?: string;
    walletType?: import('./lib/wallet/types').SessionWalletType;
  }) => {
    setCurrentUser(user);
    localStorage.setItem('solana_current_user_session_v1', JSON.stringify(user));

    // Ensure Ecosystem Vault (Solana portal) is unlocked for demo / jury review
    setState(prev => ({
      ...prev,
      rooms: prev.rooms.map(r =>
        r.id === 'treasury' ? { ...r, unlocked: true, level: Math.max(r.level, 1) } : r
      ),
    }));

    const userSavedState = localStorage.getItem(`building_culture_state_${user.username}_v1`);
    if (userSavedState) {
      try {
        const parsed = JSON.parse(userSavedState);
        const rooms = (parsed.rooms || INITIAL_ROOMS).map((r: FacilityRoom) =>
          r.id === 'treasury' ? { ...r, unlocked: true, level: Math.max(r.level || 0, 1) } : r
        );
        setState({
          ...parsed,
          rooms,
          notifications: stripLegacySeedNotifications(parsed.notifications),
          messages: parsed.messages || INITIAL_MESSAGES,
          feedback: parsed.feedback || INITIAL_FEEDBACK,
          partners: mergePartnerSeeds(parsed.partners, INITIAL_PARTNERS)
        });
        addLog(`DATA SYNCHRONIZED: Loaded facility state for wallet operator "${user.username}".`, "success");
      } catch (e) {
        console.error("Failed to parse user saved state", e);
      }
    } else {
      localStorage.setItem(`building_culture_state_${user.username}_v1`, JSON.stringify(state));
      addLog(`DATA SECURED: Progress linked to wallet "${user.walletAddress?.slice(0, 8)}…".`, "info");
    }

    ensureFirstRitualPending();
    setFirstRitualPending(isFirstRitualPending());
    setShowStory(false);
    setPassportPending(user.walletAddress ? !hasHumanPassport(user.walletAddress) : false);

    const walletHint = user.walletAddress
      ? ` (${user.walletAddress.slice(0, 4)}…${user.walletAddress.slice(-4)})`
      : '';
    addLog(
      `WALLET LINKED: "${user.username}"${walletHint}. We're here for attention — Club oath, then prove it (First Spark).`,
      'success'
    );
  };

  const handleLogout = () => {
    if (currentUser) {
      localStorage.setItem(`building_culture_state_${currentUser.username}_v1`, JSON.stringify(state));
      localStorage.removeItem('solana_current_user_session_v1');
      localStorage.removeItem('solana_wallet_session_v1');
      // Wipe session keys from this browser (honest "wipe anytime")
      localStorage.removeItem('solana_local_secret');
      localStorage.removeItem('building_culture_admin');
      clearWalletToken();
      if (currentUser.walletType === 'extension') {
        try {
          void getPhantomProvider()?.disconnect();
        } catch {
          // ignore
        }
      }
      addLog(
        `GATEWAY SECURED: "${currentUser.username}" signed out — local secret & API session cleared.`,
        'system'
      );
      setCurrentUser(null);
      setActiveRoom('map');
    }
  };

  const [logs, setLogs] = useState<InspectionLog[]>([]);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [showHearingBanner, setShowHearingBanner] = useState(() => {
    try {
      return localStorage.getItem(HEARING_BANNER_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const [focusMode, setFocusModeState] = useState(() => isFocusModeStored());
  const [showMetricsPanel, setShowMetricsPanel] = useState(false);
  const focusPinnedRef = useRef(false);
  const focusModeRef = useRef(focusMode);
  focusModeRef.current = focusMode;

  // Attention share modal — one social task after the member is in the workspace
  useEffect(() => {
    if (!currentUser) return;
    if (firstRitualPending || !hasCompletedFirstContribution()) return;
    if (focusMode || showCultureBroadcast || showStory || showAwarenessStory || passportPending)
      return;
    if (showAttentionShare) return;

    const delayMs = 12_000;
    const timer = window.setTimeout(() => {
      if (focusModeRef.current) return;
      const task = pickAttentionShareTask();
      if (!task) return;
      markAttentionShareShown(task.id);
      setAttentionShareTask(task);
      setShowAttentionShare(true);
      track('attention_share_show', { task: task.id });
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [
    currentUser?.walletAddress,
    firstRitualPending,
    focusMode,
    showCultureBroadcast,
    showStory,
    showAwarenessStory,
    passportPending,
    showAttentionShare,
  ]);

  const setFocusMode = useCallback((on: boolean, opts?: { pinned?: boolean; source?: string }) => {
    if (opts?.pinned != null) focusPinnedRef.current = opts.pinned;
    if (focusModeRef.current === on) {
      setFocusModeStored(on);
      return;
    }
    setFocusModeState(on);
    setFocusModeStored(on);
    if (on) track('focus_enter', { source: opts?.source || 'ui' });
    else track('focus_exit', { source: opts?.source || 'ui' });
  }, []);

  const requestFocus = useCallback(
    (on: boolean) => {
      if (!on && focusPinnedRef.current) return;
      if (on) setFocusMode(true, { source: 'academy' });
      else if (!focusPinnedRef.current) setFocusMode(false, { source: 'academy' });
    },
    [setFocusMode]
  );
  const lastUserActionStateRef = React.useRef<string>('');

  const attentionBrief = useMemo(() => {
    let completedAcademy: string[] = [];
    try {
      completedAcademy = JSON.parse(localStorage.getItem('kronos_academy_completed') || '[]');
    } catch {
      completedAcademy = [];
    }
    return buildAttentionBrief({
      energy: state.energy,
      missions: state.dailyMissions,
      notifications: state.notifications || [],
      completedAcademySessions: completedAcademy,
      coreSessionCount: CORE_ATTENTION_SESSIONS.length,
      metaDiscovered: metaView.discovered,
      metaSealed: metaView.sealed,
      metaRemaining: Math.max(0, metaView.total - metaView.completedCount),
      metaWhisper: metaView.current?.whisper ?? null,
      metaRoom: metaView.current?.room ?? null,
    });
  }, [state.energy, state.dailyMissions, state.notifications, metaView]);


  const pushFlowToast = (message: string, tone: 'warn' | 'success') => {
    const id = Date.now();
    setFlowToast({ id, message, tone });
    if (flowToastTimerRef.current) window.clearTimeout(flowToastTimerRef.current);
    flowToastTimerRef.current = window.setTimeout(() => {
      setFlowToast((prev) => (prev?.id === id ? null : prev));
      flowToastTimerRef.current = null;
    }, tone === 'success' && message.startsWith('OUTER CIRCUIT') ? 6500 : 4500);
  };

  const grantMetaRewards = (view: MetaQuestView) => {
    if (view.justClosed && !wasChapterRewarded(view.justClosed.id)) {
      const ch = view.justClosed;
      markChapterRewarded(ch.id);
      setState((prev) => ({
        ...prev,
        credits: prev.credits + ch.rewardBcc,
        energy: Math.min(100, prev.energy + ch.rewardEnergy),
        notifications: [
          {
            id: `meta_${ch.id}_${Date.now()}`,
            title: 'Outer Circuit',
            message: ch.reveal,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            type: 'success' as const,
          },
          ...(prev.notifications || []),
        ],
      }));
      rewardAction('outer_circuit', { label: ch.reveal.split('—')[0].trim() });
      const fuelBit = ch.rewardEnergy > 0 ? ` · +${ch.rewardEnergy}% fuel` : '';
      setRewardBurst(`OUTER · ${ch.reveal.split('—')[0].trim()} · +${ch.rewardBcc} BCC${fuelBit}`);
      pushFlowToast(
        `OUTER CIRCUIT: ${ch.reveal} (+${ch.rewardBcc} BCC${fuelBit})`,
        'success'
      );
    }
    if (view.sealBonus && !wasSealRewarded()) {
      const bonus = view.sealBonus;
      markSealRewarded();
      setState((prev) => ({
        ...prev,
        credits: prev.credits + bonus.bcc,
        energy: Math.min(100, prev.energy + bonus.energy),
        efficiency: parseFloat((prev.efficiency + bonus.efficiency).toFixed(3)),
        notifications: [
          {
            id: `meta_seal_${Date.now()}`,
            title: 'Outer Circuit sealed',
            message: 'The quiet path above all quests is complete. Duality holds.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            type: 'success' as const,
          },
          ...(prev.notifications || []),
        ],
      }));
      setRewardBurst(`OUTER CIRCUIT SEALED · +${bonus.bcc} BCC · +eff`);
      pushFlowToast(
        `OUTER CIRCUIT SEALED: +${bonus.bcc} BCC · +${bonus.energy}% fuel · +${bonus.efficiency} efficiency`,
        'success'
      );
    }
  };

  // Helper log — warns once-forever; success can re-toast after cooldown; meta + momentum tick here
  useEffect(() => {
    const { record, fresh } = captureInviteFromUrl();
    if (!record?.code) return;
    setInviteCode(record.code);
    if (fresh) {
      track('invite_land', { code: record.code });
      void reportGrowthEvent({
        type: 'land',
        inviteCode: record.code,
        nonce: `land:${record.code}:${record.landedAt}`,
      });
    }
  }, []);

  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'system') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev, { timestamp: timeStr, message, type }]);

    if (type === 'success' && countsTowardMomentum(message)) {
      const beat = classifySuccessBeat(message);
      const tick = tickMomentum(beat);
      setMomentumUi({ beats: tick.beats, nextAt: tick.nextAt, progress: tick.progressToNext });
      if (tick.milestone) {
        const m = tick.milestone;
        setState((prev) => ({
          ...prev,
          credits: prev.credits + m.bcc,
          energy: Math.min(100, prev.energy + m.energy),
        }));
        const fuelBit = m.energy > 0 ? ` · +${m.energy}% fuel` : '';
        setRewardBurst(`${m.label} · +${m.bcc} BCC${fuelBit}`);
        pushFlowToast(`MOMENTUM: ${m.label} (+${m.bcc} BCC${fuelBit})`, 'success');
      }

      const metaEvent = classifyMetaEvent(message);
      if (metaEvent) {
        const nextMeta = advanceMetaQuest(metaEvent);
        setMetaView(nextMeta);
        grantMetaRewards(nextMeta);
      }
    }

    if (type !== 'warn' && type !== 'success') return;

    const fp = toastFingerprint(message);
    if (type === 'warn') {
      // Recoverable API/credit errors: cooldown only (Hearing lastLine is primary for voice).
      if (isRecoverableUserErrorMessage(message)) {
        const lastAt = recoverableWarnToastAtRef.current.get(fp) || 0;
        if (Date.now() - lastAt < recoverableToastCooldownMs()) return;
        recoverableWarnToastAtRef.current.set(fp, Date.now());
        pushFlowToast(message, 'warn');
        return;
      }
      if (shownToastsRef.current.has(fp) || hasSeenToastOnce(fp)) return;
      shownToastsRef.current.add(fp);
      markToastSeenOnce(fp);
      pushFlowToast(message, 'warn');
      return;
    }

    // Success: session cooldown only (long play stays rewarding)
    const lastAt = successToastAtRef.current.get(fp) || 0;
    if (Date.now() - lastAt < SUCCESS_TOAST_COOLDOWN_MS) return;
    successToastAtRef.current.set(fp, Date.now());
    pushFlowToast(message, 'success');
  };

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('building_culture_state_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let kpiProof = parsed.kpiProof;
        try {
          const rawProof = localStorage.getItem('building_culture_kpi_proof_v1');
          if (!kpiProof && rawProof) kpiProof = JSON.parse(rawProof);
        } catch {
          // ignore
        }
        setState({
          ...parsed,
          kpiProof,
          dailyMissions: mergeRealMissions(parsed.dailyMissions),
          rooms: (parsed.rooms || INITIAL_ROOMS).map((r: FacilityRoom) => {
            const seed = INITIAL_ROOMS.find((s) => s.id === r.id);
            let next = seed
              ? { ...r, name: seed.name, description: seed.description }
              : r;
            if (next.id === 'treasury') {
              next = { ...next, unlocked: true, level: Math.max(next.level || 0, 1) };
            }
            return next;
          }),
          notifications: stripLegacySeedNotifications(parsed.notifications),
          messages: parsed.messages || INITIAL_MESSAGES,
          feedback: parsed.feedback || INITIAL_FEEDBACK,
          partners: mergePartnerSeeds(parsed.partners, INITIAL_PARTNERS)
        });
      } catch (e) {
        console.error("Failed to parse local storage game state.", e);
      }
    }

    // Quiet boot — fuel warning toast only once per browser (not every reload)
    addLog('Facility online. Attention channel stable.', 'system');
    if (state.energy < 40) {
      addLog(
        `NOTICE: Impact Score at ${state.energy}. First Spark in Academy restores reserves.`,
        'warn'
      );
    }

    // Outer Circuit: sync hidden chapters from world progress already earned
    try {
      const academyCompleted: string[] = JSON.parse(
        localStorage.getItem('kronos_academy_completed') || '[]'
      );
      const savedState = localStorage.getItem('building_culture_state_v1');
      const parsed = savedState ? JSON.parse(savedState) : null;
      bootstrapMetaQuestFromWorld({
        firstRitualDone: !isFirstRitualPending(),
        academyCompleted,
        hasKpi: Boolean(parsed?.kpiProof?.signature),
        hasMountedHardware: Boolean(
          parsed?.hardware?.some((h: { installed?: boolean }) => h.installed)
        ),
        hasClaimedDaily: Boolean(localStorage.getItem('solana_daily_last_claim_v1')),
        missionsDone: (parsed?.dailyMissions || []).filter((m: DailyMission) => m.completed).length,
        hasPresence: Boolean(
          parsed?.profile?.profileCompletedRewardClaimed ||
            localStorage.getItem('last_check_in_timestamp')
        ),
      });
      setMetaView(peekMetaQuest());
    } catch {
      // ignore
    }
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

  const { play: playSound } = useSound();

  const changeRoom = (roomId: string) => {
    if (activeRoom === 'lab' && roomId !== 'lab') {
      requestFocus(false);
    }
    if (roomId === 'lab') {
      requestFocus(true);
    }
    if (roomId !== activeRoom) playSound('enter');
    setActiveRoom(roomId);
    let roomName = "Facility Schematic";
    if (roomId === 'admin') {
      roomName = "Backstage Admin Control Centre";
    } else if (roomId === 'feedback') {
      roomName = "Feedback & Telemetry Support Portal";
    } else if (roomId === 'void') {
      roomName = 'The Void — Nameless Questions';
    } else if (roomId === 'partners') {
      roomName = "Cooperative Node Alliances";
    } else if (roomId === 'onboarding') {
      roomName = 'Ecosystem Hub';
    } else if (roomId === 'missions') {
      roomName = 'Quests — Learn · Build · Contribute';
    } else if (roomId === 'legal-privacy') {
      roomName = "Privacy Policy";
    } else if (roomId === 'legal-terms') {
      roomName = "Terms of Use";
    } else if (roomId === 'legal-disclaimer') {
      roomName = "Disclaimer";
    } else if (roomId === 'roadmap') {
      roomName = "Product Roadmap — 2D to AR";
    } else if (roomId === 'profile') {
      roomName = "Member Profile";
    } else if (roomId === 'leaderboard') {
      roomName = "Season Leaderboard";
    } else if (roomId === 'guild') {
      roomName = 'Apex Summit — Monthly Top Circle';
    } else if (roomId === 'field-deck') {
      roomName = 'Field Deck — Hunt & Claim';
    } else if (roomId === 'hook-loop') {
      roomName = 'Hook Loop — Meme Truths';
    } else if (roomId === 'trap-id') {
      roomName = 'Scroll Trap ID — What’s your bait?';
    } else if (roomId === 'culture-name') {
      roomName = 'Culture Names — Mine yours';
    } else if (roomId === 'invite-share') {
      roomName = 'Invite Cards — Grow the base';
    } else if (roomId === 'passport') {
      roomName = 'Human Passport';
    } else if (roomId === 'lab') {
      roomName = 'Proof of Attention — Learn';
    } else {
      roomName = state.rooms.find(r => r.id === roomId)?.name || 'Workspace';
    }
    addLog(`Entering ${roomName}...`, "info");

    if (roomId === 'missions') {
      setTimeout(() => {
        document.getElementById('lucky-wheel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
    if (roomId === 'treasury') {
      setTimeout(() => {
        document.getElementById('attention-toll-shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
  };

  const hearingWorldRef = useRef({
    state,
    activeRoom,
    firstRitualPending,
    currentUser,
    changeRoom,
    addLog,
    passportPending,
  });
  hearingWorldRef.current = {
    state,
    activeRoom,
    firstRitualPending,
    currentUser,
    changeRoom,
    addLog,
    passportPending,
  };

  const hearingCommandHandler = useCallback<HearingCommandHandler>(async (cmd, { speakLine }) => {
    if (await dispatchHearingSessionCommand(cmd)) return true;

    const w = hearingWorldRef.current;

    switch (cmd) {
      case 'status': {
        await speakLine(
          statusScript({
            energy: w.state.energy,
            miningPower: w.state.miningPower,
            credits: w.state.credits,
            room: w.activeRoom,
            firstRitualPending: w.firstRitualPending,
          })
        );
        return true;
      }
      case 'academy': {
        w.changeRoom('lab');
        await speakLine(academyOpenScript());
        w.addLog('HEARING: Opening Attention Academy.', 'system');
        return true;
      }
      case 'zen': {
        const next = !isZenMode();
        setZenMode(next);
        track('zen_mode_toggle', { on: next });
        await speakLine(next ? zenModeOnScript() : zenModeOffScript());
        w.addLog(
          next
            ? 'ZEN: Knowledge first. Duality holds — Mind ↔ Machine.'
            : 'ZEN: Off. Decision break still waits at Academy ready.',
          'system'
        );
        return true;
      }
      case 'focus': {
        const next = !focusModeRef.current;
        setFocusMode(next, { pinned: next, source: 'hearing' });
        await speakLine(
          next
            ? 'Focus Mode on. Facility chrome dims. Full attention.'
            : 'Focus Mode off. Facility chrome restored.'
        );
        return true;
      }
      case 'metrics': {
        const snap = buildAttentionSnapshot(7);
        setShowMetricsPanel(true);
        await speakLine(
          `A gentle seven-day snapshot. Active days ${snap.uniqueDaysActive}. Hearing opens ${snap.hearingOpens}. Academy starts ${snap.academyStarts}. Hook Mirrors ${snap.hookMirrors}. Zen Mind ${snap.zenMind}, Machine ${snap.zenMachine}. Spreads ${snap.spreads}. Focus minutes about ${snap.focusMinutesApprox}. You are building something real.`
        );
        return true;
      }
      case 'mind': {
        if (await dispatchZenDecision('hold_knowledge')) return true;
        await speakLine(
          'Mind is the knowledge pole. Finish the Academy exercise first — then choose Mind or Machine at the Zen break.'
        );
        return true;
      }
      case 'machine': {
        if (await dispatchZenDecision('convert_fuel')) return true;
        await speakLine(
          'Machine is the fuel pole. Finish the Academy exercise first — then say Machine to convert attention to fuel.'
        );
        return true;
      }
      case 'club': {
        await speakLine(clubScript());
        return true;
      }
      case 'map': {
        w.changeRoom('map');
        await speakLine('Facility map.');
        return true;
      }
      case 'spread': {
        const user = w.currentUser;
        if (!user?.walletAddress) {
          await speakLine('Secure your identity and claim a Human Passport before inviting others.');
          return true;
        }
        const post = buildMemberInvitePost({
          displayName: shareDisplayName({
            username: user.username,
            walletAddress: user.walletAddress,
          }),
          walletAddress: user.walletAddress,
        });
        try {
          const how = await shareCultureText(post);
          const first = !hasSpreadLove(user.walletAddress);
          markSpreadLove(user.walletAddress);
          track('spread_copy', { channel: 'hearing', first, how });
          void reportGrowthEvent({
            type: 'spread',
            actorCode: inviteCodeFromWallet(user.walletAddress),
            nonce: `spread:hearing:${user.walletAddress}:${how}:${first ? '1' : Date.now()}`,
          });
          await speakLine(spreadDoneScript(first));
          w.addLog(
            how === 'share'
              ? 'Spread shared — love on the move.'
              : 'Invite copied — pass it on.',
            'success'
          );
          if (first) {
            const res = await sendAttentionProofMemo({
              kind: 'spread',
              parts: { channel: 'hearing', how },
            });
            if ('signature' in res) {
              w.addLog(`Spread sealed on Devnet — ${res.solscan}`, 'success');
              await speakLine('Spread sealed on Devnet.');
            }
          }
        } catch {
          await speakLine('Spread cancelled.');
        }
        return true;
      }
      case 'broadcast': {
        try {
          const how = await shareCultureText(CULTURE_BROADCAST.sharePost);
          track('broadcast_share', { channel: 'hearing', how });
          await speakLine(broadcastCopiedScript());
          w.addLog(
            how === 'share'
              ? 'BROADCAST: Shared — Hearing Mode link included.'
              : 'BROADCAST: Share copy copied — paste to X, Telegram, Discord.',
            'success'
          );
        } catch {
          await speakLine(broadcastScript());
        }
        return true;
      }
      case 'next': {
        if (w.firstRitualPending) {
          w.changeRoom('lab');
          await speakLine(academyOpenScript());
          return true;
        }
        await speakLine('Say Academy, Status, Club, Spread, or Help.');
        return true;
      }
      case 'start':
      case 'option_1':
      case 'option_2':
      case 'option_3': {
        await speakLine('No quiz or timer waiting. Say Academy, or Help.');
        return true;
      }
      case 'stop':
      case 'repeat':
      case 'help':
      case 'exit':
      case 'unknown':
        return false;
      default: {
        const _exhaustive: never = cmd;
        void _exhaustive;
        return false;
      }
    }
  }, [setFocusMode]);

  const hearing = useHearingMode(hearingCommandHandler);

  const openTollShop = (
    sku?: 'spark_refill' | 'academy_retake' | 'claim_turbo' | 'list_slot' | 'spark_pack_100'
  ) => {
    setTollHighlightSku(sku || 'spark_refill');
    changeRoom('treasury');
  };

  const academyCompletedIds = (() => {
    try {
      return JSON.parse(localStorage.getItem('kronos_academy_completed') || '[]') as string[];
    } catch {
      return [] as string[];
    }
  })();
  const academyCompletedCount = academyCompletedIds.length;
  const hookMirrorPending =
    academyCompletedIds.includes('ai_first_spark') &&
    !academyCompletedIds.includes('ai_hook_mirror');
  const dailyClaimReady = (() => {
    if (!economyStatus?.ready) return false;
    try {
      const last = Number(localStorage.getItem('solana_daily_last_claim_v1') || '0');
      if (!last) return true;
      return Date.now() - last >= 20 * 60 * 60 * 1000;
    } catch {
      return true;
    }
  })();
  const spreadPending = Boolean(
    currentUser?.walletAddress &&
      hasHumanPassport(currentUser.walletAddress) &&
      !hasSpreadLove(currentUser.walletAddress)
  );
  const dailyStreak = (() => {
    try {
      return Number(localStorage.getItem('solana_daily_streak_v1') || '0');
    } catch {
      return 0;
    }
  })();
  const claimStatus = getDailyClaimStatus();
  const questsDoneToday = completedQuestCount(
    state,
    currentUser?.walletAddress
  );
  const nextQuest = nextIncompleteQuest(state, currentUser?.walletAddress);
  const wheelReadyToday = wheelUnlocked(state, currentUser?.walletAddress);

  const navPhase: NavPhase = firstRitualPending
    ? 'ritual'
    : academyCompletedCount < 2 || state.energy < 40
      ? 'guided'
      : 'open';

  const zenDone = hasZenForFirstSpark() || hasAnyZenDecision();
  const firstSparkDone =
    !firstRitualPending || academyCompletedIds.includes('ai_first_spark');
  const spreadDone = Boolean(
    currentUser?.walletAddress && hasSpreadLove(currentUser.walletAddress)
  );
  const returnTouched = (() => {
    try {
      return Number(localStorage.getItem('solana_daily_last_claim_v1') || '0') > 0;
    } catch {
      return false;
    }
  })();
  const loopFlags = resolveMainLoopFlags({
    hearTouched,
    firstRitualPending,
    firstSparkDone,
    zenDone,
    spreadDone,
    returnTouched,
    dailyClaimReady,
    fuelWin: Boolean(fuelWin),
    hookMirrorPending,
    energyLow: state.energy < 35,
  });
  const showLoopStage =
    navPhase === 'ritual' || (navPhase === 'guided' && !loopFacilityOpen);
  /** Hide facility chrome while the sacred loop owns the screen */
  const loopSanctuary = showLoopStage;

  const passportScores = useMemo(() => {
    const seed = readFirstContribution()?.scores ?? null;
    return computeHumanScores({
      academyCompletedCount,
      coreSessionTotal: CORE_ATTENTION_SESSIONS.length,
      missionsCompleted: state.dailyMissions.filter((m) => m.completed).length,
      missionsTotal: state.dailyMissions.length,
      snapshot: buildAttentionSnapshot(30),
      seed,
    });
  }, [
    academyCompletedCount,
    state.dailyMissions,
    fuelWin,
    zenNote,
    spreadDone,
  ]);

  const progressTitle = useMemo(() => {
    const wallet = currentUser?.walletAddress;
    return resolveProgressTitle(passportScores, {
      firstContribution: hasCompletedFirstContribution(),
      passportClaimed: wallet ? hasHumanPassport(wallet) : false,
    });
  }, [passportScores, currentUser?.walletAddress, firstRitualPending, fuelWin]);

  /** Culture Name wins the headline once mined — everywhere. */
  const displayIdentity = useMemo(
    () =>
      resolveDisplayIdentity({
        username: currentUser?.username,
        walletAddress: currentUser?.walletAddress,
        progressTitle: progressTitle.title,
      }),
    [currentUser?.username, currentUser?.walletAddress, progressTitle.title]
  );

  /** One strip: return greeting wins; otherwise room/phase quote */
  const loopMotivation =
    returnGreeting ?? pickQuote(`${activeRoom}:${navPhase}`);

  const enterHearingFromLoop = () => {
    markHearTouched();
    setHearTouched(true);
    if (!hearing.active) hearing.toggle();
  };

  const navNextStep = (() => {
    const you = displayIdentity.handle || 'operator';
    if (firstRitualPending) {
      return {
        id: 'lab' as NavDestination,
        label: 'Begin your first Spark',
        reason: `${SLOGANS.firstSpark} ${SLOGANS.firstSparkSupport}`,
      };
    }
    // Self-executing chain: fuel → Zen → Hook Mirror → Spread (before claim/grind)
    if (fuelWin) {
      const nextLabel = !zenDone
        ? 'Continue to Zen'
        : hookMirrorPending
          ? 'Continue to Hook Mirror'
          : spreadPending
            ? 'Continue to Spread'
            : 'Continue';
      return {
        id: 'lab' as NavDestination,
        label: nextLabel,
        reason: `${SLOGANS.firstSpark} Your passport scores moved — next is awareness.`,
      };
    }
    if (firstSparkDone && !zenDone) {
      return {
        id: 'lab' as NavDestination,
        label: 'Mind or Machine',
        reason: `${you}, knowledge first — hold it in Mind, or convert attention to Impact on Machine.`,
      };
    }
    if (hookMirrorPending) {
      return {
        id: 'lab' as NavDestination,
        label: 'Try Hook Mirror',
        reason: `${you}, name what hooks you when you scroll — Proof of Hook Awareness.`,
      };
    }
    if (spreadPending) {
      return {
        id: 'map' as NavDestination,
        label: 'Share your invite',
        reason: `${you}, one tap copies your invite — help someone start their passport.`,
      };
    }
    // First loop closed — daily return / grind
    if (dailyClaimReady) {
      return {
        id: 'treasury' as NavDestination,
        label: 'Claim today’s Impact',
        reason: `Your free refill is ready, ${you} — +15 Impact · +50 BCC.`,
      };
    }
    if (state.energy < 35) {
      return {
        id: 'lab' as NavDestination,
        label: 'Continue learning',
        reason: `${you}, keep proving attention — another short challenge grows your passport.`,
      };
    }
    // Loop clear → Partner Session (first $) / toll / Discord — not empty reactor
    const clearWin = clearLoopWinningNext({
      you,
      tollReady: Boolean(economyStatus?.ready),
      hasPassport: Boolean(
        currentUser?.walletAddress && hasHumanPassport(currentUser.walletAddress)
      ),
    });
    return {
      id: clearWin.id as NavDestination,
      label: clearWin.label,
      reason: clearWin.reason,
    };
  })();

  const loopWinRails = (() => {
    if (firstRitualPending || fuelWin || spreadPending || state.energy < 35) return [];
    if (dailyClaimReady || hookMirrorPending || !zenDone) return [];
    return clearLoopWinningNext({
      you: currentUser?.username?.replace(/^@/, '') || 'operator',
      tollReady: Boolean(economyStatus?.ready),
      hasPassport: Boolean(
        currentUser?.walletAddress && hasHumanPassport(currentUser.walletAddress)
      ),
    }).rails;
  })();

  const continueLoopChain = () => {
    setFuelWin(null);
    if (!zenDone || hookMirrorPending) {
      setLoopFacilityOpen(false);
      changeRoom('lab');
      addLog(
        !zenDone
          ? 'Zen next — Mind or Machine. Knowledge first.'
          : 'Hook Mirror next — name what owns your attention.',
        'info'
      );
      return;
    }
    if (spreadPending) {
      runLoopSpreadInvite();
      return;
    }
  };

  const advanceLoopBeat = () => {
    if (fuelWin) {
      continueLoopChain();
      return;
    }
    if (spreadPending) {
      runLoopSpreadInvite();
      return;
    }
    handleNavNavigate(navNextStep.id);
  };

  const runLoopSpreadInvite = () => {
    if (!currentUser?.walletAddress) {
      addLog('Connect a wallet to share your invite.', 'warn');
      return;
    }
    const first = !hasSpreadLove(currentUser.walletAddress);
    markSpreadLove(currentUser.walletAddress);
    track('spread_copy', { channel: 'invite_card_room', first });
    changeRoom('invite-share');
    addLog('INVITE: Pick a growth card — share image + text.', 'info');
    void reportGrowthEvent({
      type: 'spread',
      actorCode: inviteCodeFromWallet(currentUser.walletAddress),
      nonce: `spread:invite_card:${currentUser.walletAddress}:${first ? '1' : Date.now()}`,
    }).catch(() => undefined);
    if (first) {
      playSound('success');
      setRewardBurst('SPREAD · INVITE CARD · LOVE TRAVELS');
    } else {
      playSound('soft');
    }
  };

  const handleNavNavigate = (id: NavDestination) => {
    if (firstRitualPending) {
      const allowed: NavDestination[] = [
        'lab',
        'map',
        'passport',
        'hook-loop',
        'trap-id',
        'culture-name',
        'invite-share',
        'field-deck',
        'legal-privacy',
        'legal-terms',
        'legal-disclaimer',
      ];
      if (!allowed.includes(id)) {
        addLog(
          'Proof of Attention unlocks that room — ~2 min challenge to grow your passport.',
          'info'
        );
        changeRoom('lab');
        return;
      }
    }
    changeRoom(id);
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
      const configured = isEconomyConfigured();
      setState({
        credits: configured ? 0 : 1200,
        miningPower: 4.8,
        energy: 0,
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
          farcasterUsername: '',
          profileCompletedRewardClaimed: false,
          xFollowClaimed: false,
          telegramJoinClaimed: false,
          discordJoinClaimed: false,
          xPostInteractionClaimed: false
        },
        cognitiveTokens: configured ? 0 : 250,
        minerNFTs: configured
          ? []
          : [
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
      localStorage.removeItem('building_culture_state_v1');
      addLog("SYSTEM REBOOTED: Settings reset to defaults.", "system");
      setActiveRoom('map');
    }
  };

  // Shared passport deep link — growth land (no facility)
  if (passportPreview) {
    return (
      <HearingModeContext.Provider value={hearing}>
        <PassportPreview
          payload={passportPreview}
          onStartPassport={() => {
            setPassportPreview(null);
            try {
              const u = new URL(window.location.href);
              u.searchParams.delete('passport');
              window.history.replaceState({}, '', u.pathname + u.search);
            } catch {
              // ignore
            }
            dismissStory();
            setStoryDismissed(true);
            setShowStory(false);
            setRitualStarted(true);
            addLog('PASSPORT: Shared passport viewed — measure your first contribution.', 'info');
          }}
        />
        <HearingModeShell />
      </HearingModeContext.Provider>
    );
  }

  // Cold start: Landing → First Contribution ritual → secure ID (soft keep)
  if (!currentUser) {
    const showFirstRitual = ritualStarted && !firstContributionDone;
    return (
      <HearingModeContext.Provider value={hearing}>
        <div className="min-h-screen bg-[#050608] text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-300 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {showFirstRitual ? (
              <FirstContributionRitual
                key="first-contribution-guest"
                onComplete={() => {
                  /* scores persisted; stay on reveal until Keep / Continue */
                }}
                onKeepPassport={() => {
                  setFirstContributionDone(true);
                  dismissStoryToAuth(null);
                  addLog('PASSPORT: Keep your scores — secure your identity.', 'info');
                }}
                onContinueWorkspace={() => {
                  setFirstContributionDone(true);
                  dismissStoryToAuth(null);
                  addLog('PASSPORT: Continue — secure ID to improve your Human Value.', 'info');
                }}
              />
            ) : showStory && !ritualStarted ? (
              <HumanEconomyLanding
                key="cold-landing"
                onBuildPassport={() => {
                  dismissStory();
                  setStoryDismissed(true);
                  setShowStory(false);
                  setRitualStarted(true);
                  addLog('HUMAN ECONOMY: First contribution — measure your Human Passport.', 'info');
                }}
                onContinueSecure={() => {
                  dismissStoryToAuth(null);
                  addLog('HUMAN ECONOMY: Secure ID — then measure your first contribution.', 'info');
                }}
              />
            ) : (
              <AuthPortal
                key="cold-auth"
                autoStart={authAutoStart}
                onLoginSuccess={handleLoginSuccess}
              />
            )}
          </AnimatePresence>
          <HearingModeShell />
        </div>
      </HearingModeContext.Provider>
    );
  }

  // Magical path: First Contribution before claim wall / facility
  if (!firstContributionDone) {
    return (
      <HearingModeContext.Provider value={hearing}>
        <div className="min-h-screen bg-[#050608] text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-300 relative overflow-hidden">
          <FirstContributionRitual
            displayName={currentUser.username}
            walletAddress={currentUser.walletAddress}
            onComplete={() => {
              /* persist only — reveal stays until Continue */
            }}
            onKeepPassport={() => {
              setFirstContributionDone(true);
              if (currentUser.walletAddress && !hasHumanPassport(currentUser.walletAddress)) {
                setPassportPending(true);
              }
            }}
            onContinueWorkspace={() => {
              setFirstContributionDone(true);
              if (currentUser.walletAddress && !hasHumanPassport(currentUser.walletAddress)) {
                setPassportPending(true);
              } else {
                changeRoom('lab');
              }
            }}
          />
          <HearingModeShell />
        </div>
      </HearingModeContext.Provider>
    );
  }

  // Soft keep: claim passport after first contribution (not before value)
  if (passportPending && currentUser.walletAddress) {
    return (
      <HearingModeContext.Provider value={hearing}>
        <div className="min-h-screen bg-[#050608] text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-300 relative overflow-hidden">
          <HumanPassportClaim
            walletAddress={currentUser.walletAddress}
            walletType={currentUser.walletType}
            displayName={currentUser.username}
            inviteCode={inviteCode}
            addLog={addLog}
            onClaimed={({ invited }) => {
              if (inviteCode) {
                markInviteClaimed();
                track('invite_claim', { code: inviteCode });
                void reportGrowthEvent({
                  type: 'claim',
                  inviteCode,
                  actorCode: inviteCodeFromWallet(currentUser.walletAddress),
                  nonce: `claim:${inviteCode}:${currentUser.walletAddress}`,
                });
              }
              setPassportPending(false);
              setState((prev) => ({
                ...prev,
                notifications: [
                  {
                    id: `passport_${Date.now()}`,
                    title: 'Human Passport',
                    message: invited
                      ? 'Passport kept — share it, then prove attention to grow.'
                      : inviteCode
                        ? `Passport kept — welcome from ${inviteCode}. Improve your Human Value next.`
                        : 'Passport kept. Share it — then prove attention to grow scores.',
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    read: false,
                    type: 'success' as const,
                  },
                  ...(prev.notifications || []),
                ],
              }));
              addLog(
                inviteCode
                  ? `PASSPORT: Welcome via invite ${inviteCode}. Share your passport, then prove attention.`
                  : 'PASSPORT: Kept. Share your Human Passport — then improve it.',
                'system'
              );
            }}
            onStartProof={() => {
              setPassportPending(false);
              changeRoom('lab');
            }}
          />
          <HearingModeShell />
        </div>
      </HearingModeContext.Provider>
    );
  }

  return (
    <HearingModeContext.Provider value={hearing}>
    <div
      className={`min-h-screen bg-[#050506] text-slate-300 flex flex-col justify-between font-sans selection:bg-cyan-500/30 selection:text-cyan-300 relative overflow-x-hidden ${
        focusMode ? 'focus-mode-active' : ''
      }`}
    >

      {/* Background Atmosphere — spark field */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <AmbientField
          variant={firstRitualPending ? 'ritual' : 'duality'}
          dim={focusMode}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,211,238,0.05),transparent_55%),radial-gradient(ellipse_60%_40%_at_90%_20%,rgba(245,158,11,0.04),transparent_50%)]" />
      </div>

      {focusMode && (
        <div className="relative z-50 mx-4 mt-2 rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-amber-100/90 font-medium">
            Focus Mode — facility chrome dimmed. Knowledge first.
          </p>
          <button
            type="button"
            onClick={() => setFocusMode(false, { pinned: false, source: 'banner' })}
            className="px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-200 font-mono text-[10px] font-black uppercase cursor-pointer"
          >
            Exit focus
          </button>
        </div>
      )}

      {showCultureBroadcast && !focusMode && !loopSanctuary && (
        <div className="relative z-50 mx-4 mt-2 rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-950/80 via-[#0a0a0c]/95 to-cyan-950/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-amber-400">
              {CULTURE_BROADCAST.notificationTitle}
            </p>
            <p className="mt-1 text-sm font-semibold text-white leading-snug">
              {CULTURE_BROADCAST.sloganLoud}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed max-w-2xl">
              {CULTURE_BROADCAST.notificationBody}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => {
                void shareCultureText(CULTURE_BROADCAST.sharePost)
                  .then((how) => {
                    track('broadcast_share', { channel: 'banner', how });
                    addLog(
                      how === 'share'
                        ? 'BROADCAST: Shared — Hearing Mode link included.'
                        : 'BROADCAST: Share copy copied — paste to X, Telegram, Discord.',
                      'success'
                    );
                  })
                  .catch(() => {
                    /* user cancelled share sheet */
                  });
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              Share post
            </button>
            <button
              type="button"
              onClick={() => {
                void shareCultureText(CULTURE_BROADCAST.hearingSharePost)
                  .then((how) => {
                    track('broadcast_share', { channel: 'hearing_link', how });
                    addLog(
                      how === 'share'
                        ? 'HEARING: Deep link shared.'
                        : `HEARING: Link copied — ${HEARING_MODE_URL}`,
                      'success'
                    );
                  })
                  .catch(() => {
                    void navigator.clipboard?.writeText(HEARING_MODE_URL);
                    track('broadcast_share', { channel: 'hearing_link', how: 'clipboard' });
                    addLog(`HEARING: Link copied — ${HEARING_MODE_URL}`, 'success');
                  });
              }}
              className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              Hearing link
            </button>
            <button
              type="button"
              onClick={() => {
                markCultureBroadcastSeen();
                setShowCultureBroadcast(false);
                track('broadcast_dismiss');
              }}
              className="p-1.5 text-slate-500 hover:text-slate-200 cursor-pointer"
              aria-label="Dismiss broadcast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showHearingBanner && !hearing.active && !loopSanctuary && (
        <div className="relative z-50 mx-4 mt-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-cyan-100/90 font-medium">{hearingBannerLine()}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => hearing.enable()}
              className="px-3 py-1 rounded-lg bg-cyan-500 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              Enter Hearing
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem(HEARING_BANNER_KEY, '1');
                } catch {
                  // ignore
                }
                setShowHearingBanner(false);
              }}
              className="p-1 text-slate-500 hover:text-slate-200 cursor-pointer"
              aria-label="Dismiss hearing banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top bar — slim on mobile; desktop keeps facility metrics */}
      <header className="chrome-header aurora-edge border border-cyan-400/15 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-2 z-40 mx-3 sm:mx-4 mt-2 px-3 sm:px-6 py-3 sm:py-4 rounded-2xl flex items-center justify-between gap-3 shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_40px_rgba(34,211,238,0.08)]">
        {/* Left branding — tap home */}
        <button
          type="button"
          onClick={() => handleNavNavigate('map')}
          title="Home"
          aria-label="Go to home"
          className="relative z-[1] flex items-center gap-2.5 sm:gap-3 min-w-0 text-left cursor-pointer rounded-xl hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center relative overflow-hidden shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            <div className="absolute inset-0 bg-cyan-400/10 animate-pulse" />
            <div className="pointer-events-none absolute inset-0 holo-sheen opacity-60" />
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 relative z-10" />
          </div>
          <div className="min-w-0">
            <span className="hidden sm:block text-[10px] font-mono tracking-widest uppercase text-amber-500/80">
              {BRAND.parent}
            </span>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">{BRAND.product.toUpperCase()}</span>
              <span className="text-[8px] font-mono tracking-widest uppercase bg-cyan-950/60 border border-cyan-800 text-cyan-400 px-1.5 py-0.5 rounded shrink-0">
                {BRAND.passport}
              </span>
            </h1>
          </div>
        </button>

        <PlayerLevelChip
          compact
          className="relative z-[1] shrink-0"
          onClick={() => changeRoom('passport')}
        />

        {/* Desktop facility metrics — hidden during loop sanctuary + phone */}
        {!loopSanctuary && (
        <div
          className={`hidden md:flex flex-wrap items-center gap-4 lg:gap-8 font-mono text-xs transition-opacity ${
            focusMode ? 'opacity-40' : ''
          }`}
        >
          {!firstRitualPending && !focusMode && (
            <div className="flex flex-col">
              <span className="text-[9px] font-mono tracking-widest uppercase text-cyan-400">NODE OUTPUT</span>
              <span className="text-lg font-black text-white italic">
                {state.miningPower.toFixed(1)} <span className="text-[10px] text-cyan-500 font-normal not-italic">PH/s</span>
              </span>
            </div>
          )}

          <div className="flex flex-col min-w-[120px]">
            <span className="text-[9px] font-mono tracking-widest uppercase text-orange-500">IMPACT SCORE</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-black italic ${state.energy < 40 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {state.energy}%
              </span>
              <div className="w-16">
                <EnergyFlow energy={state.energy} />
              </div>
            </div>
          </div>

          {!firstRitualPending && !focusMode && (
            <>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono tracking-widest uppercase text-slate-500">EFFICIENCY</span>
                <span className="text-base font-bold text-cyan-400">x{state.efficiency.toFixed(2)}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-mono tracking-widest uppercase text-amber-500 font-bold">WALLET ($BCC)</span>
                <span className="text-base font-black text-amber-400" title="Building Culture Coins">{state.credits} <span className="text-[10px] font-normal">BCC</span></span>
              </div>
            </>
          )}
        </div>
        )}

        {/* Actions — Menu always available; Hear + bell on all viewports */}
        <div className="relative z-[1] flex items-center gap-1.5 sm:gap-3 shrink-0">
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-cyan-950/20 border border-cyan-500/20 rounded-lg font-mono text-[10px] text-cyan-400 font-bold uppercase" title={`${displayIdentity.atHandle}${currentUser.walletAddress ? ` · ${currentUser.walletAddress}` : ''}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {displayIdentity.isCultureName ? (
                <span className="normal-case tracking-wide text-cyan-100 font-black">
                  {displayIdentity.handle}
                </span>
              ) : (
                <span className="normal-case tracking-wide text-cyan-200">{progressTitle.title}</span>
              )}
              <span className="text-slate-500 font-normal">
                {displayIdentity.isCultureName
                  ? progressTitle.title
                  : displayIdentity.atHandle}
              </span>
              {currentUser.walletAddress && hasHumanPassport(currentUser.walletAddress) && (
                <span className="text-amber-400/90 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded" title="Human Passport claimed">
                  Passport
                </span>
              )}
              {currentUser.walletAddress && (
                <span className="text-slate-500 font-normal normal-case">
                  {currentUser.walletAddress.slice(0, 4)}…{currentUser.walletAddress.slice(-4)}
                </span>
              )}
              {currentUser.walletAddress && hasHumanPassport(currentUser.walletAddress) && (
                <button
                  type="button"
                  title="Copy your Human Passport invite"
                  onClick={() => {
                    const post = withRotatingOg({
                      text: buildMemberInvitePost({
                        displayName: shareDisplayName({
                          username: currentUser.username,
                          walletAddress: currentUser.walletAddress!,
                        }),
                        walletAddress: currentUser.walletAddress!,
                      }),
                      appendImageLink: true,
                    }).text;
                    void navigator.clipboard?.writeText(post).then(async () => {
                      const first = !hasSpreadLove(currentUser.walletAddress!);
                      markSpreadLove(currentUser.walletAddress!);
                      track('spread_copy', { channel: 'header', first });
                      void reportGrowthEvent({
                        type: 'spread',
                        actorCode: inviteCodeFromWallet(currentUser.walletAddress),
                        nonce: `spread:header:${currentUser.walletAddress}:${first ? '1' : Date.now()}`,
                      });
                      addLog(
                        first
                          ? 'Invite copied — pass it to someone who needs the hook.'
                          : 'Invite copied — love & knowledge on the move.',
                        'success'
                      );
                      if (first) {
                        const res = await sendAttentionProofMemo({
                          kind: 'spread',
                          parts: { channel: 'header' },
                        });
                        if ('signature' in res) {
                          addLog(`Spread sealed on Devnet — ${res.solscan}`, 'success');
                        }
                      }
                    });
                  }}
                  className="text-rose-300 border border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/20 px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Spread
                </button>
              )}
            </div>
          )}

          {/* Next-step CTA — desktop only; phone uses bottom Next chip */}
          {firstRitualPending ? (
            <button
              type="button"
              onClick={() => changeRoom('lab')}
              title="Continue First Spark"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-black rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer hover:bg-cyan-400"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>First Spark</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => advanceLoopBeat()}
              title={navNextStep.reason}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/15 border border-cyan-500/40 hover:bg-cyan-600/25 text-cyan-300 rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer max-w-[11rem]"
            >
              <span className="truncate">{navNextStep.label}</span>
            </button>
          )}

          <SoundControls />

          <button
            type="button"
            onClick={() => {
              markHearTouched();
              setHearTouched(true);
              hearing.toggle();
            }}
            title={hearing.active ? 'Exit Hearing Mode' : 'Enter Hearing Mode — ears first'}
            aria-pressed={hearing.active}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer border ${
              hearing.active
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-white/5 border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Ear className="w-4 h-4" />
            <span className="inline">{hearing.active ? 'Hearing' : 'Hear'}</span>
          </button>

          {!loopSanctuary && (
          <button
            type="button"
            onClick={() => {
              const next = !focusMode;
              setFocusMode(next, { pinned: next, source: 'header' });
              addLog(
                next
                  ? 'FOCUS: Chrome dimmed — full attention.'
                  : 'FOCUS: Facility chrome restored.',
                'system'
              );
            }}
            title={focusMode ? 'Exit Focus Mode' : 'Focus Mode — full attention'}
            aria-pressed={focusMode}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer border ${
              focusMode
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                : 'bg-white/5 border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-amber-300'
            }`}
          >
            <Focus className="w-4 h-4" />
            <span className="hidden lg:inline">Focus</span>
          </button>
          )}

          {!loopSanctuary && (
          <button
            type="button"
            onClick={() => setShowMetricsPanel(true)}
            title="Attention metrics (7d)"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden xl:inline">Metrics</span>
          </button>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            title="Open navigation"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer ${
              focusMode ? 'opacity-40' : ''
            }`}
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">More</span>
          </button>

          {navPhase === 'open' && (
            <button
              type="button"
              onClick={openAwarenessStory}
              title="Why learn — Awareness Story"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-amber-300 rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Story</span>
            </button>
          )}

          {/* Notifications Bell Center */}
          <div className="relative" ref={notificationsMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowNotificationsDropdown((open) => {
                  const next = !open;
                  if (next) {
                    setState((prev) => ({
                      ...prev,
                      notifications: (prev.notifications || []).map((n) => ({ ...n, read: true })),
                    }));
                  }
                  return next;
                });
              }}
              title="Notifications Center"
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-950/10 text-slate-400 hover:text-cyan-400 flex items-center justify-center transition-all cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              {(state.notifications || []).filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-[#0a0a0c] text-[8px] font-black font-mono text-white flex items-center justify-center">
                  {(state.notifications || []).filter(n => !n.read).length}
                </span>
              )}
            </button>

          </div>

          <button
            onClick={resetProgress}
            title="Wipe diagnostics ledger & restart simulation"
            className="hidden md:flex w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-red-950/20 text-slate-400 hover:text-red-400 items-center justify-center transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area — extra bottom pad on phone for fixed tab bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 z-10 relative pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-6">
        
        {/* Navigation Breadcrumb back button when inside a room */}
        {activeRoom !== 'map' && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex justify-between items-center"
          >
            <button
              type="button"
              onClick={() => changeRoom('map')}
              className="px-4 py-2 bg-[#0a0a0c] hover:bg-[#111115] border border-white/10 text-slate-200 font-mono text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <Map className="w-4 h-4 text-cyan-400" />
              BACK TO OVERVIEW
            </button>

            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline uppercase tracking-widest">
              {(() => {
                const roomIdx = state.rooms.findIndex((r) => r.id === activeRoom);
                if (roomIdx >= 0) return `SECTOR 0${roomIdx + 1}`;
                const labels: Record<string, string> = {
                  gallery: 'SECTOR_NFT',
                  missions: 'SECTOR_OPS',
                  profile: 'SECTOR_HQ',
                  leaderboard: 'SECTOR_ARENA',
                  void: 'SECTOR_VOID',
                  'field-deck': 'SECTOR_FIELD',
                  'hook-loop': 'SECTOR_HOOK',
                  'trap-id': 'SECTOR_TRAP',
                  'culture-name': 'SECTOR_NAME',
                  'invite-share': 'SECTOR_GROW',
                  passport: 'SECTOR_PASS',
                  roadmap: 'SECTOR_PATH',
                  onboarding: 'SECTOR_HUB',
                  partners: 'SECTOR_ALLY',
                  feedback: 'SECTOR_SIGNAL',
                  admin: 'SECTOR_BACKSTAGE',
                  'legal-privacy': 'LEGAL',
                  'legal-terms': 'LEGAL',
                  'legal-disclaimer': 'LEGAL',
                };
                return labels[activeRoom] ?? String(activeRoom).toUpperCase();
              })()}
            </span>
          </motion.div>
        )}

        {!firstRitualPending && !focusMode && (
          <>
            <MetaQuestWhisper
              view={metaView}
              onFollow={(roomId) => handleNavNavigate(roomId as NavDestination)}
            />
            <PlayMomentumBar
              beats={momentumUi.beats}
              nextAt={momentumUi.nextAt}
              progress={momentumUi.progress}
            />
          </>
        )}

        <div className="px-4 mb-4 space-y-2">
          {apiSessionMissing && (
            <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-amber-100/90 font-sans leading-relaxed">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-amber-200 block mb-0.5">
                  API session missing
                </span>
                Wallet is linked but proofs may fail until the API session lands. Retry here — stay in
                the loop.
              </p>
              <button
                type="button"
                onClick={() => void retryFacilityApiSession()}
                disabled={retryingApiSession}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer shrink-0 disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${retryingApiSession ? 'animate-spin' : ''}`} />
                Retry session
              </button>
            </div>
          )}
          {!loopSanctuary && (
            <EconomyStatusBanner
              status={economyStatus}
              loading={economyStatusLoading}
              onContinueAcademy={
                economyStatus && !economyStatus.ready ? () => changeRoom('lab') : undefined
              }
            />
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeRoom === 'map' ? (
            <RoomEnter key="map-view" roomKey="map-view">
              <div className="space-y-6">
              {showLoopStage ? (
                <>
                <MainLoopStage
                  flags={loopFlags}
                  phase={navPhase === 'ritual' ? 'ritual' : 'guided'}
                  username={currentUser?.username}
                  progressTitle={progressTitle.title}
                  energy={state.energy}
                  streak={dailyStreak}
                  connections={loopConnections}
                  fuelWin={fuelWin}
                  zenNote={zenNote}
                  returnGreeting={loopMotivation}
                  passportScores={passportScores}
                  cta={{
                    label: navNextStep.label,
                    reason: navNextStep.reason,
                    onGo: () => advanceLoopBeat(),
                  }}
                  winRails={loopWinRails}
                  onWinRail={(rail: WinRail) => {
                    if (rail.room) handleNavNavigate(rail.room as NavDestination);
                  }}
                  onHear={enterHearingFromLoop}
                  onDismissFuel={() => continueLoopChain()}
                  showOpenFacility={
                    navPhase === 'guided' && (spreadDone || state.energy >= 40)
                  }
                  onOpenFacility={() => setLoopFacilityOpen(true)}
                  onOpenStory={openAwarenessStory}
                  onStepAction={(step) => {
                    if (step === 'hear') {
                      enterHearingFromLoop();
                      return;
                    }
                    if (step === 'spark' || step === 'zen') {
                      setLoopFacilityOpen(false);
                      changeRoom('lab');
                      addLog(
                        step === 'spark'
                          ? 'LOOP: Spark — prove attention in Academy.'
                          : 'LOOP: Zen — Mind or Machine after your proof.',
                        'info'
                      );
                      return;
                    }
                    if (step === 'spread') {
                      runLoopSpreadInvite();
                      return;
                    }
                    advanceLoopBeat();
                  }}
                  stay={
                    firstRitualPending
                      ? null
                      : {
                          claimReady:
                            claimStatus.ready && Boolean(economyStatus?.ready),
                          msUntilNext: claimStatus.msUntilNext,
                          streak: dailyStreak,
                          questsDone: questsDoneToday,
                          questsTotal: REAL_DAILY_QUESTS.length,
                          wheelReady: wheelReadyToday,
                          nextQuestLabel: nextQuest?.label ?? null,
                          onClaim: () => changeRoom('treasury'),
                          onQuests: () => changeRoom('missions'),
                          onNextQuest: () => {
                            if (!nextQuest) {
                              changeRoom('missions');
                              return;
                            }
                            if (nextQuest.openHearing) {
                              enterHearingFromLoop();
                              return;
                            }
                            changeRoom(nextQuest.room);
                          },
                          onTrapId: () => {
                            setPendingTrapId(null);
                            changeRoom('trap-id');
                          },
                          onCultureName: () => {
                            setPendingCultureName(null);
                            changeRoom('culture-name');
                          },
                          cultureName: displayIdentity.isCultureName
                            ? displayIdentity.handle
                            : null,
                        }
                  }
                />
                {!firstRitualPending && spreadDone && hasSharedPassport() && (
                  <MakeItRainDeck
                    compact
                    onOpenPartners={() => changeRoom('partners')}
                    onOpenHearing={() => {
                      markHearTouched();
                      setHearTouched(true);
                      if (!hearing.active) hearing.toggle();
                    }}
                  />
                )}
                {!firstRitualPending && (
                  <DashboardNftDeck
                    state={state}
                    username={currentUser?.username}
                    compact
                    onOpenGallery={() => changeRoom('gallery')}
                    onOpenReactor={() => changeRoom('reactor')}
                  />
                )}
                </>
              ) : (
              <>
              {navPhase === 'guided' && loopFacilityOpen && (
                <button
                  type="button"
                  onClick={() => setLoopFacilityOpen(false)}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 uppercase tracking-wider cursor-pointer"
                >
                  ← Back to main loop
                </button>
              )}
              {currentUser && (
                <HumanPassportDashboard
                  username={currentUser.username}
                  progressTitle={progressTitle.title}
                  progressBlurb={progressTitle.blurb}
                  avatarUrl={state.profile?.avatarUrl}
                  walletAddress={currentUser.walletAddress}
                  state={state}
                  firstRitualPending={firstRitualPending}
                  academyCompletedCount={academyCompletedCount}
                  coreSessionTotal={CORE_ATTENTION_SESSIONS.length}
                  compact
                  farcasterUsername={state.profile?.farcasterUsername}
                  onLinkFarcaster={(username) => {
                    setState((prev) => ({
                      ...prev,
                      profile: {
                        ...(prev.profile || {
                          avatarUrl: '',
                          aboutMe: '',
                          xUsername: '',
                          telegramUsername: '',
                          discordUsername: '',
                          farcasterUsername: '',
                          profileCompletedRewardClaimed: false,
                          xFollowClaimed: false,
                          telegramJoinClaimed: false,
                          discordJoinClaimed: false,
                          xPostInteractionClaimed: false,
                        }),
                        farcasterUsername: username,
                      },
                    }));
                  }}
                  nextStep={{
                    label: navNextStep.label,
                    reason: navNextStep.reason,
                    onGo: () => handleNavNavigate(navNextStep.id),
                  }}
                  onOpenFull={() => changeRoom('passport')}
                  onOpenPartners={() => changeRoom('partners')}
                  onOpenHearing={() => {
                    markHearTouched();
                    setHearTouched(true);
                    if (!hearing.active) hearing.toggle();
                  }}
                  onOpenStory={openAwarenessStory}
                  onOpenSpark={() => {
                    setLoopFacilityOpen(false);
                    changeRoom('lab');
                  }}
                  onOpenReturn={() => advanceLoopBeat()}
                  onSpread={() => runLoopSpreadInvite()}
                />
              )}
              {!firstRitualPending && !showLoopStage && (
                <StayLoopStrip
                  claimReady={claimStatus.ready && Boolean(economyStatus?.ready)}
                  msUntilNext={claimStatus.msUntilNext}
                  streak={dailyStreak}
                  questsDone={questsDoneToday}
                  questsTotal={REAL_DAILY_QUESTS.length}
                  wheelReady={wheelReadyToday}
                  nextQuestLabel={nextQuest?.label ?? null}
                  onClaim={() => changeRoom('treasury')}
                  onQuests={() => changeRoom('missions')}
                  onNextQuest={() => {
                    if (!nextQuest) {
                      changeRoom('missions');
                      return;
                    }
                    if (nextQuest.openHearing) {
                      enterHearingFromLoop();
                      return;
                    }
                    changeRoom(nextQuest.room);
                  }}
                  onTrapId={() => {
                    setPendingTrapId(null);
                    changeRoom('trap-id');
                  }}
                  onCultureName={() => {
                    setPendingCultureName(null);
                    changeRoom('culture-name');
                  }}
                  cultureName={
                    displayIdentity.isCultureName ? displayIdentity.handle : null
                  }
                  compact
                />
              )}

              {!focusMode && !firstRitualPending && (
                <GrowthFunStrip
                  cultureName={
                    displayIdentity.isCultureName ? displayIdentity.handle : null
                  }
                  onTrapId={() => {
                    setPendingTrapId(null);
                    changeRoom('trap-id');
                  }}
                  onCultureName={() => {
                    setPendingCultureName(null);
                    changeRoom('culture-name');
                  }}
                  onInvite={() => changeRoom('invite-share')}
                />
              )}

              {!focusMode && navPhase === 'open' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-amber-400/35 shadow-[0_20px_60px_rgba(0,0,0,0.45)] px-4 py-4 md:px-5 flex flex-wrap items-center justify-between gap-3"
                >
                  <img
                    src="/campaign/failure-curve.webp"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-45"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0a0608]/90 via-[#0a080c]/75 to-amber-950/40" />
                  <div className="relative z-10 min-w-0 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-300/45 flex items-center justify-center shrink-0 backdrop-blur-md">
                      <Share2 className="w-4 h-4 text-amber-200" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-black tracking-[0.22em] uppercase text-amber-300">
                        Viral · Scroll Trap ID
                      </p>
                      <p className="mt-1 font-display text-lg font-bold italic text-white leading-snug">
                        {SLOGANS.trapId}
                      </p>
                      <p className="mt-0.5 text-[12px] text-slate-200/85 leading-relaxed">
                        {SLOGANS.trapIdSub} {SLOGANS.trapIdShare}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingTrapId(null);
                        changeRoom('trap-id');
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Find mine
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingTruthId(null);
                        changeRoom('hook-loop');
                      }}
                      className="px-3 py-2.5 rounded-2xl border border-white/20 hover:border-white/40 text-slate-100 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Hook Loop
                    </button>
                  </div>
                </motion.div>
              )}

              {firstRitualPending ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#07080c]/80 p-5 md:p-6"
                >
                  <div className="absolute inset-0">
                    <CinematicBackdrop variant="ritual" />
                  </div>
                  <GlowPulse energy={8} color="cyan" className="absolute -right-8 -top-8 w-40 h-40 z-[1]" />
                  <GlowPulse energy={12} color="amber" className="absolute -left-10 bottom-0 w-36 h-36 z-[1]" />
                  <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-cyan-300 border border-cyan-400/50 shrink-0 shadow-[0_0_24px_rgba(34,211,238,0.25)]">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 block tracking-widest uppercase">
                          {currentUser
                            ? `${displayIdentity.atHandle} · proof waiting`
                            : 'Proof of Attention · start here'}
                        </span>
                        <h4 className="font-display text-xl font-extrabold italic text-white mt-1 tracking-tight">
                          {currentUser
                            ? `${displayIdentity.handle}, your first Spark`
                            : 'Your first Spark'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-2 max-w-xl font-sans leading-relaxed">
                          {SLOGANS.firstSpark} {SLOGANS.firstSparkSupport} Then the workspace opens
                          around your Human Passport.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-wider">
                          <span className="px-2 py-1 rounded-md border border-cyan-400/25 bg-cyan-500/10 text-cyan-200">
                            Knowledge
                          </span>
                          <span className="px-2 py-1 rounded-md border border-amber-400/25 bg-amber-500/10 text-amber-100">
                            Creativity
                          </span>
                          <span className="px-2 py-1 rounded-md border border-white/10 bg-white/5 text-slate-300">
                            Contribution
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => changeRoom('lab')}
                      className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black font-mono text-xs rounded-xl tracking-wider transition-all cursor-pointer shrink-0 shadow-[0_0_32px_rgba(34,211,238,0.35)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]"
                    >
                      Start Proof of Attention →
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <ClaimBurst
                    show={!!fuelWin}
                    label={
                      fuelWin
                        ? `IMPACT +${Math.max(0, fuelWin.to - fuelWin.from)} · PROOF ACCEPTED`
                        : ''
                    }
                  />
                  {fuelWin && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative overflow-hidden rounded-2xl border border-emerald-400/45 bg-[#060a08] p-5 md:p-6"
                    >
                      <GlowPulse energy={fuelWin.to} color="emerald" className="absolute -right-6 -top-6 w-44 h-44" />
                      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 block tracking-widest uppercase">
                            Proof accepted — your Impact Score moved
                          </span>
                          <h4 className="font-display text-xl font-extrabold italic text-white mt-1">
                            Attention → energy · live
                          </h4>
                          <div className="mt-3 flex items-end gap-3 font-mono">
                            <span className="text-2xl font-black text-slate-500">{fuelWin.from}%</span>
                            <span className="text-emerald-400/80 text-sm pb-1">→</span>
                            <span className="text-3xl font-black text-emerald-300">{fuelWin.to}%</span>
                          </div>
                          <EnergyFlow energy={fuelWin.to} className="mt-3 h-2.5 max-w-sm" />
                          <p className="text-xs text-slate-400 mt-2.5 max-w-xl font-sans leading-relaxed">
                            That&apos;s Attention Intelligence in one beat. Pick your next move — stay
                            in the loop.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                          {economyStatus?.ready ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setFuelWin(null);
                                  changeRoom('profile');
                                }}
                                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-mono text-xs rounded-xl tracking-wider cursor-pointer shadow-[0_0_28px_rgba(52,211,153,0.35)]"
                              >
                                Mint first rig →
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFuelWin(null);
                                  changeRoom('treasury');
                                }}
                                className="px-6 py-2.5 border border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                              >
                                Claim daily refill
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setFuelWin(null);
                                changeRoom('lab');
                              }}
                              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-mono text-xs rounded-xl tracking-wider cursor-pointer"
                            >
                              Keep going in Academy →
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setFuelWin(null)}
                            className="text-[10px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider cursor-pointer"
                          >
                            Stay on map
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!fuelWin &&
                    economyStatus?.ready &&
                    (showMintMinerCta ||
                      !(state.minerNFTs || []).some((n) =>
                        String(n.id).startsWith('onchain_')
                      )) && (
                    <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/10 via-[#0a0a0c] to-cyan-500/10 p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 block tracking-widest uppercase">
                          Earn → own · 100 CGT
                        </span>
                        <h4 className="text-sm font-semibold font-mono text-slate-100 mt-0.5">
                          Mint your first rig
                        </h4>
                        <p className="text-xs text-slate-400 mt-1.5 max-w-xl font-sans leading-relaxed">
                          Swap BCC → CGT in the Vault if needed, then mint an ownable miner you can
                          list.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => changeRoom('treasury')}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-black font-mono text-xs rounded-xl tracking-wider cursor-pointer"
                        >
                          Vault / swap
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMintMinerCta(false);
                            changeRoom('profile');
                          }}
                          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black font-mono text-xs rounded-xl tracking-wider cursor-pointer"
                        >
                          Mint first rig →
                        </button>
                      </div>
                    </div>
                  )}

                  {!fuelWin && economyStatus?.ready && (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-0.5">
                        Free daily refill (~20h)
                      </span>
                      Free on-chain refill — +15% energy + 50 BCC. Lucky Wheel stays practice.
                    </p>
                    <button
                      type="button"
                      onClick={() => changeRoom('treasury')}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer shrink-0"
                    >
                      Claim today&apos;s Impact →
                    </button>
                  </div>
                  )}

                  {!fuelWin && economyStatus && !economyStatus.ready && !firstRitualPending && (
                    <div className="rounded-xl border border-amber-400/25 bg-amber-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        <span className="font-mono text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
                          Practice mode — stay in the loop
                        </span>
                        On-chain claim waits for settlement. Academy fuel still works — keep going.
                      </p>
                      <button
                        type="button"
                        onClick={() => changeRoom('lab')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer shrink-0"
                      >
                        Continue Academy →
                      </button>
                    </div>
                  )}

                  {navPhase === 'open' && (
                    <AttentionBriefStrip
                      items={attentionBrief}
                      onNavigate={(room) => handleNavNavigate(room as NavDestination)}
                    />
                  )}

                  {!firstRitualPending && state.energy < 40 && (
                    <div className="bg-orange-500/5 border border-orange-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/40 animate-pulse">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-orange-400 block tracking-widest uppercase">
                            Impact Score low
                          </span>
                          <h4 className="text-sm font-semibold font-mono text-slate-200 mt-0.5">
                            Core reserves at {state.energy}%.
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
                            Refuel in the{' '}
                            <span className="text-cyan-400 font-bold font-mono">Attention Academy</span>{' '}
                            — learning becomes energy for your node.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => changeRoom('lab')}
                          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black font-mono text-xs rounded-xl tracking-wider transition-colors cursor-pointer"
                        >
                          GO TO ACADEMY
                        </button>
                        <button
                          type="button"
                          onClick={() => changeRoom('missions')}
                          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-black font-black font-mono text-xs rounded-xl tracking-wider transition-colors cursor-pointer"
                        >
                          DAILY DIRECTIVES
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Living NFT deck — owned rigs or showcase skins */}
              {!firstRitualPending && (
                <DashboardNftDeck
                  state={state}
                  username={currentUser?.username}
                  onOpenGallery={() => changeRoom('gallery')}
                  onOpenReactor={() => changeRoom('reactor')}
                />
              )}

              {/* Sectors — filtered to Academy until First Spark */}
              <div>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-cyan-300/90">
                      Facility map
                    </p>
                    <h3 className="mt-1 font-display text-xl md:text-2xl font-extrabold italic text-white tracking-tight flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-cyan-400" />
                      {firstRitualPending
                        ? 'Your next room · Academy'
                        : currentUser
                          ? `${displayIdentity.atHandle} · rooms`
                          : 'Facility schematic'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    Enter a sector — art wakes as you focus.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.rooms
                    .filter((room) => !firstRitualPending || room.id === 'lab')
                    .map((room, idx) => {
                    const getRoomStatus = () => {
                      if (!room.unlocked) return { text: 'DECRYPTED / LOCKED', color: 'text-slate-500 border-white/5 bg-white/[0.02]' };
                      if (firstRitualPending && room.id === 'lab') {
                        return { text: 'FIRST SPARK READY', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-950/20' };
                      }
                      if (room.id === 'reactor' && state.energy < 40) return { text: 'REACTOR EMERGENCY', color: 'text-orange-400 animate-pulse border-orange-500/40 bg-orange-950/10' };
                      return { text: `LEVEL ${room.level} NOMINAL`, color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/5' };
                    };

                    return (
                      <FacilitySectorCard
                        key={room.id}
                        room={room}
                        sectorIndex={idx}
                        firstRitualPending={firstRitualPending}
                        status={getRoomStatus()}
                        onEnter={() => changeRoom(room.id)}
                        onUpgrade={() => upgradeRoom(room.id)}
                        onUnlock={() => unlockRoom(room.id)}
                      />
                    );
                  })}

                  {!firstRitualPending && (
                    <>
                  {/* NFT Gallery */}
                  <div className="bg-gradient-to-br from-[#0c100a] to-[#080605] border border-amber-500/25 hover:border-amber-400/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300">
                    <div className="absolute inset-0 pointer-events-none opacity-30">
                      <img src={NFT_POSTERS.obsidian} alt="" className="absolute -right-6 -bottom-8 w-40 h-40 object-cover rounded-2xl rotate-6 opacity-60" />
                    </div>
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-amber-500/60">SECTOR_NFT</span>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Images className="w-4 h-4 text-amber-400" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          NFT Rig Gallery
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Collectible posters stay still until knowledge fuel is live — then mining loops kick in on owned rigs.
                      </p>
                    </div>
                    <div className="relative z-10 mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className={`border px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase ${
                        state.energy > 0
                          ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300'
                          : 'border-amber-500/20 bg-amber-950/20 text-amber-400'
                      }`}>
                        {state.energy > 0 ? 'FEEDS LIVE' : 'IDLE ART'}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeRoom('gallery')}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        OPEN GALLERY
                      </button>
                    </div>
                  </div>

                  {/* Daily Missions — always available from map */}
                  <div
                    className="bg-gradient-to-br from-[#0a120e] to-[#050807] border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300"
                  >
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-emerald-500/60">SECTOR_OPS</span>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          Daily Missions & Lucky Wheel
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Spin the daily Lucky Wheel for BCC prizes, then clear practice missions. KPI still needs a real Devnet tx in Ecosystem Vault.
                      </p>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-emerald-950/20 text-emerald-400">
                        WHEEL + MISSIONS
                      </span>
                      <button
                        onClick={() => changeRoom('missions')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        SPIN / ENTER
                      </button>
                    </div>
                  </div>

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

                  {/* 8th Premium Card: Arena / Season — cinematic still */}
                  <div
                    className="border border-amber-500/25 hover:border-amber-400/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300 group"
                  >
                    <img
                      src="/atmosphere/arena-hero.webp"
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.5] group-hover:scale-105 transition-all duration-700"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-amber-950/20" />
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-amber-300/70 z-10">SECTOR_ARENA</span>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-4 h-4 text-amber-300" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          Attention Arena
                        </h4>
                      </div>

                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        Call out handles. AI judges the snap. Season leaderboard — Proof of Attention, not hash spam.
                      </p>
                    </div>

                    <div className="relative z-10 mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-amber-400/30 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-amber-950/40 text-amber-300">
                        AI JUDGE LIVE
                      </span>

                      <button
                        type="button"
                        onClick={() => changeRoom('leaderboard')}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        ENTER ARENA
                      </button>
                    </div>
                  </div>

                  {/* Culture Names — laszlo.culture */}
                  <div className="bg-gradient-to-br from-[#081418] to-[#080605] border border-cyan-500/35 hover:border-cyan-400/55 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300">
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-cyan-500/60">SECTOR_NAME</span>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-cyan-300" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          Culture Names
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Mine a wallet name like laszlo.culture — first come, one per wallet.
                      </p>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-cyan-500/25 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-cyan-950/30 text-cyan-200">
                        .CULTURE
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCultureName(null);
                          changeRoom('culture-name');
                        }}
                        className="px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        MINE NAME
                      </button>
                    </div>
                  </div>

                  {/* Trap ID — viral awareness quiz */}
                  <div className="bg-gradient-to-br from-[#161208] to-[#080605] border border-amber-500/35 hover:border-amber-400/55 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300">
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-amber-500/60">SECTOR_TRAP</span>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Share2 className="w-4 h-4 text-amber-300" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          Scroll Trap ID
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        What’s your bait? Three taps → named trap → challenge a friend to find theirs.
                      </p>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-amber-500/25 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-amber-950/30 text-amber-200">
                        VIRAL · 30 SEC
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingTrapId(null);
                          changeRoom('trap-id');
                        }}
                        className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        FIND MINE
                      </button>
                    </div>
                  </div>

                  {/* Hook Loop — social meme campaign */}
                  <div className="bg-gradient-to-br from-[#16080e] to-[#080508] border border-rose-500/35 hover:border-rose-400/55 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300">
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-rose-500/60">SECTOR_HOOK</span>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Share2 className="w-4 h-4 text-rose-300" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          Hook Loop
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        How they hook you into doomscrolling — fun memes, packed truths. Share one, unlock the next.
                      </p>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-rose-500/25 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-rose-950/30 text-rose-200">
                        SHARE TO UNLOCK
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingTruthId(null);
                          changeRoom('hook-loop');
                        }}
                        className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        OPEN LOOP
                      </button>
                    </div>
                  </div>

                  {/* Field Deck — physical cards */}
                  <div className="bg-gradient-to-br from-[#120c08] to-[#080605] border border-amber-500/30 hover:border-amber-400/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300">
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-amber-500/60">SECTOR_FIELD</span>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Rocket className="w-4 h-4 text-amber-400" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          Field Deck
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Hunt printed Hook Cycle cards in the wild. Scan · claim the chapter · trade the missing beat.
                      </p>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-amber-500/25 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-amber-950/30 text-amber-300">
                        IRL HUNT
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCardCode(null);
                          changeRoom('field-deck');
                        }}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        OPEN DECK
                      </button>
                    </div>
                  </div>

                  {/* The Void — verifiably anonymous */}
                  <div className="bg-gradient-to-br from-[#0c0a14] to-[#050508] border border-violet-500/25 hover:border-violet-400/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[210px] transition-all duration-300">
                    <span className="absolute top-4 right-4 font-mono text-[9px] text-violet-500/60">SECTOR_VOID</span>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <EyeOff className="w-4 h-4 text-violet-300" />
                        <h4 className="font-sans text-sm font-bold text-white tracking-tight">
                          The Void
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Ask what you would never ask with a name. No wallet. No auth. Receipt proves identity was never attached.
                      </p>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
                      <span className="border border-violet-500/25 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase bg-violet-950/30 text-violet-300">
                        ANONYMOUS PROOF
                      </span>
                      <button
                        type="button"
                        onClick={() => changeRoom('void')}
                        className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
                      >
                        ENTER VOID
                      </button>
                    </div>
                  </div>
                    </>
                  )}
                </div>
              </div>
              </>
              )}
              </div>
            </RoomEnter>
          ) : (
            // Room viewport render
            <RoomEnter key={`room-${activeRoom}`} roomKey={`room-${activeRoom}`}>

              {activeRoom === 'reactor' && (
                <MainReactor
                  state={state}
                  setState={setState}
                  addLog={addLog}
                  logs={logs}
                  onOpenTollShop={() => openTollShop('spark_refill')}
                />
              )}
              {activeRoom === 'gallery' && (
                <NftGallery
                  state={state}
                  setState={setState}
                  addLog={addLog}
                  miningLive={state.energy > 0}
                  onOpenReactor={() => changeRoom('reactor')}
                  onOpenProfile={() => changeRoom('profile')}
                />
              )}
              {activeRoom === 'workshop' && <Workshop state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'lab' && (
                <ResearchLab
                  state={state}
                  setState={setState}
                  addLog={addLog}
                  onOpenRoadmap={() => changeRoom('roadmap')}
                  onOpenTollShop={(sku) => openTollShop(sku || 'academy_retake')}
                  onRequestFocus={requestFocus}
                  onOpenVoid={(draft) => {
                    if (draft) {
                      try {
                        localStorage.setItem('culture_void_draft_v1', draft);
                      } catch {
                        // ignore
                      }
                    }
                    changeRoom('void');
                  }}
                  onFirstRitualComplete={(detail) => {
                    setFirstRitualPending(false);
                    setShowMintMinerCta(Boolean(economyStatus?.ready));
                    setFuelWin({
                      from: detail?.from ?? 0,
                      to: detail?.to ?? Math.min(100, state.energy + 18),
                    });
                    setLoopFacilityOpen(false);
                    setZenNote(null);
                    rewardAction('spark');
                    const meta = advanceMetaQuest('first_spark');
                    setMetaView(meta);
                    grantMetaRewards(meta);
                    changeRoom('map');
                    addLog(
                      'Proof accepted — potential is visible. Continue when ready: Zen → awareness → Spread.',
                      'success'
                    );
                  }}
                  onAwarenessSessionComplete={(sessionId) => {
                    if (sessionId !== 'ai_hook_mirror') return;
                    rewardAction('hook_mirror');
                    setLoopFacilityOpen(false);
                    changeRoom('map');
                    addLog(
                      'Awareness sealed — your next beat is Spread. Help someone else grow.',
                      'success'
                    );
                  }}
                  onZenDecision={(decision: LearningDecision) => {
                    setZenNote(
                      decision === 'hold_knowledge'
                        ? 'Mind · knowledge held. Next: name the hook — then Spread.'
                        : 'Machine · attention → fuel. Next: name the hook — then Spread.'
                    );
                    // Never yank mid–First Spark (Machine still needs Neural Snap)
                    if (isFirstRitualPending()) {
                      addLog(
                        decision === 'hold_knowledge'
                          ? 'Zen · Mind. Finish the proof when you’re ready — Home holds the loop.'
                          : 'Zen · Machine. Submit Neural Snap — then Home celebrates fuel.',
                        'system'
                      );
                      return;
                    }
                    setFuelWin(null);
                    setLoopFacilityOpen(false);
                    // Self-executing: Zen → Hook Mirror (if pending) without hunting
                    try {
                      const completed = JSON.parse(
                        localStorage.getItem('kronos_academy_completed') || '[]'
                      ) as string[];
                      const needsHook =
                        completed.includes('ai_first_spark') &&
                        !completed.includes('ai_hook_mirror');
                      if (needsHook) {
                        changeRoom('lab');
                        addLog(
                          'Zen sealed. Hook Mirror is open — name what owns your attention.',
                          'success'
                        );
                        return;
                      }
                    } catch {
                      // fall through to map
                    }
                    changeRoom('map');
                    addLog(
                      decision === 'hold_knowledge'
                        ? 'Zen · Mind. Back on the loop — Spread when you’re ready.'
                        : 'Zen · Machine. Back on the loop — Spread when you’re ready.',
                      'success'
                    );
                  }}
                />
              )}
              {activeRoom === 'roadmap' && (
                <ProductRoadmap onEnterAcademy={() => changeRoom('lab')} />
              )}
              {activeRoom === 'ai' && <AICore state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'missions' && (
                <DailyMissions
                  state={state}
                  setState={setState}
                  addLog={addLog}
                  walletAddress={currentUser?.walletAddress}
                  onNavigate={(room) => changeRoom(room)}
                  onOpenHearing={() => {
                    markHearTouched();
                    setHearTouched(true);
                    if (!hearing.active) hearing.toggle();
                  }}
                />
              )}
              {activeRoom === 'guild' && (
                <GuildHall
                  state={state}
                  setState={setState}
                  addLog={addLog}
                  currentUser={currentUser}
                  onOpenAcademy={() => changeRoom('lab')}
                  onOpenLeaderboard={() => changeRoom('leaderboard')}
                />
              )}
              {activeRoom === 'treasury' && (
                <Treasury
                  state={state}
                  setState={setState}
                  addLog={addLog}
                  onOpenAcademy={() => changeRoom('lab')}
                  tollHighlightSku={tollHighlightSku}
                />
              )}
              {activeRoom === 'profile' && (
                <MemberProfile
                  state={state}
                  setState={setState}
                  addLog={addLog}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onOpenTreasury={(sku) => (sku ? openTollShop(sku) : changeRoom('treasury'))}
                  onRewardBurst={(message) => setRewardBurst(message)}
                />
              )}
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
              {activeRoom === 'void' && <AnonymousChamber addLog={addLog} />}
              {activeRoom === 'field-deck' && (
                <FieldDeckClaim
                  initialCode={pendingCardCode}
                  username={currentUser?.username}
                  walletAddress={currentUser?.walletAddress}
                  addLog={addLog}
                  onOpenAcademy={() => changeRoom('lab')}
                  onOpenMap={() => changeRoom('map')}
                  onClaimReward={({ setComplete }) => {
                    // Story unlock only — codes are public; no soft-currency farm
                    if (setComplete) {
                      playSound('success');
                      setRewardBurst('HOOK CYCLE COMPLETE · OPEN ACADEMY');
                      addLog(
                        'FIELD DECK: Hook Cycle complete — story unlocked. Bring it into Hook Mirror.',
                        'success'
                      );
                    } else {
                      playSound('soft');
                    }
                  }}
                />
              )}
              {activeRoom === 'hook-loop' && (
                <HookLoopCampaign
                  initialTruthId={pendingTruthId}
                  addLog={addLog}
                  onOpenAcademy={() => changeRoom('lab')}
                  onOpenMap={() => changeRoom('map')}
                />
              )}
              {activeRoom === 'trap-id' && (
                <TrapIdRitual
                  challengedTrapId={pendingTrapId}
                  addLog={addLog}
                  onOpenHookLoop={() => {
                    setPendingTruthId(null);
                    changeRoom('hook-loop');
                  }}
                  onOpenAcademy={() => changeRoom('lab')}
                  onOpenMap={() => changeRoom('map')}
                />
              )}
              {activeRoom === 'culture-name' && (
                <CultureNameMine
                  walletAddress={currentUser?.walletAddress ?? null}
                  seedUsername={currentUser?.username}
                  initialName={pendingCultureName}
                  addLog={addLog}
                  onClaimed={(full) => {
                    setCurrentUser((prev) => {
                      if (!prev) return prev;
                      const next = { ...prev, username: full };
                      try {
                        localStorage.setItem(
                          'solana_current_user_session_v1',
                          JSON.stringify(next)
                        );
                      } catch {
                        // ignore
                      }
                      return next;
                    });
                    void api.syncUser(full, currentUser?.walletAddress).catch(() => undefined);
                  }}
                  onOpenMap={() => changeRoom('map')}
                />
              )}
              {activeRoom === 'invite-share' && currentUser?.walletAddress && (
                <InviteSharePanel
                  username={currentUser.username}
                  walletAddress={currentUser.walletAddress}
                  addLog={addLog}
                  onOpenMap={() => changeRoom('map')}
                />
              )}
              {activeRoom === 'passport' && currentUser && (
                <HumanPassportDashboard
                  username={currentUser.username}
                  progressTitle={progressTitle.title}
                  progressBlurb={progressTitle.blurb}
                  avatarUrl={state.profile?.avatarUrl}
                  walletAddress={currentUser.walletAddress}
                  state={state}
                  firstRitualPending={firstRitualPending}
                  academyCompletedCount={academyCompletedCount}
                  coreSessionTotal={CORE_ATTENTION_SESSIONS.length}
                  farcasterUsername={state.profile?.farcasterUsername}
                  onLinkFarcaster={(username) => {
                    setState((prev) => ({
                      ...prev,
                      profile: {
                        ...(prev.profile || {
                          avatarUrl: '',
                          aboutMe: '',
                          xUsername: '',
                          telegramUsername: '',
                          discordUsername: '',
                          farcasterUsername: '',
                          profileCompletedRewardClaimed: false,
                          xFollowClaimed: false,
                          telegramJoinClaimed: false,
                          discordJoinClaimed: false,
                          xPostInteractionClaimed: false,
                        }),
                        farcasterUsername: username,
                      },
                    }));
                  }}
                  nextStep={{
                    label: navNextStep.label,
                    reason: navNextStep.reason,
                    onGo: () => handleNavNavigate(navNextStep.id),
                  }}
                  onOpenPartners={() => changeRoom('partners')}
                  onOpenHearing={() => {
                    markHearTouched();
                    setHearTouched(true);
                    if (!hearing.active) hearing.toggle();
                  }}
                  onOpenStory={openAwarenessStory}
                  onOpenSpark={() => changeRoom('lab')}
                  onOpenReturn={() => advanceLoopBeat()}
                  onSpread={() => runLoopSpreadInvite()}
                />
              )}
              {activeRoom === 'partners' && <PartnerProgram state={state} setState={setState} addLog={addLog} />}
              {activeRoom === 'onboarding' && (
                <OnboardingHub
                  state={state}
                  setState={setState}
                  addLog={addLog}
                  onEnterApp={() => changeRoom('reactor')}
                  onOpenGuild={() => changeRoom('guild')}
                />
              )}
              {(activeRoom === 'legal-privacy' || activeRoom === 'legal-terms' || activeRoom === 'legal-disclaimer') && (
                <LegalPages page={activeRoom as LegalPageId} onBack={() => changeRoom('map')} />
              )}
              {![
                'reactor',
                'gallery',
                'workshop',
                'lab',
                'roadmap',
                'ai',
                'missions',
                'guild',
                'treasury',
                'profile',
                'leaderboard',
                'admin',
                'feedback',
                'void',
                'field-deck',
                'hook-loop',
                'trap-id',
                'culture-name',
                'invite-share',
                'passport',
                'partners',
                'onboarding',
                'legal-privacy',
                'legal-terms',
                'legal-disclaimer',
              ].includes(activeRoom) && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-8 text-center space-y-4">
                  <p className="text-sm text-amber-100 font-semibold">This sector is offline or unknown.</p>
                  <p className="text-xs text-slate-400">Head back to the facility map — every live room is waiting there.</p>
                  <button
                    type="button"
                    onClick={() => changeRoom('map')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Back to overview
                  </button>
                </div>
              )}
            </RoomEnter>
          )}
        </AnimatePresence>

      </main>

      <NavMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeRoom={activeRoom}
        onNavigate={handleNavNavigate}
        phase={navPhase}
        nextStep={navNextStep}
        showAdmin={
          !!(currentUser as { isAdmin?: boolean } | null)?.isAdmin ||
          (typeof window !== 'undefined' && localStorage.getItem('building_culture_admin') === '1')
        }
        onAdmin={() => changeRoom('admin')}
      />

      <MobileBottomNav
        activeRoom={activeRoom}
        phase={navPhase}
        nextStep={navNextStep}
        walletShort={
          loopSanctuary
            ? null
            : currentUser?.walletAddress
              ? `${currentUser.walletAddress.slice(0, 4)}…${currentUser.walletAddress.slice(-4)}`
              : currentUser?.username
                ? displayIdentity.atHandle
                : null
        }
        bccBalance={loopSanctuary || firstRitualPending ? undefined : state.credits}
        energy={loopSanctuary ? undefined : state.energy}
        onNavigate={handleNavNavigate}
        onOpenMore={() => setMenuOpen(true)}
        onNext={() => advanceLoopBeat()}
        onLockedHint={() =>
          addLog('First Spark unlocks that — ~2 min in Academy, just for you.', 'info')
        }
        hidden={focusMode}
      />

      <InstallPrompt />

      <footer
        className={`hidden md:flex border-t border-white/5 bg-[#0a0a0c]/80 py-3 px-5 mx-4 mb-2 rounded-2xl text-slate-500 flex-col gap-2 shadow-lg z-10 relative backdrop-blur-md transition-opacity ${
          focusMode ? 'opacity-25 pointer-events-none' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-[9px] tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span>{firstRitualPending ? 'FIRST SPARK OPEN' : 'NODE ONLINE · DEVNET'}</span>
          </div>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <button
              type="button"
              onClick={() => advanceLoopBeat()}
              className="hover:text-cyan-400 transition-colors cursor-pointer uppercase text-cyan-500/80"
            >
              {navNextStep.label}
            </button>
            <span className="text-white/10">·</span>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer uppercase"
            >
              More
            </button>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-white/[0.04] pt-2 text-[10px] font-sans tracking-normal text-slate-600">
          <button
            type="button"
            onClick={() => changeRoom('legal-privacy')}
            className="hover:text-slate-400 transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => changeRoom('legal-terms')}
            className="hover:text-slate-400 transition-colors cursor-pointer"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => changeRoom('legal-disclaimer')}
            className="hover:text-slate-400 transition-colors cursor-pointer"
          >
            Disclaimer
          </button>
          <span className="text-slate-700">Building Culture · Solana Devnet</span>
        </div>
      </footer>

      {/* Notifications panel — fixed to viewport so mobile isn't clipped by header overflow */}
      <AnimatePresence>
        {showNotificationsDropdown && (
          <React.Fragment key="notifications-overlay">
            <motion.button
              key="notif-backdrop"
              type="button"
              aria-label="Dismiss notifications"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationsDropdown(false)}
              className="fixed inset-0 z-[95] bg-black/50 sm:bg-transparent cursor-default"
            />
            <motion.div
              key="notif-panel"
              ref={notificationsPanelRef}
              role="dialog"
              aria-label="Notifications"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="fixed z-[100] left-3 right-3 top-[max(4.5rem,env(safe-area-inset-top))] sm:left-auto sm:right-4 sm:top-20 sm:w-72 max-h-[min(70dvh,28rem)] flex flex-col bg-[#0a0a0c]/98 border border-white/10 rounded-2xl shadow-2xl p-4 font-mono text-xs space-y-3 backdrop-blur-md"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5 gap-2 shrink-0">
                <span className="font-bold text-slate-200 uppercase tracking-widest text-[9px] flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-cyan-400" /> Notifications
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        notifications: [],
                      }));
                    }}
                    className="text-[8px] text-slate-500 hover:text-red-400 uppercase font-black cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotificationsDropdown(false)}
                    title="Close"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto overscroll-contain divide-y divide-white/[0.03] min-h-0">
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
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-bold block">{noti.title}</span>
                        <p className="text-slate-400 mt-0.5 leading-relaxed text-[9px]">{noti.message}</p>
                        <span className="text-[8px] text-slate-600 mt-1 flex justify-between items-center gap-2">
                          <span>{noti.timestamp}</span>
                          {noti.relatedId && <span className="text-[7px] text-cyan-400 font-bold uppercase tracking-widest shrink-0">View details &rarr;</span>}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      <RewardToastHost />

      <ClaimBurst
        show={!!rewardBurst}
        label={rewardBurst || ''}
        onDone={() => setRewardBurst(null)}
      />

      <AnimatePresence>
        {flowToast && (
          <motion.div
            key={flowToast.id}
            role="status"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => setFlowToast(null)}
            className={`fixed top-[max(5rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[90] max-w-lg w-[calc(100%-1.5rem)] px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl pointer-events-auto cursor-pointer ${
              flowToast.tone === 'warn'
                ? 'bg-amber-950/95 border-amber-400/40 text-amber-100'
                : flowToast.tone === 'success'
                  ? 'bg-emerald-950/95 border-emerald-400/40 text-emerald-100'
                  : 'bg-[#0a0a0c]/95 border-white/15 text-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <p className="text-[11px] font-sans leading-relaxed flex-1">{flowToast.message}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlowToast(null);
                }}
                aria-label="Dismiss"
                className="opacity-60 hover:opacity-100 cursor-pointer shrink-0 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle 'System State Saved' Toast Notification */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 bg-[#07070a]/95 border border-emerald-500/20 backdrop-blur-md px-4 py-3 rounded-xl shadow-[0_10px_30px_-5px_rgba(16,185,129,0.1)] pointer-events-none"
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

      <AwarenessStoryOverlay
        open={showAwarenessStory}
        onClose={() => {
          setShowAwarenessStory(false);
          addLog('STORY: Closed — prove attention when ready.', 'info');
        }}
        onFinish={finishAwarenessStory}
        finishLabel={
          firstRitualPending ? 'Begin your first Spark' : 'Prove attention again'
        }
      />

      <AttentionShareModal
        open={showAttentionShare}
        task={attentionShareTask}
        onClose={() => {
          setShowAttentionShare(false);
        }}
        onCompleted={(task) => {
          addLog(
            `ATTENTION SPREAD: ${task.title} — reputation compounds when you lift others.`,
            'success'
          );
        }}
      />

      <AttentionMetricsPanel
        open={showMetricsPanel}
        onClose={() => setShowMetricsPanel(false)}
        onCopyLog={(message) => addLog(message, 'success')}
      />

      <HearingModeShell />

    </div>
    </HearingModeContext.Provider>
  );
}
