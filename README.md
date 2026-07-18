<div align="center">

# Building Culture
### The Human Economy

**Human Value = Contribution.**  
Reputation you own — proven by attention, not farmed by hours.

[Live Node](https://mining.buildingcultureid.space/) · [Docs](./docs/README.md) · [Community](./docs/COMMUNITY.md) · [Farcaster](./docs/FARCASTER_GROWTH.md)

`Claim Passport → Prove Attention → Spread → Connections grow`

</div>

---

## What this is

**Building Culture** is the company.  
**Human Economy** is the product.  
**Human Passport** is your identity.  
**Culture Node** is the workspace after you claim.  
**Proof of Attention** is the ritual that makes reputation real.

We are not a mining farm, token casino, or attention trap.  
Blockchain is ownership infrastructure — quiet, honest, mostly Devnet practice until settlement is ready.

| Surface | Job |
| --- | --- |
| Human Passport | Own a portable reputation record |
| Proof of Attention | Short Academy sessions that move fuel |
| Hearing Mode | Ears-first guide — neural Gemini voice (Sulafat) |
| Growth Loop | Discover → Claim → Spark → Spread → Return — counted on the server |
| Outer Circuit | Hidden meta-quest above daily missions (glitch whisper) |
| Farcaster Mini App | Discovery + cast embeds on Warpcast |

---

## Live

**https://mining.buildingcultureid.space/**

```bash
# Health
curl -fsS https://mining.buildingcultureid.space/api/health

# Growth network pulse
curl -fsS https://mining.buildingcultureid.space/api/growth/pulse

# Hearing neural voice status
curl -fsS https://mining.buildingcultureid.space/api/hearing/voice
```

---

## The loop (memorize this)

```
Discover  →  Claim Passport  →  First Spark  →  Spread invite  →  They return
                 ↘ Hearing Mode (ears-first) ↙
```

Everything else (Guild, NFT gallery, facility rooms) is optional after this loop runs weekly.

Invites use `?invite=XXXXXX` (first 6 chars of your wallet).  
Connections are counted when someone you invited claims — see [docs/GROWTH_LOOP.md](./docs/GROWTH_LOOP.md).

---

## Quick start

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env   # fill GEMINI_API_KEY, WALLET_JWT_SECRET, etc.
npm run dev            # Express + Vite → http://localhost:3033 (or PORT)
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local server + Vite middleware |
| `npm run build` | Client + bundled `dist/server.cjs` |
| `npm start` | Production server |
| `npm run lint` | Typecheck |
| `./scripts/deploy-mining-vps.sh` | Sync → VPS → build → restart |

Env notes live in [`.env.example`](./.env.example). Hearing Mode needs `GEMINI_API_KEY` (or `GENERATIVE_AI_API_KEY`).

---

## Product map

```
Landing / Mini App
    │
    ├─ Human Passport claim
    │     └─ Invite cast · TG / Discord
    │
    ├─ Culture Node (facility)
    │     ├─ Attention Academy · First Spark · Zen
    │     ├─ Hearing Mode (neural TTS)
    │     ├─ Growth Loop panel (connections)
    │     ├─ Outer Circuit whisper (glitch)
    │     ├─ Hook Loop campaign
    │     └─ Vault · Workshop · Guild · Gallery
    │
    └─ Growth ledger  POST /api/growth/event
```

---

## Docs

Start at **[docs/README.md](./docs/README.md)** — full index.

| Doc | Audience |
| --- | --- |
| [HUMAN_ECONOMY.md](./docs/HUMAN_ECONOMY.md) | Positioning & loop |
| [BRAND_STRATEGY.md](./docs/BRAND_STRATEGY.md) | Voice, hierarchy, banned words |
| [COMMUNITY.md](./docs/COMMUNITY.md) | Weekly ritual + invites |
| [GROWTH_LOOP.md](./docs/GROWTH_LOOP.md) | Connections ledger & APIs |
| [ATTENTION_UX.md](./docs/ATTENTION_UX.md) | Badges, grabbers, Outer Circuit glitch |
| [HEARING_MODE.md](./docs/HEARING_MODE.md) | Neural voice guide |
| [FARCASTER_GROWTH.md](./docs/FARCASTER_GROWTH.md) | Mini App + cast rain |
| [ANGEL_DILIGENCE.md](./docs/ANGEL_DILIGENCE.md) | Pre-seed conviction checklist |
| [SOLANA_ECONOMY.md](./docs/SOLANA_ECONOMY.md) | Devnet settlement |
| [SECURITY_NOTES.md](./docs/SECURITY_NOTES.md) | Auth & secrets |

---

## Stack

React 19 · Vite 6 · Express · Tailwind 4 · Motion · Solana web3.js · Gemini (TTS + coach) · Farcaster Mini App SDK · Postgres (optional profiles / void)

---

## Deploy

```bash
./scripts/deploy-mining-vps.sh
# SSH host: mining-vps  →  /opt/culture-node  →  culture-node.service
```

Preserves remote `.env`. Excludes `data/growth-network.json` and TTS cache so live ledgers survive deploys.

---

## Brand rules (short)

1. Lead with **Human Economy / Passport** — not tokens or mining.  
2. Free core stays free — First Spark + Hearing never behind a paywall.  
3. Measure Spreads → return — vanity MAU without return is noise.  
4. One weekly ritual beats ten new rooms.

---

<div align="center">

**Building Culture** · Human Economy  
*Own your digital reputation.*

</div>
