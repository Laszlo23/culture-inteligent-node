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

export interface GameState {
  credits: number;
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
}
