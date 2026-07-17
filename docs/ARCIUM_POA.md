# Gemini coach vs Arcium verifier

Culture Node splits **attention quality** into two roles:

| Role | System | What it does | What it does *not* do |
|------|--------|--------------|------------------------|
| **Verifier** | Arcium MXE `verify_attention_threshold` | Confidential pass/fail + score band from encrypted `quiz_score` + `artifact_len_bucket` | Read raw journal/artifacts; generate coaching copy; mint SPL |
| **Coach** | Gemini (via `/api/attention/verify`) | Narrative verification text / mentor copy | Sole authority for energy/BCC grants |

## Flow (Phase 1)

```
Neural Snap quiz → Arcium threshold (pass required)
                 → optional Gemini coach (copy only)
                 → markEnergySurge + PoA metadata
                 → optional Devnet memo attest (public demo; no artifacts on chain)
```

- **Energy grant path unchanged:** `markEnergySurge()` still runs when the session is granted — gated on Arcium `passed`, not on Gemini.
- **Artifacts never go on-chain.** Devnet memo stays `poa:sessionId:score`. Arcium only sees encrypted score + length bucket.
- **Circuit source of truth:** `culture-poa/encrypted-ixs/src/lib.rs`
- **App mirror (until MXE RPC is wired):** `src/lib/arcium-poa.ts` — same policy as the Arcis circuit; UI chip shows `Confidential verify (Arcium)`.

## Local prove

```bash
cd culture-poa
export PATH="$(pwd)/bin:$PATH"   # forces Anchor --validator legacy
arcium build
arcium test                      # Docker required; needs free 172.20.0.0/16 for Arx compose
```

Circuit-mirror unit tests (no Docker):

```bash
npm run test:arcium-mirror
```

## Env

See root `.env.example`:

- `GEMINI_API_KEY` — coach only
- `VITE_ARCIUM_RPC` — optional; reserved for future on-chain MXE invoke from the wallet client

## Non-goals (Phase 1)

- No guild wars / seasons / SPL BCC mint
- No moving Gemini into Arcium circuits
- No mainnet deploy until localnet tests are green
