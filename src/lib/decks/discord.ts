import type { DeckSlide } from './types';

/** Where to go in Discord — InteractiveDeck for full hub. */
export const DISCORD_DECK: DeckSlide[] = [
  {
    id: 'welcome',
    eyebrow: 'Discord · 01',
    title: 'Start in #welcome',
    body: 'One server for every house. Join HQ first — then pick your channel.',
    mood: 'opening',
    ctaLabel: 'Join Discord HQ',
  },
  {
    id: 'hearing',
    eyebrow: 'Discord · 02',
    title: 'Weekly Hearing ritual',
    body: 'Ears-first sessions live in Discord. Same Culture Node loop — settle fuel in the app.',
    mood: 'spark',
  },
  {
    id: 'houses',
    eyebrow: 'Discord · 03',
    title: 'Faction houses',
    body: 'Apex Summit houses meet in Discord threads. Enlist in-app, then open your house channel.',
    mood: 'evolution',
  },
  {
    id: 'bots',
    eyebrow: 'Discord · 04',
    title: 'Mine with /spark',
    body: 'Chat bots: /spark · /claim · /hear. Telegram stays the light daily pulse.',
    mood: 'facility',
    ctaLabel: 'Open Discord',
  },
];
