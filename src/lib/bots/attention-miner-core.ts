/**
 * Attention Miner — shared command core for Discord + Telegram.
 * Chat = knowledge snaps + daily drip. Wallet settlement stays on the web app.
 */

import { BRAND, SLOGANS } from '../brand-slogans';
import { COMMUNITY_LINKS } from '../community-invite';
import { DISCORD_INVITE_URL } from '../discord-community';
import { winningDeepLinks } from '../winning-flows';
import { KNOWLEDGE_DECK, pickKnowledgeCard } from './knowledge-deck';
import {
  claimDailyMiner,
  clearPending,
  getMinerPlayer,
  gradeSparkAnswer,
  MINER_REWARDS,
  setPendingSpark,
  type BotPlatform,
  type MinerPlayer,
} from './miner-ledger';

export type BotCommand =
  | 'help'
  | 'start'
  | 'spark'
  | 'answer'
  | 'claim'
  | 'status'
  | 'hear'
  | 'passport'
  | 'invite'
  | 'discord'
  | 'partner'
  | 'unknown';

export type BotReply = {
  text: string;
  /** Discord button / Telegram inline options for answers */
  choices?: Array<{ label: string; value: string }>;
  linkButtons?: Array<{ label: string; url: string }>;
};

export type BotContext = {
  platform: BotPlatform;
  userId: string;
  displayName?: string;
  /** Raw text after command, or answer letter */
  arg?: string;
};

function appUrl(): string {
  const base = (process.env.APP_URL || BRAND.url || COMMUNITY_LINKS.live).replace(
    /\/?$/,
    '/'
  );
  return base;
}

function deep(path: string): string {
  return `${appUrl()}${path.replace(/^\//, '')}`;
}

function statusLines(p: MinerPlayer): string {
  return [
    `Knowledge points · ${p.knowledgePoints}`,
    `Sparks · ${p.sparks} (✓${p.correct} / ✗${p.wrong})`,
    `Streak · ${p.streak}`,
  ].join('\n');
}

export function parseBotCommand(raw: string): { cmd: BotCommand; arg?: string } {
  const text = raw.trim();
  if (!text) return { cmd: 'help' };
  const lower = text.toLowerCase();

  // Answer shortcuts: A / B / C or 1 / 2 / 3
  if (/^[abc]$/i.test(text.trim())) {
    return { cmd: 'answer', arg: text.trim().toUpperCase() };
  }
  if (/^[123]$/.test(text.trim())) {
    const map: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C' };
    return { cmd: 'answer', arg: map[text.trim()] };
  }

  const cleaned = lower
    .replace(/^\/+/, '')
    .replace(/@[\w_]+/g, '')
    .trim();
  const [head, ...rest] = cleaned.split(/\s+/);
  const arg = rest.join(' ').trim() || undefined;

  switch (head) {
    case 'start':
    case 'help':
    case 'menu':
    case 'miner':
      return { cmd: head === 'start' ? 'start' : 'help' };
    case 'spark':
    case 'mine':
    case 'knowledge':
    case 'quiz':
    case 'learn':
      return { cmd: 'spark' };
    case 'answer':
    case 'a':
    case 'b':
    case 'c':
      if (head === 'answer') return { cmd: 'answer', arg: arg?.toUpperCase() };
      return { cmd: 'answer', arg: head.toUpperCase() };
    case 'claim':
    case 'daily':
    case 'refill':
      return { cmd: 'claim' };
    case 'status':
    case 'stats':
    case 'me':
      return { cmd: 'status' };
    case 'hear':
    case 'hearing':
      return { cmd: 'hear' };
    case 'passport':
    case 'pass':
      return { cmd: 'passport' };
    case 'invite':
    case 'spread':
      return { cmd: 'invite' };
    case 'discord':
    case 'hq':
      return { cmd: 'discord' };
    case 'partner':
    case 'pilot':
    case 'business':
      return { cmd: 'partner' };
    default:
      return { cmd: 'unknown', arg: text };
  }
}

