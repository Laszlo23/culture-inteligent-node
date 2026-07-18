# Soulbound Reputation — ZKPassport + Non-Transferable Mint

**Product:** Culture Node · **Parent:** Building Culture  
**Status:** Devnet — uniqueness via ZKPassport; soulbound mint Token-2022 NonTransferable + Anchor PDA

## Split of concerns

| System | Proves | Does not prove |
|--------|--------|----------------|
| **ZKPassport** | Unique human (scoped nullifier from government ID NFC) | Attention quality |
| **Arcium PoA** | Confidential attention threshold | Unique human |
| **Soulbound badge** | Reputation bound to nullifier ↔ wallet | Transferability / marketplace |

Void Chamber stays identity-free. Never route SBT / ZK-ID through Void APIs.

## Threat model (honest)

1. **Sybil:** Many wallets without ZK-ID can still play Academy — they cannot mint **reputation SBT**.
2. **Nullifier reuse:** One `uniqueIdentifier` (scoped to Culture Node) → at most one badge PDA + one mint.
3. **Wallet theft:** Attacker with key can hold the SBT ATA but cannot re-mint under a second nullifier; recovery = re-prove same ID + re-bind policy (same nullifier only).
4. **PII:** We store **only** scoped nullifier hash, wallet, mint address, timestamps. Never name, MRZ, or document number.
5. **Devnet mock:** `ZKPASSPORT_DEV_MODE=1` accepts mock / demo nullifiers for jury demos — not production uniqueness.

## Flow

```
Prove (ZKPassport) → Bind (nullifier ↔ wallet, signed) → Mint (Token-2022 NonTransferable + PDA [b"sbt", nullifier_hash])
```

## On-chain

- **PDA seeds:** `[b"sbt", nullifier_hash_32]` under `culture_economy`
- **Account:** `SoulboundBadge { owner, nullifier, mint, minted_at, bump }` — no transfer ix
- **Token:** Token-2022 mint with `NonTransferable` extension; supply 1 to owner ATA
- **Memo attest** (`poa:…`) remains an optional PoA activity receipt — **not** the reputation SBT

## API

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/zk/verify` | wallet | Verify ZKPassport payload → `nullifierHash` |
| `POST /api/zk/bind` | wallet | Bind nullifier → wallet (once) |
| `GET /api/zk/status` | wallet | Bound? mintable? already minted? |
| `POST /api/zk/mint` | wallet | Authority-assisted Token-2022 mint + record |

## Env

See `.env.example`: `VITE_ZKPASSPORT_DOMAIN`, `ZKPASSPORT_SCOPE`, `ZKPASSPORT_DEV_MODE`.

## Copy rules

- Before ZK bind: say **Attested** (memo) — never “Soulbound NFT minted”.
- After mint: **Soulbound · ZKPassport-bound · non-transferable**.
