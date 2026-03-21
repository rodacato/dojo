# Active Block: Close Phase 0 — Working Core Loop

**Started:** 2026-03-21
**Phase:** Phase 0

**Expected outcome:** The creator can complete a full kata — from choosing an exercise to receiving the sensei's verdict — without technical friction, in production.

---

## Committed

### Pre-implementation (unblock everything else)
- [ ] `scripts/test-llm.ts` — standalone prompt tester, run before wiring WebSocket (see PRD-012)
- [ ] Pick winning sensei prompt (3 variations in PRD-012), commit to `apps/api/src/prompts/sensei.ts`
- [ ] Define canonical `topics[]` vocabulary in `packages/shared` (aligns seed data + LLM output)

### Backend
- [ ] Spec 012 — Seed data: 8 kata from PRD-006, deterministic UUIDs, idempotent, seed validation
- [ ] Spec 009 — HTTP routes: `GET /exercises`, `POST /sessions`, `GET /sessions/:id`, `POST /sessions/:id/attempts`, `GET /auth/me`, `GET /dashboard`
- [ ] Spec 011 — Anthropic streaming adapter: `LLMPort` implementation, `<evaluation>` parser, structured output
- [ ] Spec 010 — WebSocket evaluation flow: message protocol, reconnect, timer enforcement, concurrent connection limit

### Frontend
- [ ] Tailwind 4 setup + design tokens (colors, typography, spacing from style guide)
- [ ] Style guide implementation — all primitives: buttons, inputs, badges, chips, cards, timer, heatmap, streaming indicator
- [ ] Spec 013 — 8 core screens: Login → Dashboard → Day Start → Kata Selection → Kata Active (CODE + CHAT) → Eval → Results
- [ ] CodeMirror 6 integration in Kata Active CODE (no autocomplete, no spell check)

### Admin + Deploy
- [ ] Spec 014 — Admin UI: Exercise List + New Exercise (Exercise section only, others as disabled skeleton)
- [ ] Spec 015 — Kamal deploy config: Hetzner VPS, GitHub Environment `production`

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
