# Interactive decks — in-app presentation pattern

Dense marketing and FAQ copy ships as **tap-through decks**, not essay pages.

**Primitive:** `src/components/fx/InteractiveDeck.tsx`  
**Slide data:** `src/lib/decks/*.ts` (`DeckSlide`: eyebrow · title · body ≤2 sentences · optional accent / CTA)

---

## Slide rules

1. One job per slide  
2. Body hard-cap ~2 short sentences  
3. Actions live after (or as final-slide CTA) — wallet, attest, Discord join, Book pilot  
4. Reuse `CinematicPanel` moods; do **not** replace cold-start full-bleed story art

---

## Where decks run

| Surface | Deck | Notes |
| --- | --- | --- |
| Ecosystem Hub | `ECONOMY_DECK` · `FAIRNESS_DECK` · `PROOFS_DECK` · `PARTNERS_DECK` | Hub tabs |
| Partner room | `PARTNERS_DECK` | Shared with hub |
| Discord full hub | `DISCORD_DECK` | Then join buttons |
| Growth / passport | `JOURNEY_DECK` | Compact |
| Landing explore | `EXPLORE_DECK` | After cinematic story |
| Academy session | Inline 2-slide brief | Hook → insight → **Start exercise** (content stays in `attention-intelligence.ts`) |

Cold-start **story** mode stays scroll-snap + `StoryChapterArt` (`STORY_CHAPTERS`) — already a presentation.

Legal pages use **accordion + plain-language lead** only (`LegalPages.tsx`) — not decks.

---

## Docs & grant packs

Long markdown under `docs/` and `okx-genesis-submission/` stays authoring text. Prefer a **TL;DR deck** (6 bullets max) at the top of grant / diligence packs; do not convert legal or submission paste blocks into slides.
