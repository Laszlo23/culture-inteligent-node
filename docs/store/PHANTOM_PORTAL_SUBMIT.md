# Phantom Explore — submit checklist

Docs: https://docs.phantom.com/phantom-portal/edit-app-info

## Steps

1. Sign in to [Phantom Portal](https://phantom.com/portal) (or current portal URL).
2. Create / select app → **Edit App Info**:
   - Icon: `public/store/app-icon-512.png` (resize to ≤250×250 if required)
   - Name: Culture Node
   - Description (≤100 chars): from `LISTING_COPY.md` subtitle
   - Public URL: `https://mining.buildingcultureid.space/`
   - Cover: `public/store/phantom-cover.png` (1500×500)
   - Category: AI or Gaming
   - Networks: Solana
3. **Verify domain** — add the DNS TXT record Phantom shows for `buildingcultureid.space` (or mining subdomain as instructed).
4. Click **Submit changes for review**.

## DNS (you must do this in your DNS host)

Phantom will give a TXT value like:

```
host: _phantom-challenge.buildingcultureid.space  (or as shown)
value: phantom-verification=…
```

After DNS propagates, click Verify in the portal.

## After approval

App appears in Phantom Explore / search for verified HTTPS apps.
