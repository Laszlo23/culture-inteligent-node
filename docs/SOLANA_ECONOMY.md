# Culture Economy (Solana Devnet)

Phase 1 on-chain facility ledger for Building Culture / Culture Node.

## Program

| Item | Value |
|------|--------|
| Workspace | [`culture-economy/`](../culture-economy/) |
| Program ID | `AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ` |
| Framework | Anchor 0.30.1 |

### Accounts

- **Config** PDA `[b"config"]` — authority, BCC/CGT mints, swap rate, miner counter, `marketplace_fee_bps` (default 250), `fee_treasury`
- **Attention Toll** (off-chain USDC): see `/api/toll/*` — 1¢ micropayments to `VITE_TOLL_TREASURY` (Spark Refill, Academy Retake, List Slot, packs). Redeploy + re-bootstrap after Config LEN change.
- **Player** PDA `[b"player", wallet]` — `energy_bps` (0–10000), `mining_power`, `streak`, `last_daily_ts`
- **MinerAsset** PDA `[b"miner", asset_id_le]` — skin/hashrate/level/rarity/owner (PDA NFT; Metaplex Core collection is a later upgrade)
- **Listing** PDA `[b"listing", miner]` — CGT price escrow metadata

### Instructions

| Ix | Who signs | Purpose |
|----|-----------|---------|
| `initialize_config` | authority | One-time setup |
| `init_player` | wallet | Create Player PDA |
| `grant_energy` | authority + wallet fee payer | Academy/KPI fuel (server co-signs) |
| `mint_bcc` / `mint_cgt` | authority | Reward mints |
| `swap_bcc_to_cgt` | wallet | Burn BCC → mint CGT |
| `claim_daily` | wallet | Streak + energy + BCC (20h cooldown) |
| `mint_miner` | wallet | Burn 100 CGT → MinerAsset |
| `list_miner` / `cancel_list` / `buy_miner` | wallet | Marketplace (`buy_miner` takes `marketplace_fee_bps`, default 2.5%, to `fee_treasury` CGT ATA) |
| `drain_energy` | wallet | Reactor sync — reduce Player PDA fuel |

## Bootstrap

```bash
# Fund authority (~3 SOL for program rent). CLI airdrop is often rate-limited;
# PoW: devnet-pow mine -d 3 --reward 0.02 --no-infer -t 3500000000

# One-shot (uses prebuilt .so + solana program deploy):
./scripts/devnet-go-live.sh

# Or manual:
# 1. Build & deploy
cd culture-economy && anchor build --no-idl
solana program deploy target/deploy/culture_economy.so \
  --program-id target/deploy/culture_economy-keypair.json --url devnet
# 2. Create mints + initialize config
cd .. && npx tsx scripts/devnet-bootstrap.ts
# 3. Merge culture-economy/bootstrap-env.txt into root .env, restart server
```

Required env (see [`.env.example`](../.env.example)):

- `VITE_ECONOMY_PROGRAM_ID`
- `VITE_BCC_MINT` / `VITE_CGT_MINT` — must be present at **`npm run build`** so the client bundle matches the server
- `ECONOMY_AUTHORITY_SECRET` (server-only, base64 keypair — **never** `VITE_`-prefix)

### Authority backup (live insurance)

1. After bootstrap, copy `culture-economy/bootstrap-env.txt` into an offline password manager / encrypted vault.
2. Do not commit `.env`, `bootstrap-env.txt`, or keypair JSON.
3. Rotate by redeploying config only if you intentionally change authority (current program binds config authority at `initialize_config`).
4. Verify: `npx tsx scripts/check-economy-env.ts`

### Live host checklist

1. Set runtime env on the host (mints + `ECONOMY_AUTHORITY_SECRET` + strong `WALLET_JWT_SECRET`).
2. Rebuild with the same `VITE_BCC_MINT` / `VITE_CGT_MINT`.
3. Probe:
   - `GET /api/health` → `ok: true`
   - `GET /api/ready` → `ready: true` (503 if misconfigured)
   - `GET /api/economy/status` → `ready: true`, empty `reasons`
4. Smoke First Spark → Solscan `grant_energy`.
5. Prefer Postgres (`SQL_*`) for Academy/KPI proofs across restarts; in-memory store is lost on redeploy.

**Live probe (2026-07-18):** `https://mining.buildingcultureid.space/api/economy/status` (and `/api/health`, `/api/ready`) still return the SPA HTML shell — the host has not been rebuilt with economy env + new routes. Local Devnet (`localhost:3040`) reports `ready: true`. Push host env + redeploy before calling production settlement live.

Reward constants live in [`src/lib/economy-rewards.ts`](../src/lib/economy-rewards.ts) (aligned with the program). 2-year projection: `npx tsx scripts/economy-2yr-model.ts` + canvas `economy-2yr-projection`.

## App wiring

| Surface | Behavior |
|---------|----------|
| Login | `init_player` + hydrate energy/BCC/CGT from chain |
| Academy pass | `POST /api/economy/grant-energy` → wallet sends partial tx |
| KPI verify | Server may attach `economyTx` reward mint |
| Treasury swap / daily | `swap_bcc_to_cgt` / `claim_daily` |
| Profile mint | `mint_miner` |
| Gallery buy | `buy_miner` when asset id is on-chain |

If mints are **not** configured, the app shows a **loud economy banner** and blocks fake settlement for mint/list/buy/`claim_daily`. Academy may still credit **local practice** fuel with an explicit warn log. When economy **is** ready, Academy `grant_energy` failures do **not** silently apply local fuel.

Win-win loop: First Spark → `grant_energy` → swap BCC→CGT → `mint_miner` → `list_miner` / `buy_miner`. Sole free drip: `claim_daily` (20h program cooldown). Lucky Wheel / practice yield buffer stay off-chain.

## API

- `GET /api/health` — liveness
- `GET /api/ready` — settlement readiness (503 if env misconfigured)
- `GET /api/economy/status`
- `POST /api/economy/grant-energy` (wallet JWT) — requires prior Academy/KPI proof
- `POST /api/economy/reward` (wallet JWT) — capped mint helper

## Still client-side (Phase 2)

Rooms, hardware, AI workers, guild wars, Lucky Wheel RNG, live Arcium MXE, mainnet.

## Smoke checklist

1. Deploy program + run bootstrap  
2. Login with Devnet wallet → see `ECONOMY SYNC` log  
3. Complete Academy → Solscan `grant_energy`  
4. Treasury swap BCC→CGT  
5. Mint miner (100 CGT) → list → buy from second wallet  
6. Confirm Legal disclaimer lists economy as on-chain when configured  
