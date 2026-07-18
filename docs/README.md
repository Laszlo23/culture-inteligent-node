# Building Culture — Documentation

**Live:** https://mining.buildingcultureid.space/  
**Company:** Building Culture · **Product:** Human Economy · **Identity:** Human Passport

This folder is the source of truth. The root [README](../README.md) is the front door; everything deeper lives here.

---

## Start here

| If you want… | Read |
| --- | --- |
| What we are building | [HUMAN_ECONOMY.md](./HUMAN_ECONOMY.md) |
| Voice, colors, banned words | [BRAND_STRATEGY.md](./BRAND_STRATEGY.md) |
| This week’s community play | [COMMUNITY.md](./COMMUNITY.md) |
| Discord + Telegram Attention Miner bots | [ATTENTION_MINER_BOTS.md](./ATTENTION_MINER_BOTS.md) |
| How connections are counted | [GROWTH_LOOP.md](./GROWTH_LOOP.md) |
| Attention UI (badges + glitch) | [ATTENTION_UX.md](./ATTENTION_UX.md) |
| Neural Hearing guide | [HEARING_MODE.md](./HEARING_MODE.md) |
| Farcaster Mini App growth | [FARCASTER_GROWTH.md](./FARCASTER_GROWTH.md) |
| Google AI / Cloud credits grant pack | [GOOGLE_AI_GRANT.md](./GOOGLE_AI_GRANT.md) |
| Human Reputation Engine (first 5 min) | [HUMAN_ECONOMY.md](./HUMAN_ECONOMY.md) |
| Angel / diligence lens | [ANGEL_DILIGENCE.md](./ANGEL_DILIGENCE.md) |
| Investor one-pager style | [INVESTOR_PARTNER_BRIEF.md](./INVESTOR_PARTNER_BRIEF.md) |
| Investor numbers (ask / scenarios / burn) | [INVESTOR_NUMBERS.md](./INVESTOR_NUMBERS.md) |
| Funding momentum (14-day raise + voice thesis) | [FUNDING_MOMENTUM.md](./FUNDING_MOMENTUM.md) |
| Google AI / Gemini credits pack | [GOOGLE_AI_GRANT.md](./GOOGLE_AI_GRANT.md) |
| Angel pitch deck (live HTML) | [`../pitch/index.html`](../pitch/index.html) |
| Press blurbs | [PRESS_KIT.md](./PRESS_KIT.md) |

---

## Product & campaigns

| Doc | Topic |
| --- | --- |
| [HOOK_LOOP_CAMPAIGN.md](./HOOK_LOOP_CAMPAIGN.md) | Cast-to-unlock truth deck |
| [FIELD_DECK.md](./FIELD_DECK.md) | Field deck claim cards |
| [PARTNER_ATTENTION_SESSION.md](./PARTNER_ATTENTION_SESSION.md) | B2B Attention Session offer |
| [SOULBOUND_REPUTATION.md](./SOULBOUND_REPUTATION.md) | Soulbound / reputation notes |

---

## Protocol & infra

| Doc | Topic |
| --- | --- |
| [SOLANA_ECONOMY.md](./SOLANA_ECONOMY.md) | BCC / CGT Devnet economy |
| [ARCIUM_POA.md](./ARCIUM_POA.md) | Confidential Proof of Attention threshold |
| [SECURITY_NOTES.md](./SECURITY_NOTES.md) | JWT, secrets, fail-closed admin |
| [APP_STORE.md](./APP_STORE.md) | Store / listing overview |
| [store/](./store/) | Phantom portal · Solana dApp Store · listing copy |

---

## The operating loop

```
Discover → Claim Passport → First Spark → Spread → They return
              ↘ Hearing Mode (neural voice) ↙
```

- **Growth Loop panel** — Home + Passport; live connection counts  
- **Outer Circuit** — hidden meta-quest (glitch whisper) after real attention  
- **Farcaster** — Mini App embeds + cast rain  

Measure Spreads → returns. Vanity opens without return is noise.

---

## API quick refs

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Liveness |
| `GET /api/growth/pulse` | Network-wide growth totals |
| `GET /api/growth/stats?code=` | Per-invite-code connections |
| `POST /api/growth/event` | Ingest land / claim / spark / spread |
| `GET /api/hearing/voice` | Neural TTS readiness |
| `POST /api/hearing/speak` | Synthesize warm WAV |
| `GET /.well-known/farcaster.json` | Mini App manifest |

Full growth semantics: [GROWTH_LOOP.md](./GROWTH_LOOP.md).  
Hearing details: [HEARING_MODE.md](./HEARING_MODE.md).

---

## Deploy

```bash
./scripts/deploy-mining-vps.sh
```

SSH host `mining-vps` → `/opt/culture-node` → `culture-node.service`.  
Preserves remote `.env` and growth ledger (`data/growth-network.json`).
