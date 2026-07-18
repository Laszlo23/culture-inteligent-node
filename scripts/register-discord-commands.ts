/**
 * Register Attention Miner slash commands with Discord.
 *
 *   DISCORD_BOT_TOKEN=... DISCORD_APPLICATION_ID=... npx tsx scripts/register-discord-commands.ts
 *
 * Optional guild-scoped (instant): DISCORD_GUILD_ID=...
 */

import 'dotenv/config';
import { DISCORD_MINER_COMMANDS } from '../src/lib/bots/discord-webhook.ts';

async function main() {
  const token = String(process.env.DISCORD_BOT_TOKEN || '').trim();
  const appId = String(process.env.DISCORD_APPLICATION_ID || '').trim();
  const guildId = String(process.env.DISCORD_GUILD_ID || '').trim();

  if (!token || !appId) {
    console.error('Need DISCORD_BOT_TOKEN and DISCORD_APPLICATION_ID');
    process.exit(1);
  }

  const url = guildId
    ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${appId}/commands`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(DISCORD_MINER_COMMANDS),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error('Register failed', res.status, body);
    process.exit(1);
  }
  console.log(
    guildId
      ? `Guild commands registered on ${guildId}`
      : 'Global commands registered (may take up to 1h to appear)'
  );
  console.log(body.slice(0, 500));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
