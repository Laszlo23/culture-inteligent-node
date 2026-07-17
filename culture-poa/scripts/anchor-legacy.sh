#!/usr/bin/env bash
# Anchor 1.0 defaults to Surfpool; Arcium localnet needs solana-test-validator.
# Force --validator legacy for localnet/test when not already specified.
set -euo pipefail
ANCHOR_BIN="${ANCHOR_BIN:-$HOME/.avm/bin/anchor-1.0.2}"
if [[ ! -x "$ANCHOR_BIN" ]]; then
  ANCHOR_BIN="$(command -v anchor-1.0.2 || true)"
fi
if [[ -z "${ANCHOR_BIN}" || ! -x "$ANCHOR_BIN" ]]; then
  echo "anchor-1.0.2 not found" >&2
  exit 127
fi

cmd="${1:-}"
if [[ "$cmd" == "localnet" || "$cmd" == "test" ]]; then
  for arg in "$@"; do
    if [[ "$arg" == "--validator" || "$arg" == "legacy" || "$arg" == "surfpool" ]]; then
      exec "$ANCHOR_BIN" "$@"
    fi
  done
  exec "$ANCHOR_BIN" "$@" --validator legacy
fi
exec "$ANCHOR_BIN" "$@"
