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
sleep 2
systemctl is-active culture-node.service
curl -fsS -o /dev/null -w "local_health=%{http_code}\\n" http://127.0.0.1:3033/ || true
EOF

echo "==> Live check"
curl -fsS -o /dev/null -w "https_status=%{http_code}\\n" https://mining.buildingcultureid.space/ || true
echo "Done. https://mining.buildingcultureid.space/"
