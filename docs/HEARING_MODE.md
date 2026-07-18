# Hearing Mode — Neural attention guide

**Live:** `https://mining.buildingcultureid.space/?hear=1`  
**Default voice:** Sulafat (warm Gemini TTS)  
**Not** browser `speechSynthesis` — that sounded thin / robotic.

Hearing Mode is the ears-first wedge for Proof of Attention: close your eyes, follow the guide, then spark.

---

## Why neural

| Browser TTS | Gemini neural TTS |
| --- | --- |
| Device-dependent, often harsh | Consistent warm guide voice |
| “65-bit AI” feel | Human Economy tone |

Server synthesizes WAV → client plays. Soft pad under voice via `soundEngine.setHearingBed`.

---

## Env

```bash
GEMINI_API_KEY=...                 # or GENERATIVE_AI_API_KEY
HEARING_VOICE=Sulafat              # optional
HEARING_TTS_MODEL=gemini-2.5-flash-preview-tts
```

Key resolution: `src/lib/gemini-key.ts`.

---

## APIs

```http
GET /api/hearing/voice
→ { ready, voice, model, hasKey }

POST /api/hearing/speak
{ "text": "...", "style": "guide" | "soft" | "clear" }
→ audio/wav
```

- Impl: `src/lib/hearing/gemini-tts.ts`, `src/lib/hearing/speech.ts`, `src/lib/hearing/scripts.ts`  
- Cache: `data/tts-cache/` (gitignored)  
- Smoke: `scripts/smoke-hearing-tts.ts`

---

## Product rules

1. Free core — Hearing never behind a paywall.  
2. Warm, short scripts — guide, don’t lecture.  
3. Zen Mind ↔ Machine can interrupt after First Spark.  
4. Spread invite is a first-class Hearing action.

Community ritual: open `?hear=1` on the weekly Community Hearing — see [COMMUNITY.md](./COMMUNITY.md).
