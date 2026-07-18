# Growth Loop — Connections that count

**Live:** https://mining.buildingcultureid.space/  
**UI:** Home map + Passport → **Growth Loop** panel  
**Playbook:** [COMMUNITY.md](./COMMUNITY.md)

The product loop is not vibes-only. Events hit a **server ledger** so the network keeps growing across browsers.

```
Discover → Claim → Spark → Spread → Return
```

---

## What “connection” means

A **connection** is created when someone lands via your invite code and **claims a Human Passport**.

Edge: `yourCode → theirCode`  
Your **Your connections** count = number of claim edges from your code.  
**Network links** = unique edges across the whole ledger.

| Event | When (client) | Ledger effect |
| --- | --- | --- |
| `land` | Fresh `?invite=` open | Inviter `landsIn++` |
| `claim` | Invitee finishes passport claim | Edge + `claimsIn++` (**connection**) |
| `spark` | First Spark completes | Actor `sparks++` |
| `spread` | Cast / copy invite | Actor `spreads++` |
| `return` | Reserved / optional close signal | `returns++` |

Invite code = first 6 alphanumeric chars of wallet (same as `?invite=`).

---

## APIs

```http
POST /api/growth/event
Content-Type: application/json

{ "type": "claim", "inviteCode": "ABC123", "actorCode": "XYZ789", "nonce": "unique-or-stable" }
```

```http
GET /api/growth/pulse
→ { lands, claims, spreads, sparks, returns, connections, nodes, recent[] }

GET /api/growth/stats?code=ABC123
→ { code, connections, landsIn, claimsIn, spreads, sparks, network, loop }
```

- **Storage:** `data/growth-network.json` (gitignored; preserved on VPS deploy)  
- **Dedupe:** SHA of type + codes + nonce (default hour bucket if nonce omitted)  
- **Impl:** `src/lib/growth-network.ts` (server) · `src/lib/growth-loop.ts` (client) · `GrowthLoopPanel.tsx`

---

## Where events fire

| Client hook | File |
| --- | --- |
| Invite land | `App.tsx` → `captureInviteFromUrl` |
| Passport claim | `App.tsx` → `onClaimed` |
| Spread (header / Hearing / passport) | `App.tsx`, `HumanPassportClaim` |
| First Spark | `AttentionAcademy.tsx` |

Local `track()` metrics still exist for private analytics; growth APIs are the shared graph.

---

## How to grow it this week

1. Cast your invite (`Cast invite · grow loop` on the panel).  
2. Ask one person to claim passport with your link.  
3. Watch **Your connections** tick and **Live network** show the edge.  
4. They spark + spread — builders + network links climb.

Founder checklist: [COMMUNITY.md](./COMMUNITY.md) Day 0–7.
