# OKX Agentic Wallet — integration path

Culture Node is Solana-native today (Phantom + local Devnet keypair). This doc maps the next **smart wallet** connect path onto [OKX Agentic Wallet / Onchain OS](https://web3.okx.com) without changing the app’s JWT, passport, or KPI proof contracts.

## What the app needs from a wallet

| App flow | Capability | Today | OKX target |
|----------|------------|-------|------------|
| Auth / API session | `signMessage` → challenge JWT | Phantom / local | OKX account sign |
| Human Passport claim | `signMessage` ownership message | Same | Same via adapter |
| KPI / PoA memos | Sign + send Solana tx | Phantom / local | OKX Solana send (+ Gas Station optional) |
| Session identity | Stable base58 address | `walletAddress` | Same field |

Signing is already funneled through [`src/lib/wallet/adapter.ts`](../src/lib/wallet/adapter.ts) (`signMessageForSession`). Provider id `okx` is reserved; it currently throws until a real provider is wired.

## Adapter scaffold (shipped)

- Types: [`src/lib/wallet/types.ts`](../src/lib/wallet/types.ts) — `WalletProviderId = 'phantom' | 'local' | 'okx'`
- Session may still store legacy `extension` (= Phantom)
- Auth UI shows a disabled **OKX Wallet — soon** affordance

## Recommended next implementation steps

1. **Connect CTA** in `AuthPortal` — call OKX login / wallet status (per Onchain OS `wallet` skill flows: sign-in, OTP/API-key as required). Persist `{ walletType: 'okx', walletAddress }` in `solana_current_user_session_v1`.
2. **Provider bridge** in `adapter.ts` — implement `signMessageForSession` for `okx` using the OKX/Onchain OS message-sign path. Prefer returning raw signature bytes the same way Phantom does so `ensureWalletApiSession` and `claimHumanPassport` stay unchanged.
3. **Solana send** — for KPI / memo txs, route `economy-actions` / `SolanaPortal` through the adapter once OKX exposes Solana transaction signing. Keep Phantom as default when `walletType` is `phantom` / `extension`.
4. **Gas Station (optional)** — when a Solana `send` needs fee sponsorship, follow OKX Gas Station confirm flow (`confirming` → user confirm → `--force`). Document in UI that practice-network KPI still uses Devnet.
5. **Do not** put OKX credentials, session tokens, or seed material in `localStorage` logs or client analytics.

## Skill reference (agents)

Repo skill: `.agents/skills/okx-agentic-wallet/SKILL.md` (and mirrored under `~/.claude/skills/`). Route by intent:

- Connect / accounts → `wallet`
- Gas with stablecoin on Solana → `gas-station`
- Swap / bridge only if product expands beyond PoA KPI

## Non-goals (this phase)

- Replacing Phantom as the default connect
- EVM-only smart wallets as the primary Culture Node identity
- Changing ZK nullifier or passport storage keys
