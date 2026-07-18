# Attention Miner — Discord + Telegram bots

**One loop everywhere:** knowledge snaps in chat → deep link into Culture Node for Hearing, Passport, Vault fuel.

Chat awards **knowledge points** (practice ledger). On-chain `claim_daily` / First Spark still settle in the web app.

```
/spark  → knowledge quiz (A/B/C)
/claim  → daily drip (~20h) + Vault link
/hear   → Hearing Mode
/passport → Human Passport
/invite → Spread loop
/discord → Discord HQ
/status → miner card
```

---

## Endpoints

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/api/bots/discord` | Discord Interactions (Ed25519 verified) |
| `POST` | `/api/bots/telegram` | Telegram webhook |
| `GET` | `/api/bots/status` | `{ discord, telegram }` configured flags |

Ledger file: `data/attention-miner.json` (gitignored with other `data/`).

Code: `src/lib/bots/*`

---

## Discord setup

1. [Discord Developer Portal](https://discord.com/developers/applications) → New Application → Bot  
2. Copy **Public Key** → `DISCORD_PUBLIC_KEY`  
3. Copy **Application ID** → `DISCORD_APPLICATION_ID`  
4. Bot token → `DISCORD_BOT_TOKEN` (register script only; not required on the web server for interactions)  
5. Interactions Endpoint URL: `https://mining.buildingcultureid.space/api/bots/discord`  
6. Register commands:

```bash
DISCORD_BOT_TOKEN=... DISCORD_APPLICATION_ID=... DISCORD_GUILD_ID=... \
  npx tsx scripts/register-discord-commands.ts
```

Omit `DISCORD_GUILD_ID` for global commands (slower to propagate).

7. Invite bot with `applications.commands` scope into your Discord HQ.

---

## Telegram setup

1. Talk to [@BotFather](https://t.me/BotFather) → `/newbot` → token → `TELEGRAM_BOT_TOKEN`  
2. Set a random secret → `TELEGRAM_WEBHOOK_SECRET`  
3. Point webhook:

```bash
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"https://mining.buildingcultureid.space/api/bots/telegram\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\",\"allowed_updates\":[\"message\",\"callback_query\"]}"
```

4. In the group or DM: `/start` then `/spark`.

Pin in Telegram: Hearing link + “Try `/spark` for a knowledge snap.”

---

## Env

```bash
DISCORD_PUBLIC_KEY=""
DISCORD_APPLICATION_ID=""
DISCORD_BOT_TOKEN=""          # register script
DISCORD_GUILD_ID=""           # optional instant guild commands
TELEGRAM_BOT_TOKEN=""
TELEGRAM_WEBHOOK_SECRET=""
APP_URL="https://mining.buildingcultureid.space"
```

---

## Brand voice

- Name: **Attention Miner** (chat surface)  
- Copy: knowledge / Proof of Attention — not farm / yield / airdrop  
- Free core stays free; bot points are practice until Vault settlement  

Related: [COMMUNITY.md](./COMMUNITY.md) · [GROWTH_LOOP.md](./GROWTH_LOOP.md) · Discord hub `src/lib/discord-community.ts`