export async function handleBotCommand(ctx: BotContext & { cmd: BotCommand }): Promise<BotReply> {
  const { platform, userId, displayName, cmd, arg } = ctx;

  switch (cmd) {
    case 'start':
    case 'help':
      return {
        text: [
          `**${BRAND.parent} · Attention Miner**`,
          SLOGANS.zen,
          '',
          'Chat mining = knowledge snaps. Wallet fuel settles in the app.',
          '',
          'Commands:',
          '• `/spark` — Proof of Attention knowledge snap',
          '• `/claim` — daily knowledge drip (~20h)',
          '• `/status` — your miner card',
          '• `/hear` — Hearing Mode (ears first)',
          '• `/passport` — claim Human Passport',
          '• `/invite` — spread the loop',
          '• `/partner` — Attention Session pilot (first $)',
          '• `/discord` — community HQ + faction houses',
          '',
          `Reply A / B / C after a spark. Correct = +${MINER_REWARDS.sparkCorrectPoints} knowledge.`,
        ].join('\n'),
        linkButtons: winningDeepLinks(appUrl()).slice(0, 3),
      };

    case 'spark': {
      const card = pickKnowledgeCard(`${platform}:${userId}:${Date.now()}`);
      const pending = await setPendingSpark(
        platform,
        userId,
        card.id,
        card.options,
        displayName
      );
      if (pending.cooldownSec) {
        return {
          text: `Ease up — next spark in ~${pending.cooldownSec}s. Try \`/status\` or \`/hear\`.`,
        };
      }
      return {
        text: [
          '**Knowledge spark** — prove attention',
          '',
          card.prompt,
          '',
          `A) ${card.options[0]}`,
          `B) ${card.options[1]}`,
          `C) ${card.options[2]}`,
          '',
          'Reply **A**, **B**, or **C**.',
        ].join('\n'),
        choices: [
          { label: 'A', value: `answer:A:${card.id}` },
          { label: 'B', value: `answer:B:${card.id}` },
          { label: 'C', value: `answer:C:${card.id}` },
        ],
      };
    }

    case 'answer': {
      const player = await getMinerPlayer(platform, userId);
      if (!player.pendingCardId || !player.pendingOptions) {
        return {
          text: 'No spark waiting. Run `/spark` for a knowledge snap.',
        };
      }
      const letter = (arg || '').trim().toUpperCase().slice(0, 1);
      const idx = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : -1;
      if (idx < 0) {
        return { text: 'Reply with A, B, or C.' };
      }
      const card = KNOWLEDGE_DECK.find((c) => c.id === player.pendingCardId);
      if (!card) {
        await clearPending(platform, userId);
        return { text: 'That spark expired. Run `/spark` again.' };
      }
      const correct = idx === card.correctIdx;
      const next = await gradeSparkAnswer(platform, userId, card.id, correct);
      if (!next) {
        return { text: 'That spark expired. Run `/spark` again.' };
      }
      return {
        text: [
          correct
            ? `✓ Correct · +${MINER_REWARDS.sparkCorrectPoints} knowledge`
            : '✗ Not quite — knowledge still lands.',
          '',
          card.reveal,
          '',
          statusLines(next),
          '',
          correct
            ? 'Win beat: settle fuel in Academy, then Spread an invite.'
            : 'Try another `/spark`, or open Hearing Mode.',
        ].join('\n'),
        linkButtons: [
          { label: 'Academy · settle fuel', url: deep('?room=lab') },
          { label: 'Spread · passport', url: deep('?room=passport') },
          { label: 'Partner pilot', url: deep('?room=partners') },
        ],
      };
    }

    case 'claim': {
      const result = await claimDailyMiner(platform, userId, displayName);
      if (!result.ok) {
        const hoursLeft = 'hoursLeft' in result ? result.hoursLeft : 0;
        return {
          text: [
            `Daily drip cooling down · ~${hoursLeft.toFixed(1)}h left.`,
            '',
            statusLines(result.player),
            '',
            'On-chain claim_daily (when settlement is live) is in the Vault:',
            deep('?room=treasury'),
          ].join('\n'),
          linkButtons: [{ label: 'Open Vault', url: deep('?room=treasury') }],
        };
      }
      return {
        text: [
          `Daily knowledge drip · +${result.gained} points`,
          SLOGANS.proof,
          '',
          statusLines(result.player),
          '',
          'Win beat: Vault claim (free) → Spark → Spread. Partners: /partner',
        ].join('\n'),
        linkButtons: [
          { label: 'Claim in Vault', url: deep('?room=treasury') },
          { label: 'Academy spark', url: deep('?room=lab') },
          { label: 'Partner pilot', url: deep('?room=partners') },
        ],
      };
    }

    case 'status': {
      const player = await getMinerPlayer(platform, userId);
      if (displayName) player.displayName = displayName;
      return {
        text: [
          `**Attention Miner · ${displayName || userId}**`,
          statusLines(player),
          player.pendingCardId ? '\nOpen spark — reply A / B / C.' : '',
          '',
          `Platform · ${platform}`,
        ]
          .filter(Boolean)
          .join('\n'),
        linkButtons: [{ label: 'Open app', url: appUrl() }],
      };
    }

    case 'hear':
      return {
        text: [
          '**Hearing Mode** — ears-first Proof of Attention.',
          'Open the link, say Help or Academy.',
          COMMUNITY_LINKS.hearing,
        ].join('\n'),
        linkButtons: [{ label: 'Enter Hearing', url: COMMUNITY_LINKS.hearing }],
      };

    case 'passport':
      return {
        text: [
          `**${BRAND.passport}**`,
          SLOGANS.ownership,
          COMMUNITY_LINKS.passport,
        ].join('\n'),
        linkButtons: [{ label: 'Claim Passport', url: COMMUNITY_LINKS.passport }],
      };

    case 'invite':
      return {
        text: [
          '**Spread the loop**',
          SLOGANS.spread,
          '',
          'Open the app → copy your invite (first 6 of wallet).',
          'Growth ledger: Land → Claim → Spark → Spread → Return.',
          appUrl(),
        ].join('\n'),
        linkButtons: [
          { label: 'Open + invite', url: deep('?room=passport') },
          { label: 'Hook Loop', url: COMMUNITY_LINKS.hookLoop },
        ],
      };

    case 'discord':
      return {
        text: [
          '**Discord HQ** — community home for all houses.',
          'Welcome · Hearing ritual · Faction houses · Partners',
          DISCORD_INVITE_URL,
        ].join('\n'),
        linkButtons: [{ label: 'Join Discord', url: DISCORD_INVITE_URL }],
      };

    case 'partner':
      return {
        text: [
          '**Partner Attention Session** — first real dollar path',
          'We ship your insight as a session: learn → Zen → Proof of Attention → Spread.',
          'Pilot week: $0–$1.5k or trade. Free core stays free.',
          '',
          deep('?room=partners'),
        ].join('\n'),
        linkButtons: [
          { label: 'Open Partner Program', url: deep('?room=partners') },
          { label: 'One-pager (site)', url: appUrl() },
        ],
      };

    case 'unknown':
      return {
        text: `Didn’t catch that. Try \`/help\` or \`/spark\`.\n${arg ? `(heard: ${arg.slice(0, 80)})` : ''}`,
      };

    default: {
      const _exhaustive: never = cmd;
      void _exhaustive;
      return { text: 'Try `/help`.' };
    }
  }
}

/** Parse Discord button custom_id `answer:A:k_attention` */
export function parseAnswerPayload(raw: string): { letter: string; cardId?: string } | null {
  const m = /^answer:([ABC])(?::([\w_]+))?$/i.exec(raw.trim());
  if (!m) return null;
  return { letter: m[1]!.toUpperCase(), cardId: m[2] };
}
