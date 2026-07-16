# Agentic Engineering Grant Application

**Project name:** Building Culture  
**One-liner:** Gamified Solana facility where operators prove contributions on Devnet, then unlock AI-powered mining rewards.  
**Grant ask:** $200 USDG — cover one month of top-tier AI coding tools (Cursor / Claude / Codex Pro) to finish and ship the Solana MVP.  
**Repo:** https://github.com/Laszlo23/culture-inteligent-node  
**AI Studio prototype:** https://ai.studio/apps/bb08afb5-c9dc-4ae1-b138-765d370189e3  

> **Earn paste blocks:** see `05-earn-paste-block.md`  
> **Tranche 2 demo script:** see `06-tranche2-demo-script.md`

---

## What I want to build (shippable scope)

Building Culture is already a working product shell: React facility UI, Firebase auth, Postgres persistence (Drizzle), Gemini-backed flows, and a **live Solana Devnet portal** (`src/components/SolanaPortal.tsx`) that:

- Connects Phantom / Solflare **or** generates a sandboxed local keypair
- Requests Devnet SOL airdrops via `connection.requestAirdrop`
- Signs and sends real Devnet transfers (`SystemProgram.transfer`)
- Links explorer txs on Solscan (`?cluster=devnet`)
- Persists wallet address onto the user profile (`users.wallet_address` in Postgres)

**With this grant I will ship a public MVP that:**

1. Hardens Solana onboarding into a first-class Operator Wallet path (extension + local fallback).
2. Turns facility contributions into **on-chain attested actions** (Devnet first): contribution txs tied to operator UID.
3. Adds a clear “Solana Operator” loop in the product UI: connect → faucet → contribute → see confirmed signature → claim facility credit.
4. Publishes a live demo URL + public GitHub + short loom of the wallet → tx → claim path.

This is intentionally narrow: one working Solana product loop, not a vague “AI x crypto” deck.

---

## Why Solana

The facility metaphor needs a real settlement layer for contributions. Solana gives:

- Fast confirmation for in-session “contribute SOL / prove action” loops
- Cheap experimentation on Devnet while the game loop is taught
- A natural upgrade path later (SPL credits, NFT bot workers) without changing the UX metaphor

The codebase already depends on `@solana/web3.js` and Devnet RPC — this grant funds finishing the last mile to a **demoable, shareable Solana product**.

---

## How I use AI coding tools (agentic engineering)

I already build with agentic sessions (Cursor / Claude / Codex-style workflows):

1. **Prompt → inspect → evidence** — agents read the repo, cite files/commits, and refuse to invent architecture that isn’t there.
2. **Parallel tasking** — backend sync, Solana portal, auth middleware, and grant packaging as separate agent scopes.
3. **Ship-oriented loops** — every session ends with concrete files, commit-ready diffs, or submission artifacts (this Drive package is one such artifact).

**$200 USDG use of funds**

| Item | Est. |
|------|------|
| Cursor Ultra / Claude Pro / Codex Pro (1 month) | ~$200 |
| **Total** | **$200** |

Receipts for the subscription(s) totaling ~$200 will be uploaded for Tranche 2, per listing rules.

---

## Milestones

### Tranche 1 (now → approval + first 50%)

- [x] Working codebase with Solana Devnet portal, auth, Postgres
- [x] This application + session evidence package
- [ ] Earn profile + KYC after approval

### Tranche 2 (second 50% — after ship)

- [ ] Public live MVP URL
- [ ] GitHub link (public, or private shared with `abhwshek@gmail.com`)
- [ ] Coding subscription receipt(s) totaling $200
- [ ] Short demo of: wallet connect → Devnet tx → facility credit update

**Avg response time on listing:** ~1 week. Payments: KYC approved Mon → paid by Fri.

---

## Team

Solo builder — Laszlo (repo owner `Laszlo23`).  
Contact for listing questions: support@superteam.fun (listing POC).

---

## Drive link (paste on Earn)

> **Replace this line with your Google Drive folder URL after uploading this package.**
