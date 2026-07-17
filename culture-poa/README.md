# culture_poa

Confidential Proof of Attention MXE for Building Culture / Culture Node.

Arcis circuit `verify_attention_threshold` checks encrypted `quiz_score` + `artifact_len_bucket` against min score **60** and non-empty artifact bucket. Output is `passed` + coarse `score_band` (0–3) — **not** raw artifacts.

## Quickstart

```bash
# Docker Desktop must be running
# Anchor 1.0 defaults to Surfpool; Arcium needs solana-test-validator — use the wrapper:
export PATH="$(pwd)/bin:$PATH"

arcium build
arcium test
```

If Docker fails with `Pool overlaps with other one on this address space`, free the `172.20.0.0/16` bridge (Arcium compose hardcodes that subnet) — e.g. temporarily stop containers on that network — then re-run.

If localnet times out waiting for `http://127.0.0.1:8899`, raise `[test].startup_wait` in `Anchor.toml` (ms) and `[localnet].localnet_timeout_secs` in `Arcium.toml`. The `bin/anchor` shim forces `--validator legacy` (required until Surfpool is installed).

## Layout

| Path | Purpose |
|------|---------|
| `programs/culture_poa/` | Anchor program: queue computation + callback |
| `encrypted-ixs/` | Arcis confidential instructions |
| `tests/culture_poa.ts` | Pass / fail-score / fail-empty-bucket |
| `Arcium.toml` | Localnet cluster config |

## Integration with Culture Node

See [`docs/ARCIUM_POA.md`](../docs/ARCIUM_POA.md):

- **Arcium** = confidential verifier (gates energy grant)
- **Gemini** = optional coach copy only
- App client mirror: `src/lib/arcium-poa.ts`
- Program id (localnet): `4HwALuuryVebSQTLXpWdXeEJUhis8c5h8hLDxcLUCViG`

## Docs

<https://docs.arcium.com/developers>
