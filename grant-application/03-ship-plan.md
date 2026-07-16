# Ship Plan — Tranche 2 MVP (2–3 weeks)

**Definition of done:** A stranger can open the live URL, connect a Solana wallet (or local Devnet keypair), complete one on-chain contribution, and see it reflected in the Building Culture facility UI — with GitHub + subscription receipts ready for the second tranche form.

---

## Week 1 — Harden the Solana operator loop

- Stabilize `SolanaPortal` error states (RPC failures, rejected signatures, airdrop rate limits).
- Ensure `/api/auth/sync` always persists `walletAddress` after connect.
- Add a single “Prove contribution” mission that requires a confirmed Devnet signature before awarding facility energy/credits.
- Manual QA checklist: Phantom, Solflare, local keypair.

## Week 2 — Productize + deploy

- Deploy public demo (Cloud Run / Railway / Fly — whatever hosts cleanly with the existing Express+Vite `server.ts`).
- Env: Gemini key, Firebase, Postgres, App URL.
- Record loom: connect → airdrop → transfer → facility update.
- README: one-command local run + Devnet disclaimer.

## Week 3 — Tranche 2 package

- Confirm subscription receipt(s) sum to ~$200 USD.
- Submit tranche form on the same listing with:
  - Live project URL
  - GitHub repo (public **or** private shared with `abhwshek@gmail.com`)
  - Receipt upload(s)

---

## Explicit non-goals (kept out of scope)

- Mainnet token launch / liquidity
- Full NFT mint marketplace for AI workers
- Multi-chain bridges

These can come later. This grant funds **shipping the Solana loop that already exists in code**.

---

## Risk → mitigation

| Risk | Mitigation |
|------|------------|
| Devnet faucet flaky | Document local keypair + alternate RPC; cache last good airdrop |
| Demo host downtime | Keep `npm run build && npm start` reproducible; pin Node version |
| Scope creep | Only one on-chain action type for Tranche 2 |
