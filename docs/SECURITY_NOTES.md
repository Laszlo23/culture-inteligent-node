# Security notes — Culture Node (Devnet)

Practical controls for wallet sessions, economy mints, and browser storage.

## Must-set in production

| Env | Why |
|-----|-----|
| `WALLET_JWT_SECRET` | Server **refuses to boot** without it in `NODE_ENV=production` |
| `CURRICULUM_ADMIN_WALLETS` | Empty = no curriculum admin (fail-closed) |
| `ZKPASSPORT_DEV_MODE=0` | Disable mock uniqueness when going live |
| Never set `ALLOW_DEMO_UNSIGNED` / `DEV_OPEN_ADMIN` | Local jury / lab only |

## Hardened (2026-07)

- JWT verify uses `timingSafeEqual`
- `demoUnsigned` login requires `ALLOW_DEMO_UNSIGNED=1` **and** non-production
- Login consumes **server challenge only** (client message override ignored)
- `grant-energy` BCC capped (≤500); energy BPS ≤5000
- `/api/economy/reward` tighter caps; `bootstrap` reason blocked in production
- Curriculum admin empty allowlist fails closed unless `DEV_OPEN_ADMIN=1`
- Client reuses JWT only if `wallet` claim matches current address
- Logout clears `solana_local_secret` + wallet JWT
- Field Deck claims unlock **story only** (no soft BCC/energy farm)

## Still true (honest Devnet limits)

- Local demo wallets still keep a key in `localStorage` while signed in — treat as play money; prefer Phantom for anything you care about
- Social CLAIM in Profile is not API-verified
- Field Deck QR codes are public story keys, not secrets

## Operator wipe

Logout clears session secret + JWT. Full facility state remains under `building_culture_state_*` until the user clears site data.
