# Hook Loop — Social Sharing Campaign

**One line:** Show how doomscrolling hooks work — fun memes, packed truths, share unlocks the next.

## Perfect loop

1. **Hook** — meme lands (top/bottom lines on campaign art)
2. **Truth** — one sentence that names the trick
3. **Share** — Web Share / clipboard pack with deep link `?room=hook-loop&truth=HTxx`
4. **Unlock** — sharer’s next truth advances (local deck progress)

Copy alone does **not** unlock. Share (or share-sheet → clipboard fallback after a real share attempt that fails non-cancel) advances the deck. Clipboard-only via “Copy pack” keeps the current truth so people must pass it on.

## Product fit

- Cold-start: *Name the bait that owns your thumb.*
- Academy: Hook Mirror / Proof of Hook Awareness
- Field Deck: physical Hook Cycle cards (IRL)
- Hook Loop: digital viral layer (share)

## Metrics (local)

- `hook_loop_view`
- `hook_loop_share` (props: truth, next, how, shares)
- `hook_loop_copy`

## Deep links

| URL | Behavior |
|-----|----------|
| `/?room=hook-loop` | Open campaign room |
| `/?truth=HT07` | Open room on that truth |
| `/?room=hook-loop&truth=HT15` | Same |

## Deck

16 truths in `src/lib/hook-loop-campaign.ts` — bait → catch → stay → break. Rotate art from `/campaign/*`.

## Voice rules

Keep brand: direct, warm, slightly defiant. Memes can be loud; flip lines always point back to attention ownership, not empty guilt.
