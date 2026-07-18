# culture_economy

Anchor program for Culture Node facility ledger (Devnet).

```bash
avm use 0.30.1
anchor build --no-idl
anchor deploy --provider.cluster devnet
```

Then from repo root:

```bash
npx tsx scripts/devnet-bootstrap.ts
```

See [docs/SOLANA_ECONOMY.md](../docs/SOLANA_ECONOMY.md).
