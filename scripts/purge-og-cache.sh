#!/usr/bin/env bash
# Ask major crawlers to re-scrape Culture Node OG / share URLs.
# Farcaster: reset embed cache at https://farcaster.xyz/~/developers/embeds (login required).
set -euo pipefail

ORIGIN="${ORIGIN:-https://mining.buildingcultureid.space}"
V="${OG_ASSET_VERSION:-20260720a}"

URLS=(
  "${ORIGIN}/"
  "${ORIGIN}/?fc=1"
  "${ORIGIN}/og.jpg?v=${V}"
  "${ORIGIN}/miniapp/hero-1200x630.png?v=${V}"
  "${ORIGIN}/?share=human_value&fc=1&v=${V}"
  "${ORIGIN}/?share=passport_zero&fc=1&v=${V}"
  "${ORIGIN}/?share=contribution&fc=1&v=${V}"
  "${ORIGIN}/?share=first_spark&fc=1&v=${V}"
  "${ORIGIN}/?share=spread&fc=1&v=${V}"
  "${ORIGIN}/?share=hearing&fc=1&v=${V}"
  "${ORIGIN}/og/human-value.jpg?v=${V}"
  "${ORIGIN}/og/hearing.jpg?v=${V}"
)

echo "==> Facebook Sharing Debugger scrape (public graph scrape)"
for u in "${URLS[@]}"; do
  enc=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$u")
  code=$(curl -sS -o /tmp/og-scrape.json -w "%{http_code}" \
    -X POST "https://graph.facebook.com" \
    -d "id=${enc}&scrape=true" || true)
  echo "  FB ${code}  ${u}"
done

echo ""
echo "==> Verify share landings return pack-specific og:image"
for pack in human_value hearing spread; do
  img=$(curl -fsS "${ORIGIN}/?share=${pack}&fc=1&n=purge-check" \
    | python3 -c "import sys,re; h=sys.stdin.read(); m=re.search(r'property=\"og:image\" content=\"([^\"]+)\"', h); print(m.group(1) if m else 'MISSING')")
  echo "  ${pack} → ${img}"
done

echo ""
echo "==> Manual (login) — Farcaster embed cache reset:"
echo "  https://farcaster.xyz/~/developers/embeds"
echo "  Paste a share URL, then Reset cache."
echo "==> Manual — X Card Validator:"
echo "  https://cards-dev.twitter.com/validator"
echo "==> Manual — LinkedIn Post Inspector:"
echo "  https://www.linkedin.com/post-inspector/"
echo "Done."
