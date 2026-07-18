# Building Culture — Angel Diligence

**Lens:** Pre-seed / angel. Not a banker’s model — a conviction checklist.  
**Product:** Human Economy / Human Passport · **Company:** Building Culture  
**Workspace:** Culture Node · **Live:** https://mining.buildingcultureid.space/  

Related: [HUMAN_ECONOMY.md](./HUMAN_ECONOMY.md) · [INVESTOR_PARTNER_BRIEF.md](./INVESTOR_PARTNER_BRIEF.md) · [PARTNER_ATTENTION_SESSION.md](./PARTNER_ATTENTION_SESSION.md)

---

## Verdict (one line)

Worth a conversation if the founder keeps shipping Human Passport + Proof of Attention and closes **one** real company pilot — the wedge is reputation for the AI economy; settlement must stay honest.

---

## Cons (what an angel will push on)

| # | Con | Why it hurts |
|---|-----|----------------|
| 1 | **Devnet, not mainnet** | On-chain “economy” is practice settlement — not real treasury scale yet. |
| 2 | **Host settlement gap** | Production may still serve SPA where `/api/economy/status` should answer — live cash claims need a redeploy. |
| 3 | **Unproven retention** | Ritual + Academy are strong ideas; MAU / D7 / Spreads are not yet a board pack. |
| 4 | **Revenue is designed, not proven** | 1¢ tolls + partner packages exist on paper; few (or zero) closed $ cycles. |
| 5 | **Category stigma** | “Learn-to-earn” smells like extractive web3 unless brand discipline holds. |
| 6 | **Hearing Mode fragility** | Web Speech API = browser / mic / OS dependent; Safari ≠ Chrome. |
| 7 | **Product surface area** | Facility HUD + economy + NFT gallery can distract from the simple Hearing → Zen → fuel story. |
| 8 | **Founder concentration** | Push is an asset until it’s a single point of failure (curriculum, partners, ops). |
| 9 | **Partner offer is early** | Attention Sessions need one public case study or the price list feels fictional. |
| 10 | **Token optics** | BCC/CGT invite “what’s the token trade?” even when the brand says knowledge first. |

---

## Not-so-cons (why a sharp angel still leans in)

| # | Not-so-con | Why it helps |
|---|------------|--------------|
| 1 | **Honest Devnet** | Rare. Signals adult founders; reduces vapor risk for angels who’ve been burned. |
| 2 | **Free core is sacred** | First Spark + daily claim free → trust moat vs pay-to-play scrapers. |
| 3 | **Hearing Mode wedge** | Ears-first Proof of Attention is differentiated in a eyes-only market. |
| 4 | **Zen decision break** | Product philosophy (Mind ↔ Machine) — not another infinite feed. |
| 5 | **B2B doesn’t need mainnet** | Partner Attention Sessions are cash today; settlement can catch up. |
| 6 | **Low capital intensity** | Curriculum + software studio — burn can stay small if focus holds. |
| 7 | **Spread = paid acquisition alternative** | Club invites are a distribution thesis angels understand. |
| 8 | **Micropayment rails sketched** | Toll catalog + treasury path = consumer monetization when traffic exists. |
| 9 | **Brand rules are written** | Reduces the #1 kill shot: becoming another empty hash casino. |
| 10 | **Founder push** | Persistence is the scarce input between Scenario A and B. |

---

## Con → fix (optimize so everyone wins)

| Con | Fix (next) | Good for members | Good for partners | Good for angels |
|-----|------------|------------------|-------------------|-----------------|
| 1–2 Settlement | Redeploy host with economy env; publish honest “live vs local” status | Real fuel when claimed | Trust metrics | De-risks diligence lie |
| 3 Retention | Weekly Hearing demo + measure First Spark → Spread → return | Clearer loop | Proof of audience | Data room starts |
| 4 Revenue | One pilot partner (cash or trade) + toll treasury live | Free core stays | Case study | First $ proof |
| 5 Category | Lead every pitch with Hearing + Zen, never token | Dignity | Brand-safe collab | Narrative that travels |
| 6 Hearing fragility | Document supported browsers; graceful fallback UI | Still usable | Clear expectations | No overclaim |
| 7 Surface area | Demo path = Hear → Academy → Zen → Spread only | Less overwhelm | Simple buy | Crisp story |
| 8 Founder risk | Write partner CMS / session template so others can ship | Consistent quality | Faster drops | Transferable ops |
| 9 Partner early | Public pilot week + metrics one-pager | Fresh sessions | Low-risk trial | Traction signal |
| 10 Token optics | “Settlement layer, not the brand” in every deck | No FOMO pressure | Knowledge first | Cleaner compliance vibe |

---

## Good outcome for all (the deal shape)

If the list above is worked in order, the win-condition is:

| Party | Outcome |
|-------|---------|
| **Members** | Free door, knowledge-first Zen, Hearing when eyes are busy, no extractive paywall |
| **Partners** | Cheap pilot → measurable Attention Session → optional retainer; brand-safe |
| **Angels** | Small check against Scenario B: Club compounds, B2B cash before mainnet heroics |
| **Founder** | Push converts into case studies + retention metrics, not lonely feature sprawl |

**Working thesis (angel):** Fund the *studio that owns ears-first Proof of Attention* — not a token raise. Milestone gates: (1) production economy honest, (2) one partner pilot closed, (3) Hearing demo + Spread metrics for 4 weeks.

**Proof of Hook Awareness:** After First Spark, Hook Mirror captures the doomscroll moment — what hooks you, what you notice when you’re scrolling again, why you keep going — then Zen Mind/Machine. That artifact is the product claim made measurable (not empty scroll guilt).

---

## Questions an angel should ask (and strong answers)

1. **What’s live on production vs local only?** → Show `/api/economy/status` after redeploy; until then, say Devnet practice + product UX live.  
2. **What’s the first dollar?** → Partner pilot (preferred) or toll treasury — not miner speculation.  
3. **What do you never sell?** → First Spark, Mind/Zen hold, empty impressions.  
4. **Why won’t this become another L2E rug?** → Brand strategy + free core + Hearing wedge + B2B sessions.  
5. **What does the next 90 days look like if we say yes?** → See checklist below.

---

## 90-day checklist (post-conviction)

- [ ] Production economy status green (or explicit “UX-only” banner — never fake)  
- [ ] Toll treasury configured; one real 1¢ path tested  
- [ ] One Partner Attention Session shipped (cash or trade)  
- [ ] Weekly Hearing Mode demo posted; Spreads counted  
- [ ] Demo script stays Hear → Academy → Zen → Spread (no gallery tour)  
- [ ] Angel update: MAU proxy, First Spark completes, Spreads, partner pipeline  

### In-app measurement (shipped)

Local attention metrics (`src/lib/attention-metrics.ts`) — no third-party tracker.

| Event | Where |
|-------|--------|
| Hearing open/exit/commands | Hearing Mode |
| Academy start, Neural Snap pass/fail | Attention Academy |
| Zen decision + Zen toggle | Academy / Hearing |
| First Spark + session complete | Academy settle |
| Spread + broadcast | Header, Hearing, Club oath |
| Field Deck claim / trade intent | `?card=` QR · Field Deck room |
| Focus enter/exit + minutes | Focus Mode |
| Hook Mirror complete | Proof of Hook Awareness settle |

**UI:** header **Metrics** (or say “Metrics” in Hearing) → 7d snapshot → Copy weekly / Export JSON.  
**Focus Mode:** header **Focus** or say “Focus” — dims facility chrome for full attention.

---

*Mine some culture. Knowledge first. Then decide. Settlement second.*
