# Attention UX — Grabbers, badges, Outer Circuit glitch

Culture Node is an **attention-focused** workspace. UI should pull focus to the next real action — not decorate every panel.

---

## Principles

1. **One job per strip** — whisper, momentum, brief; don’t invent a fourth band.  
2. **Icons + badges = priority** — counts and pulses only when action is due.  
3. **Glitch = secret** — reserved for Outer Circuit (the big hidden quest).  
4. **Respect reduced motion** — all glitch/pulse CSS no-ops under `prefers-reduced-motion`.

---

## Attention grabbers

| Surface | What you see |
| --- | --- |
| **Attention Brief** | Icon tiles + corner badges (fuel %, missions `!`, streak, unread, academy remaining) |
| **Momentum bar** | Flame tile; badge beats or `!` when ≥70% to next reward + “Near reward” chip |
| **Outer Circuit whisper** | Pulsing remaining-chapters badge + **Hidden** chip |
| **Header bell** | Unread count (existing) |

Shared primitives: `src/components/fx/Glitch.tsx`  
- `AttentionIconTile` · `AttentionBadge` · `GlitchFrame` · `GlitchText`

Brief builder: `buildAttentionBrief()` in `src/components/fx/index.tsx`  
When Outer Circuit is discovered, a **Hidden path open** card appears first in the brief.

---

## Outer Circuit (big hidden quest)

**Logic:** `src/lib/meta-quest.ts` — chapters close on real facility events (First Spark, Academy, vault, forge, duality, missions, presence).  
**UI:** `MetaQuestWhisper.tsx` — cryptic until chapters reveal.

### Glitch treatment

- Soft / medium loop RGB-split + clip-path tears on the whisper strip  
- Burst on discover, chapter change, or seal  
- Sealed state keeps soft glitch + amber “sealed” badge  
- CSS: `.glitch-frame*`, `.glitch-text`, `.attention-badge-pulse` in `src/index.css`

The glitch should feel like a **signal leaking through** — not a party effect. If it shouts louder than Proof of Attention CTAs, dial intensity down (`soft` vs `medium`).

---

## Copy tone

- Whisper: cryptic, italic, never a checklist until earned  
- Brief: short, directive, one CTA  
- Avoid farm / yield / airdrop language ([BRAND_STRATEGY.md](./BRAND_STRATEGY.md))

---

## Related code

| Path | Role |
| --- | --- |
| `MetaQuestWhisper.tsx` | Hidden quest + glitch |
| `PlayMomentumBar.tsx` | Session climb |
| `fx/index.tsx` | Attention Brief strip |
| `fx/Glitch.tsx` | Grabber + glitch primitives |
| `App.tsx` | Wires meta + brief + strips |
