/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModuleType = 'gpu' | 'memory' | 'accelerator' | 'battery' | 'cooler' | 'dock' | 'chip';

export interface HardwareModule {
  id: string;
  name: string;
  type: ModuleType;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  bonusPower: number; // in PH/s
  bonusEfficiency: number; // multiplier add
  cost: number; // credits to buy
  description: string;
  installed: boolean;
  unlocked: boolean;
}

export type WorkerRole = 'Research' | 'Builder' | 'Teacher' | 'Trader' | 'Community' | 'Security' | 'Analyst';

export interface AIWorker {
  id: string;
  name: string;
  role: WorkerRole;
  rarity: 'Common' | 'Epic' | 'Legendary';
  powerBonus: number; // PH/s
  efficiencyBoost: number; // % multiplier
  unlocked: boolean;
  level: number;
  cost: number;
  description: string;
  status: 'IDLE' | 'ACTIVE' | 'UPGRADING';
}

export interface DailyMission {
  id: string;
  label: string;
  completed: boolean;
  energyReward: number;
  powerReward: number; // PH/s
  category: 'video' | 'article' | 'community' | 'quest' | 'build';
}

export interface FacilityRoom {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  costToUnlock: number;
  costToUpgrade: number;
  description: string;
  perk: string;
}

export interface Guild {
  id: string;
  name: string;
  region: string;
  members: number;
  output: number; // EH/s
  bonus: string;
  selected: boolean;
}

export interface InspectionLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'system';
}

export interface MemberProfile {
  avatarUrl: string;
  aboutMe: string;
  xUsername: string;
  telegramUsername: string;
  discordUsername: string;
  profileCompletedRewardClaimed: boolean;
  xFollowClaimed: boolean;
  telegramJoinClaimed: boolean;
  discordJoinClaimed: boolean;
  xPostInteractionClaimed: boolean;
}

export interface MinerNFT {
  id: string;
  name: string;
  image: string; // Dynamic SVG description index or string URL
  hashrate: number; // PH/s output addition
  level: number;
  maxLevel: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  isListed: boolean;
  listingPrice: number; // in COGNITIVE tokens
  upgradeCost: number; // in COGNITIVE tokens
  mintAddress: string; // Simulated devnet address
  owner: string; // 'Me' or 'Market' / 'Other Address'
  description: string;
}

export interface ProofOfAttention {
  id: string;
  walletAddress: string;
  activity: string;
  duration: number;
  verification: string;
  rewardEnergy: number;
  rewardBcc: number;
  timestamp: string;
  minted: boolean;
  sessionId?: string;
  score?: number;
  signature?: string;
  attestPending?: boolean;
  /** Arcium confidential threshold metadata (no raw artifacts). */
  arciumPassed?: boolean;
  arciumScoreBand?: 0 | 1 | 2 | 3;
  arciumMode?: 'circuit-mirror' | 'onchain';
  arciumComputationOffset?: string;
  arciumTxSignature?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warn' | 'message';
  relatedId?: string;
  relatedType?: 'message' | 'ticket';
}

export interface InternalMessage {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface FeedbackTicket {
  id: string;
  user: string;
  type: 'Bug' | 'Feature' | 'Feedback';
  subject: string;
  message: string;
  timestamp: string;
  status: 'Open' | 'Resolved';
  reply?: string;
}

export interface PartnerNode {
  id: string;
  name: string;
  logo: string;
  bonus: string;
  bccRequired: number;
  active: boolean;
  description: string;
}

export interface GameState {
  credits: number; // Will represent our core $BCC tokens
  miningPower: number; // Total combined output in PH/s
  energy: number; // 0 - 100
  efficiency: number; // multiplier (e.g. 1.0)
  facilityLevel: number;
  currentSeason: string;
  hardware: HardwareModule[];
  workers: AIWorker[];
  rooms: FacilityRoom[];
  guilds: Guild[];
  dailyMissions: DailyMission[];
  lastMaintenanceDate: string;
  ecosystemRewards: number; // generated passively
  accumulatedRewards: number; // waiting to be claimed
  profile?: MemberProfile;
  cognitiveTokens: number; // Our own SPL-like custom token
  minerNFTs: MinerNFT[]; // Custom list of user-owned and listed tradeable NFTs
  bccTokens?: number; // Building Culture Coin $BCC
  lastWheelSpinTime?: string; // Timestamp of the last wheel spin (once every 24h)
  notifications?: AppNotification[];
  messages?: InternalMessage[];
  feedback?: FeedbackTicket[];
  partners?: PartnerNode[];

  /** Primary KPI proof: confirmed Devnet contribution tx */
  kpiProof?: {
    signature: string;
    walletAddress: string;
    confirmedAt: string;
    amountSol: number;
    creditsAwarded: number;
    energyAwarded: number;
  };
  
  // Living Miner NFT & Personality Extensions
  nodeArchetype?: 'Researcher' | 'Creator' | 'Builder' | 'Environmentalist' | 'AI Explorer';
  nodeName?: string;
  nodeLevel?: number;
  nodePersonality?: 'Scholar AI' | 'Rogue Agent' | 'Zen Master' | 'Industrial Matrix';
  nodeExperience?: number; // XP points
  activeSkin?: string;
  unlockedSkins?: string[];
  proofOfAttentions?: ProofOfAttention[];
  pomodoroActive?: boolean;
  pomodoroTimeLeft?: number;
  sharedInsights?: string[];
  unlockedCompanionUpgrades?: string[];
}
