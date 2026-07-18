# Culture Node — App Store Momentum Runbook

**Goal:** Solana dApp Store first (PWA → TWA APK), Phantom Explore parallel. Apple/Google later.

**Live app:** https://mining.buildingcultureid.space/

## Status

| Layer | Status |
|-------|--------|
| PWA manifest + SW + Install CTA | Shipped in repo (`public/sw.js`, `InstallPrompt`) |
| Store screenshots / cover / icon | `public/store/` |
| Privacy / Terms (static) | `/privacy.html` · `/terms.html` |
| Digital Asset Links stub | `public/.well-known/assetlinks.json` |
| TWA scaffold | `mobile-twa/` (needs local Java 17 to build APK) |
| Solana dApp Store submit | Human — follow `docs/store/SOLANA_DAPP_STORE_SUBMIT.md` |
| Phantom Explore submit | Human — follow `docs/store/PHANTOM_PORTAL_SUBMIT.md` |
| Apple / Google Play | Phase E — after Solana listing |

## Phase A — PWA (done in codebase)

- Service worker: `public/sw.js` (registered in production from `src/main.tsx`)
- Manifest: `public/site.webmanifest` (id, scope, categories, screenshots)
- Apple meta: `index.html`
- Install banner: `src/components/InstallPrompt.tsx`
- Deep link rooms: `?room=legal-privacy` etc.

Verify on Android Chrome: open site → Install Culture Node / browser install prompt.

## Phase B — TWA APK

```bash
brew install --cask temurin@17   # once
cd mobile-twa
# set passwords in .keystore-env (gitignored) or export env vars
./scripts/build-twa.sh
# paste SHA256 into ../public/.well-known/assetlinks.json
# redeploy site, then test APK
```

See `mobile-twa/README.md`.

## Phase C / D — Store portals

- Solana: `docs/store/SOLANA_DAPP_STORE_SUBMIT.md`
- Phantom: `docs/store/PHANTOM_PORTAL_SUBMIT.md`
- Copy + assets: `docs/store/LISTING_COPY.md` + `public/store/`

## Phase E — Apple / Google (later)

Capacitor wrap of the same HTTPS origin after Solana listing is live. Do not block on Apple review for Devnet momentum.

## Deploy note

After PWA changes, rebuild on VPS (`npm run build` + `systemctl restart culture-node`) so `sw.js`, manifest, `.well-known`, and `/store/*` are served from `dist/`.
