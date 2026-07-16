# Primary KPI (paste-ready)

## Short (form field)

```
Confirmed Devnet contribution tx (0.05 SOL) → facility credits/energy update + server RPC verify. Academy sessions require Gemini agent verify → optional Devnet memo PoA attest (Solscan).
```

## Exact success condition

A first-time operator on the live MVP:

1. Connects wallet (Phantom or local Devnet keypair) → wallet JWT API session
2. Requests faucet SOL if needed
3. Clicks **PROVE KPI: SEND 0.05 SOL**
4. Transaction reaches `confirmed` on Solana Devnet + `POST /api/kpi/verify`
5. Completes Attention Academy quiz → `POST /api/attention/verify` (Gemini or heuristic)
6. Optional: **ATTEST ON DEVNET** memo tx → Solscan link on PoA

**No confirmed Devnet KPI tx = primary KPI not met.**
