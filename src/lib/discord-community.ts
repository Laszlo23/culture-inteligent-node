/**
 * Discord = community home for Building Culture.
 * Onboarding Hub, Guild Hall (faction houses), and profile join CTAs
 * all read from this single source of truth.
 */

import { COMMUNITY_LINKS } from './community-invite';
import type { Guild } from '../types';

export const DISCORD_INVITE_URL = COMMUNITY_LINKS.discord;

/** Server-facing channels — join via invite; names match Discord HQ. */
export type DiscordChannel = {
  id: string;
  name: string;
  job: string;
  /** Deep link when known; otherwise invite lands in #welcome */
  href: string;
};

export type DiscordFactionHouse = {
  guildId: string;
  name: string;
  region: string;
  /** Discord role / house label */
  role: string;
  channel: string;
  bonus: string;
  membersHint: number;
  outputHint: number;
  href: string;
  blurb: string;
};

export const DISCORD_CHANNELS: DiscordChannel[] = [
  {
    id: 'welcome',
    name: '#welcome',
    job: 'Passport + Hearing Mode — first door',
    href: DISCORD_INVITE_URL,
  },
  {
    id: 'hearing',
    name: '#hearing-ritual',
    job: 'Weekly Community Hearing · say Help',
    href: DISCORD_INVITE_URL,
  },
  {
    id: 'builders',
    name: '#builders',
    job: 'Ship notes, feedback, office hours',
    href: DISCORD_INVITE_URL,
  },
  {
    id: 'apex',
    name: '#apex-summit',
    job: 'Monthly chamber · faction houses',
    href: DISCORD_INVITE_URL,
  },
  {
    id: 'partners',
    name: '#partners',
    job: 'Attention Sessions · community pilots',
    href: DISCORD_INVITE_URL,
  },
];

/**
 * Faction houses live in Discord — in-app guild enlist mirrors the house.
 * Keep guildId stable with App INITIAL_GUILDS / GameState.guilds.
 */
export const DISCORD_FACTION_HOUSES: DiscordFactionHouse[] = [
  {
    guildId: 'guild_builders',
    name: 'Web3 Builders',
    region: 'Global',
    role: 'House · Builders',
    channel: '#house-builders',
    bonus: '+10% Construction Speed Boost',
    membersHint: 2420,
    outputHint: 6.8,
    href: DISCORD_INVITE_URL,
    blurb: 'Ship together. Proof of Attention over hash spam.',
  },
  {
    guildId: 'guild_developers',
    name: 'Rust Core Developers',
    region: 'Europe',
    role: 'House · Rust Core',
    channel: '#house-rust',
    bonus: '+10% Protocol Deserialization Boost',
    membersHint: 1980,
    outputHint: 6.2,
    href: DISCORD_INVITE_URL,
    blurb: 'Protocol depth. Solana + Rust builders.',
  },
  {
    guildId: 'guild_analysts',
    name: 'Quant Researchers',
    region: 'America',
    role: 'House · Quant',
    channel: '#house-quant',
    bonus: '+10% Data Pipeline Yield',
    membersHint: 1450,
    outputHint: 5.5,
    href: DISCORD_INVITE_URL,
    blurb: 'Signals, research, attention metrics.',
  },
];

/** Seed GameState.guilds from Discord houses (selected = first by default). */
export function guildsFromDiscordHouses(selectedId = 'guild_builders'): Guild[] {
  return DISCORD_FACTION_HOUSES.map((h) => ({
    id: h.guildId,
    name: h.name,
    region: h.region,
    members: h.membersHint,
    output: h.outputHint,
    bonus: h.bonus,
    selected: h.guildId === selectedId,
  }));
}

export function factionHouseByGuildId(guildId: string): DiscordFactionHouse | undefined {
  return DISCORD_FACTION_HOUSES.find((h) => h.guildId === guildId);
}

export function openDiscord(href: string = DISCORD_INVITE_URL): void {
  if (typeof window === 'undefined') return;
  window.open(href, '_blank', 'noopener,noreferrer');
}
