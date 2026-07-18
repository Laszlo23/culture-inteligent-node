/**
 * Discord Interactions endpoint — Attention Miner slash commands + buttons.
 * Verify Ed25519 with DISCORD_PUBLIC_KEY (tweetnacl).
 */

import nacl from 'tweetnacl';
import {
  handleBotCommand,
  parseAnswerPayload,
  parseBotCommand,
  type BotReply,
} from './attention-miner-core';

type DiscordInteraction = {
  type: number;
  id?: string;
  token?: string;
  data?: {
    name?: string;
    options?: Array<{ name: string; type: number; value?: string | number }>;
    custom_id?: string;
  };
  member?: { user?: { id: string; username?: string; global_name?: string } };
  user?: { id: string; username?: string; global_name?: string };
};

const PING = 1;
const APP_COMMAND = 2;
const MESSAGE_COMPONENT = 3;
const CHANNEL_MESSAGE = 4;
const DEFERRED = 5;

function hexToUint8Array(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function verifyDiscordSignature(opts: {
  publicKey: string;
  signature: string;
  timestamp: string;
  rawBody: string;
}): boolean {
  try {
    const key = hexToUint8Array(opts.publicKey);
    const sig = hexToUint8Array(opts.signature);
    const msg = new TextEncoder().encode(opts.timestamp + opts.rawBody);
    return nacl.sign.detached.verify(msg, sig, key);
  } catch {
    return false;
  }
}

function replyToDiscord(reply: BotReply): Record<string, unknown> {
  const components: unknown[] = [];
  if (reply.choices?.length) {
    components.push({
      type: 1,
      components: reply.choices.map((c) => ({
        type: 2,
        style: 1,
        label: c.label,
        custom_id: c.value.slice(0, 100),
      })),
    });
  }
  if (reply.linkButtons?.length) {
    components.push({
      type: 1,
      components: reply.linkButtons.slice(0, 5).map((b) => ({
        type: 2,
        style: 5,
        label: b.label.slice(0, 80),
        url: b.url,
      })),
    });
  }
  return {
    type: CHANNEL_MESSAGE,
    data: {
      content: reply.text.slice(0, 2000),
      flags: 0,
      components: components.length ? components : undefined,
    },
  };
}

function actor(interaction: DiscordInteraction): {
  userId: string;
  displayName: string;
} {
  const u = interaction.member?.user || interaction.user;
  const userId = u?.id || 'unknown';
  const displayName = u?.global_name || u?.username || userId;
  return { userId, displayName };
}

export async function handleDiscordInteraction(
  interaction: DiscordInteraction
): Promise<Record<string, unknown>> {
  if (interaction.type === PING) {
    return { type: 1 };
  }

  const { userId, displayName } = actor(interaction);

  if (interaction.type === MESSAGE_COMPONENT) {
    const custom = interaction.data?.custom_id || '';
    const parsed = parseAnswerPayload(custom);
    if (parsed) {
      const reply = await handleBotCommand({
        platform: 'discord',
        userId,
        displayName,
        cmd: 'answer',
        arg: parsed.letter,
      });
      return replyToDiscord(reply);
    }
    return replyToDiscord({ text: 'Unknown button. Try `/spark`.' });
  }

  if (interaction.type === APP_COMMAND) {
    const name = (interaction.data?.name || 'help').toLowerCase();
    const optAnswer = interaction.data?.options?.find((o) => o.name === 'choice');
    let raw = name;
    if (name === 'answer' && optAnswer?.value != null) {
      raw = `answer ${String(optAnswer.value)}`;
    } else if (name === 'mine') {
      raw = 'spark';
    }
    const { cmd, arg } = parseBotCommand(raw);
    const reply = await handleBotCommand({
      platform: 'discord',
      userId,
      displayName,
      cmd,
      arg,
    });
    return replyToDiscord(reply);
  }

  // Acknowledge unknowns so Discord doesn't retry forever
  return {
    type: DEFERRED,
    data: { flags: 64 },
  };
}

/** Slash command definitions for registration script */
export const DISCORD_MINER_COMMANDS = [
  {
    name: 'spark',
    description: 'Attention Miner — knowledge snap (Proof of Attention)',
    type: 1,
  },
  {
    name: 'mine',
    description: 'Alias for /spark — mine knowledge, not empty hashes',
    type: 1,
  },
  {
    name: 'claim',
    description: 'Daily knowledge drip (~20h) + Vault deep link',
    type: 1,
  },
  {
    name: 'status',
    description: 'Your Attention Miner card',
    type: 1,
  },
  {
    name: 'hear',
    description: 'Open Hearing Mode (ears-first)',
    type: 1,
  },
  {
    name: 'passport',
    description: 'Claim Human Passport',
    type: 1,
  },
  {
    name: 'invite',
    description: 'Spread the growth loop',
    type: 1,
  },
  {
    name: 'partner',
    description: 'Partner Attention Session pilot — first $ path',
    type: 1,
  },
  {
    name: 'discord',
    description: 'Discord HQ — houses & community',
    type: 1,
  },
  {
    name: 'help',
    description: 'Attention Miner commands',
    type: 1,
  },
] as const;
