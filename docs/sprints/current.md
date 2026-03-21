# Active Block: Close Phase 0 — Working Core Loop

**Started:** 2026-03-21
**Phase:** Phase 0

**Expected outcome:** The creator can complete a full kata — from choosing an exercise to receiving the sensei's verdict — without technical friction, in production.

---

## Committed

- [ ] Anthropic streaming adapter — replaces `MockLLMAdapter` with a real Anthropic API call, token-by-token response
- [ ] WebSocket evaluation flow — user submits answer → sensei streams → follow-up or final verdict
- [ ] HTTP routes — `POST /sessions`, `POST /sessions/:id/attempts`, `GET /exercises`
- [ ] Seed data — 5–10 hand-written kata (code review, system design, chat)
- [ ] Frontend — Tailwind 4, base layout, screens: exercise picker, kata view, results
- [ ] Kamal deploy config — Hetzner VPS, GitHub Environment `production`

---

## Out of this block

- Social features (Phase 1) — profiles, invitations, share cards
- Badges and leaderboard (Phase 2)
- User-submitted exercises (Phase 3)

---

## Retro *(on close)*

- What went well?
- What slowed us down?
- What goes to the next block?
