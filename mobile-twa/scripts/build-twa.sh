#!/usr/bin/env bash
# Build Culture Node TWA APK with Bubblewrap.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .keystore-env ]]; then
  # shellcheck disable=SC1091
  source .keystore-env
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java 17+ required: brew install --cask temurin@17"
  exit 1
fi

if [[ ! -f android.keystore ]]; then
  if [[ -z "${BUBBLEWRAP_KEYSTORE_PASSWORD:-}" ]]; then
    echo "Create .keystore-env with BUBBLEWRAP_KEYSTORE_PASSWORD and BUBBLEWRAP_KEY_PASSWORD"
    exit 1
  fi
  keytool -genkeypair -v \
    -keystore android.keystore \
    -alias culture-node \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$BUBBLEWRAP_KEYSTORE_PASSWORD" \
    -keypass "${BUBBLEWRAP_KEY_PASSWORD:-$BUBBLEWRAP_KEYSTORE_PASSWORD}" \
    -dname "CN=Culture Node, OU=Building Culture, O=Building Culture, L=Internet, ST=Devnet, C=US"
  echo "Created android.keystore — back it up offline NOW."
fi

echo "=== SHA256 fingerprint (paste into public/.well-known/assetlinks.json) ==="
keytool -list -v -keystore android.keystore -alias culture-node \
  -storepass "${BUBBLEWRAP_KEYSTORE_PASSWORD}" \
  | awk '/SHA256:/{print $2}'

npx --yes @bubblewrap/cli build --skipPwaValidation

ls -la app-release-signed.apk 2>/dev/null \
  || ls -la android/app/build/outputs/apk/release/*.apk 2>/dev/null \
  || echo "Check Bubblewrap output path above."
