# Attention UX — Grabbers, badges, Outer Circuit glitch

Culture Node is an **attention-focused** workspace. UI should pull focus to the next real action — not decorate every panel.

---

## Principles

1. **One job per strip** — whisper, momentum, brief; don’t invent a fourth band.  
2. **Icons + badges = priority** — counts and pulses only when action is due.  
3. **Glitch = secret** — reserved for Outer Circuit (the big hidden quest).  
4. **Respect reduced motion** — all glitch/pulse CSS no-ops under `prefers-reduced-motion`.  
5. **Main loop wins Home** — in `ritual` / `guided`, Home is the Loop Stage (Hear → Spark → Zen → Spread → Return), not the facility grid.  
6. **Clear loop → cash path** — when nothing is due, primary CTA is prove attention again; Partner stays a rail (`winning-flows.ts`).  
7. **Story before dashboard** — cold-start is cinematic chapters, never facility chrome first.  
8. **Story inside the product** — replay Awareness Story via Home **Why learn**, Passport, header **Story**, or `?story=1` (`AwarenessStoryOverlay`). Finish lands on Academy / First Spark.

---

## Cold-start (cinematic story)

Unauthenticated first visit (`HumanEconomyLanding` · `STORY_CHAPTERS` in `human-economy.ts`):

1. **Opening** — invisible value → Building Culture → first Spark  
2. **Problem** — time ≠ worth · contribution = value  
3. **Awakening** — Human Passport · Knowledge / Builder / Contribution · starts at zero  
4. **First Spark** — potential becomes visible (not “do a quiz”)  
5. **Evolution** — Discover → Spark → Build → Share → Reputation  

Primary CTA: **Create Human Passport** → Auth → passport claim → Loop Stage.  
“Explore the world” opens a short `EXPLORE_DECK` plus waitlist / share tools — never essay sections in the first 30 seconds.  
Facility HUD only after First Spark / `navPhase === 'open'` (loop sanctuary hides Impact chrome, hearing banner, footer, rain).

**Self-executing awareness chain (first loop):**  
First Spark → fuel celebration → **Continue to Zen** (auto-opens Academy) → Mind/Machine → **Hook Mirror** (auto-stays in Academy) → return Home → **Spread**. Daily claim / partner rails wait until that chain closes.

**Personal hook → growth path:** Before First Contribution, users pick a relatable hook (`curious` / `reflective` / `balanced`) via `PersonalHookGate`. This is **not** class-select — passport dims stay discovery. Path only biases First Contribution prompts and Academy session order (`orderCoreSessions`). Change anytime in Academy. See `lib/growth-path.ts`.

**Conversational proofs:** First Contribution, First Spark journal, and Hook Mirror use short chat/voice turns (not long textareas). Desktop shows progress orbs + signal strength; Hearing dictates into the active beat. See [HEARING_MODE.md](./HEARING_MODE.md).

**Session player gating:** Hook and insight are an `InteractiveDeck` (two slides) before the exercise — curriculum essays stay in `src/content/attention-intelligence.ts`; do not dump both paragraphs at once. Hearing narrates the hook on open, then exercise prompts after **Start exercise**. See [INTERACTIVE_DECKS.md](./INTERACTIVE_DECKS.md).

Tone guardrail: *discover and grow potential* — never *earn points to prove you are human*.  
Loop Stage shows Knowledge / Builder / Contribution after First Spark so scores stay visible.

---

## Main Loop Stage (Home)

| Phase | Home shows |
| --- | --- |
| **ritual** | Loop Stage only — First Spark CTA, Hear secondary |
| **guided** | Loop Stage — claim → prove → Hook Mirror → Spread; optional “Open facility” |
| **open** | Full facility map + Attention Brief |

Code: `MainLoopStage.tsx` · `lib/main-loop.ts` · `navNextStep` in `App.tsx`.  
Celebrations: fuel strip after First Spark; Zen note after Mind/Machine; return greeting after 20h+ away.

---

## Attention grabbers

| Surface | What you see |
| --- | --- |
| **Loop Stage** | Rail + one CTA + fuel/streak/connection chips (ritual/guided Home) |
| **Attention Brief** | Icon tiles + corner badges (fuel %, missions `!`, streak, unread, academy remaining) — `open` only on Home |
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
| `MainLoopStage.tsx` | Product main loop Home surface |
| `lib/main-loop.ts` | Rail flags, return visit, hear touch |
| `MetaQuestWhisper.tsx` | Hidden quest + glitch |
| `PlayMomentumBar.tsx` | Session climb |
| `fx/index.tsx` | Attention Brief strip |
| `fx/Glitch.tsx` | Grabber + glitch primitives |
| `App.tsx` | Wires loop + meta + brief + strips |
