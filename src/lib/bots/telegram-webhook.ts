/**
 * Telegram Bot API webhook — Attention Miner.
 * Set webhook to POST /api/bots/telegram with secret token header.
 */

import {
  handleBotCommand,
  parseBotCommand,
  type BotReply,
} from './attention-miner-core';

type TgUser = { id: number; username?: string; first_name?: string };
type TgChat = { id: number; type: string };
type TgMessage = {
  message_id: number;
  text?: string;
  from?: TgUser;
  chat: TgChat;
};
type TgCallback = {
  id: string;
  from: TgUser;
  data?: string;
  message?: TgMessage;
};
type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallback;
};

function displayName(u?: TgUser): string {
  if (!u) return 'miner';
  return u.username || u.first_name || String(u.id);
}

async function tgApi(
  token: string,
  method: string,
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    console.error('[telegram.api]', method, res.status, t.slice(0, 200));
  }
}

function inlineKeyboard(reply: BotReply): Record<string, unknown> | undefined {
  const rows: Array<Array<Record<string, string>>> = [];
  if (reply.choices?.length) {
    rows.push(
      reply.choices.map((c) => ({
        text: c.label,
        callback_data: c.value.slice(0, 64),
      }))
    );
  }
  if (reply.linkButtons?.length) {
    for (const b of reply.linkButtons.slice(0, 3)) {
      rows.push([{ text: b.label.slice(0, 64), url: b.url }]);
    }
  }
  if (!rows.length) return undefined;
  return { inline_keyboard: rows };
}

async function sendReply(
  token: string,
  chatId: number,
  reply: BotReply
): Promise<void> {
  await tgApi(token, 'sendMessage', {
    chat_id: chatId,
    text: reply.text.replace(/\*\*/g, ''),
    disable_web_page_preview: false,
    reply_markup: inlineKeyboard(reply),
  });
}

export async function handleTelegramUpdate(
  update: TgUpdate,
  botToken: string
): Promise<{ ok: true }> {
  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data || '';
    const chatId = cb.message?.chat.id;
    if (!chatId) return { ok: true };

    const resolved = data.startsWith('answer:')
      ? await handleBotCommand({
          platform: 'telegram',
          userId: String(cb.from.id),
          displayName: displayName(cb.from),
          cmd: 'answer',
          arg: (data.split(':')[1] || 'A').toUpperCase(),
        })
      : await handleBotCommand({
          platform: 'telegram',
          userId: String(cb.from.id),
          displayName: displayName(cb.from),
          ...parseBotCommand(data),
        });

    await tgApi(botToken, 'answerCallbackQuery', { callback_query_id: cb.id });
    await sendReply(botToken, chatId, resolved);
    return { ok: true };
  }

  const msg = update.message;
  if (!msg?.text || !msg.from) return { ok: true };

  const { cmd, arg } = parseBotCommand(msg.text);
  const reply = await handleBotCommand({
    platform: 'telegram',
    userId: String(msg.from.id),
    displayName: displayName(msg.from),
    cmd,
    arg,
  });
  await sendReply(botToken, msg.chat.id, reply);
  return { ok: true };
}

export async function setTelegramWebhook(opts: {
  token: string;
  url: string;
  secret: string;
}): Promise<boolean> {
  const res = await fetch(`https://api.telegram.org/bot${opts.token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: opts.url,
      secret_token: opts.secret,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: false,
    }),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
  return Boolean(data?.ok);
}
