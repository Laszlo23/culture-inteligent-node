# Culture Node — TWA (Trusted Web Activity)

Wraps `https://mining.buildingcultureid.space` as an Android APK for the **Solana dApp Store**.

## Prerequisites

- Node 20+, Java 17 (Temurin)
- `@bubblewrap/cli` (`npm i -g @bubblewrap/cli`)
- Offline password manager for keystore secrets

## One-time init (if regenerating)

```bash
cd mobile-twa
npx @bubblewrap/cli init \
  --manifest https://mining.buildingcultureid.space/site.webmanifest
# Package ID: space.buildingcultureid.culturenode
# Host: mining.buildingcultureid.space
```

Or reuse the committed `twa-manifest.json` and generate a keystore:

```bash
./scripts/build-twa.sh
```

## Build signed APK

```bash
cd mobile-twa
export BUBBLEWRAP_KEYSTORE_PASSWORD='…'   # from password manager
export BUBBLEWRAP_KEY_PASSWORD='…'
npx @bubblewrap/cli build
```

Output: `app-release-signed.apk`

## Digital Asset Links

1. Get SHA-256 fingerprint:

```bash
keytool -list -v -keystore android.keystore -alias culture-node
```

2. Put the fingerprint into `../public/.well-known/assetlinks.json` (replace `REPLACE_AFTER_KEYSTORE_BUILD`).
3. Deploy the site so `https://mining.buildingcultureid.space/.well-known/assetlinks.json` returns 200.
4. Reinstall APK — Chrome should open frameless (no URL bar).

## Submit

See [docs/APP_STORE.md](../docs/APP_STORE.md) Phase C.

## Secrets — do not commit

- `android.keystore`
- `*.apk`
- `android/` generated project (optional; can regenerate)
