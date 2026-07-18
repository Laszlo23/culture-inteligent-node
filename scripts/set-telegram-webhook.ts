/**
 * Point Telegram at /api/bots/telegram
 *
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
 *   APP_URL=https://mining.buildingcultureid.space \
 *   npx tsx scripts/set-telegram-webhook.ts
 */

import 'dotenv/config';
import { setTelegramWebhook } from '../src/lib/bots/telegram-webhook.ts';

async function main() {
  const token = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const secret = String(process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  const base = String(process.env.APP_URL || 'https://mining.buildingcultureid.space')
    .replace(/\/?$/, '/');
  if (!token || !secret) {
    console.error('Need TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET');
    process.exit(1);
  }
  const url = `${base}api/bots/telegram`;
  const ok = await setTelegramWebhook({ token, url, secret });
  if (!ok) {
    console.error('setWebhook failed');
    process.exit(1);
  }
  console.log('Webhook set →', url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
