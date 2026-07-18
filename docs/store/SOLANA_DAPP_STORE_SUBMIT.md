# Solana dApp Store — submit checklist

Portal: https://docs.solanamobile.com/dapp-store/submit-new-app

## Before you open the portal

1. [ ] Java 17 installed (`brew install --cask temurin@17`)
2. [ ] Build APK: see `mobile-twa/README.md` → `./scripts/build-twa.sh`
3. [ ] Fingerprint written into `public/.well-known/assetlinks.json`
4. [ ] Deployed so `https://mining.buildingcultureid.space/.well-known/assetlinks.json` is live
5. [ ] Publisher wallet has ~0.2 SOL (mainnet) for ArDrive / mint fees
6. [ ] Listing copy ready: `docs/store/LISTING_COPY.md`
7. [ ] Screenshots + icon in `public/store/`

## Portal steps

1. Open Solana dApp Publisher Portal → connect publisher wallet (keep this wallet forever).
2. Add a dApp → New dApp:
   - Name: Culture Node
   - Package: `space.buildingcultureid.culturenode`
   - Category: Education / Gaming
   - Short + long description from LISTING_COPY.md
   - Privacy: https://mining.buildingcultureid.space/privacy.html
   - Icon + screenshots from `public/store/`
3. Home → New Version → upload `app-release-signed.apk`
4. Sign all wallet prompts (Arweave upload + release NFT)
5. Wait for review email

## Deep link after live

`https://dappstore.solanamobile.com/app/space.buildingcultureid.culturenode`
