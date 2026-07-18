#!/usr/bin/env bash
# Deploy Culture Economy to Devnet, bootstrap BCC/CGT, write root .env.
# Prerequisites: funded authority wallet (~3+ SOL), built .so, solana CLI on PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRAM_SO="$ROOT/culture-economy/target/deploy/culture_economy.so"
PROGRAM_KP="$ROOT/culture-economy/target/deploy/culture_economy-keypair.json"
PROGRAM_ID="AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ"
RPC="${SOLANA_RPC_URL:-https://api.devnet.solana.com}"

cd "$ROOT"

echo "==> Authority wallet"
solana address
BAL="$(solana balance --url "$RPC" | awk '{print $1}')"
echo "    balance: $BAL SOL"
python3 - <<PY
bal=float("$BAL")
if bal < 3.0:
    raise SystemExit(f"Need >= 3 SOL for program rent (~2.7) + bootstrap; have {bal}")
PY

if [[ ! -f "$PROGRAM_SO" ]]; then
  echo "==> Building program (anchor 0.30.1 preferred)"
  (cd "$ROOT/culture-economy" && anchor build --no-idl)
fi

echo "==> Deploying $PROGRAM_ID"
solana program deploy "$PROGRAM_SO" \
  --program-id "$PROGRAM_KP" \
  --url "$RPC" \
  --commitment confirmed

echo "==> Bootstrap mints + initialize_config"
npx tsx "$ROOT/scripts/devnet-bootstrap.ts"

BOOT="$ROOT/culture-economy/bootstrap-env.txt"
if [[ ! -f "$BOOT" ]]; then
  echo "Missing $BOOT after bootstrap" >&2
  exit 1
fi

ENV_FILE="$ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  # Strip prior economy keys, then append bootstrap lines
  grep -vE '^(VITE_ECONOMY_PROGRAM_ID|VITE_BCC_MINT|VITE_CGT_MINT|ECONOMY_AUTHORITY_SECRET)=' "$ENV_FILE" > "$ENV_FILE.tmp" || true
  mv "$ENV_FILE.tmp" "$ENV_FILE"
else
  # Minimal .env from example comments + bootstrap
  cat > "$ENV_FILE" <<'EOF'
WALLET_JWT_SECRET="building-culture-devnet-wallet-secret-v1"
APP_URL="http://localhost:3040"
PORT=3040
EOF
fi

{
  echo ""
  echo "# Culture Economy (Devnet) — written by scripts/devnet-go-live.sh"
  cat "$BOOT"
} >> "$ENV_FILE"

echo "==> Wrote economy vars into $ENV_FILE"
echo "==> Restart the Node server, then:"
echo "    curl -s http://localhost:3040/api/economy/status | jq ."
echo "Expect ready:true with configured mints + authority."
