# Session Evidence — Agentic Engineering Evaluation

**Prompt used (exact listing instruction):**  
`help me apply for the agentic engineering grant by Superteam`

**What this session did (not a pitch deck — engineering work):**

1. Located the live grant listing and parsed `__NEXT_DATA__` for rules, cheque size, and evaluation question.
2. Inspected the local Solana product repo end-to-end (commits, stack, Solana portal, DB schema, server).
3. Produced this Drive-ready application package grounded in real file paths and commit hashes.

---

## Grant facts extracted from listing (verified)

| Field | Value |
|-------|--------|
| Title | Agentic Engineering Grants |
| Slug | `agentic-engineering` |
| URL | https://superteam.fun/earn/grants/agentic-engineering/ |
| Cheque | **$200 USDG** (min=max=200) |
| Payout | 50% upfront post-KYC, 50% after ship |
| Region | Global |
| Status | OPEN |
| Recipients so far | 240 |
| Approved so far | ~$48k |
| Avg response | 1 Week |
| Evaluation question | Upload Drive link of response files from this exact prompt in a Claude/Codex / solana.new-style agentic session |

**Hypothesis (from listing):** Ideas → Prompt → Prod. Fund a month of high-tier AI coding tools so builders ship a working Solana product.

---

## Repo evidence (this machine / this project)

### Commits

| Hash | Message | Impact |
|------|---------|--------|
| `4ab76f9` | Initial commit | Scaffold |
| `ee5bb22` | feat: initialize cyber-mining facility application | ~7k LOC UI: reactor, missions, lab, AI workers, treasury |
| `65ade06` | feat: integrate backend architecture and core features | +7.7k / −288 — Express+Vite server, Firebase auth, Drizzle/Postgres, **SolanaPortal**, admin/feedback |

### Stack verified in `package.json`

- Frontend: React 19, Vite 6, Tailwind 4, Motion
- Backend: Express, Firebase Admin, Drizzle ORM, `pg`
- AI: `@google/genai`
- Chain: `@solana/web3.js` `^1.98.4`

### Solana surface area (`src/components/SolanaPortal.tsx`)

Concrete capabilities already in code:

- `DEVNET_RPC = https://api.devnet.solana.com`
- Wallet modes: browser extension **or** local `Keypair` persisted in `localStorage`
- `requestAirdrop` for +1.0 Devnet SOL
- `SystemProgram.transfer` of 0.05 SOL to a destination pubkey
- Tx history + Solscan deep links (`cluster=devnet`)

### Persistence (`src/db/schema.ts`)

```ts
users.walletAddress  // text — operator Solana address synced via /api/auth/sync
```

Auth middleware + Express routes in `server.ts` sync Firebase UID ↔ Postgres user including wallet.

### Product framing (`metadata.json`)

> “An advanced AI-powered cyber-mining facility where users fuel their rigs through verified real-world attention, learning, and contributions.”

---

## Why this session qualifies as “agentic engineering”

| Signal | Evidence |
|--------|----------|
| Tool use against live sources | Parsed Superteam Earn page JSON; inspected git history and source files |
| Grounded claims | File paths + commit hashes above (no invented architecture) |
| Artifact production | This multi-file Drive package ready for Earn upload |
| Ship bias | Scope narrowed to one Solana operator loop for Tranche 2 |

---

## What will change with the $200 tool grant

Not “buy tokens” — buy **agent runtime** to finish:

1. Polish SolanaPortal UX into the default onboarding path  
2. Wire contribution signatures into facility credit / mission completion  
3. Deploy a stable demo host + record a 60–90s ship video  
4. Package Tranche 2 evidence (URL + repo + subscription receipts)

See `03-ship-plan.md` for the week-by-week plan.
