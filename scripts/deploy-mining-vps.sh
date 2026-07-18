#!/usr/bin/env bash
# Deploy Culture Node → mining.buildingcultureid.space (SSH host: mining-vps)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-mining-vps}"
REMOTE="${DEPLOY_PATH:-/opt/culture-node}"

echo "==> Sync → ${HOST}:${REMOTE} (preserving remote .env)"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude 'dist' \
  --exclude '.DS_Store' \
  --exclude '*.swp' \
  --exclude 'public/roadmap/*.mp4' \
  --exclude 'culture-economy/target' \
  --exclude 'culture-poa/target' \
  --exclude '.agents' \
  --exclude 'data/tts-cache' \
  --exclude 'data/growth-network.json' \
  "${ROOT}/" "${HOST}:${REMOTE}/"

echo "==> Install + build + restart culture-node.service"
ssh "${HOST}" "bash -s" <<EOF
set -euo pipefail
cd ${REMOTE}
npm ci
npm run build
systemctl restart culture-node.service
sleep 3
systemctl is-active culture-node.service

# Reject SPA HTML masquerading as API
assert_json() {
  local url="\$1" needle="\$2"
  local body
  body=\$(curl -fsS "\$url")
  if echo "\$body" | head -c 20 | grep -qi '<!DOCTYPE\|<html'; then
    echo "FAIL: \$url returned HTML SPA shell instead of JSON" >&2
    exit 1
  fi
  echo "\$body" | grep -q "\$needle" || { echo "FAIL: \$url missing \$needle — \$body" >&2; exit 1; }
  echo "ok \$url"
}
assert_json http://127.0.0.1:3033/api/health '"ok":true'
assert_json http://127.0.0.1:3033/api/ready '"ready":true'
assert_json http://127.0.0.1:3033/api/economy/status '"ready":true'
EOF

echo "==> Live check"
curl -fsS https://mining.buildingcultureid.space/api/health | grep -q '"ok":true'
curl -fsS https://mining.buildingcultureid.space/api/economy/status | grep -q '"ready":true'
curl -fsS https://mining.buildingcultureid.space/api/toll/catalog | grep -q '"configured":true' \
  || echo "WARN: toll treasury not configured on host (set VITE_TOLL_TREASURY)"
curl -fsS -o /dev/null -w "https_status=%{http_code}\\n" https://mining.buildingcultureid.space/ || true
echo "Done. https://mining.buildingcultureid.space/"
