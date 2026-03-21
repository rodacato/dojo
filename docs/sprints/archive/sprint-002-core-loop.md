# Sprint 002: Close Phase 0 — Working Core Loop

**Started:** 2026-03-21
**Closed:** 2026-03-21
**Phase:** Phase 0

**Outcome:** The creator can complete a full kata end-to-end locally — choose an exercise, get a sensei-generated scenario, write a response, receive streaming evaluation, read results.

---

## Committed — all done ✓

### Pre-implementation
- [x] `scripts/test-llm.ts` — standalone prompt tester
- [x] Pick winning sensei prompt — Variation A, with no-solution guardrail added
- [x] Canonical `topics[]` vocabulary in `packages/shared`

### Backend
- [x] Spec 009 — HTTP routes layer
- [x] Spec 010 — WebSocket evaluation flow (reconnect, timer, concurrent connection limit)
- [x] Spec 011 — Anthropic streaming adapter + `<evaluation>` parser
- [x] Spec 012 — Seed data: 8 kata, 16 variations, deterministic UUIDs, idempotent

### Frontend
- [x] Tailwind 4 + design tokens
- [x] Spec 013 — 8 core screens end-to-end
- [x] CodeMirror 6 in Kata Active (no autocomplete, no spell check)

### Admin + Deploy
- [x] Spec 014 — Admin UI: exercise list + new exercise form
- [x] Spec 015 — Kamal deploy config (Hetzner, GitHub Actions, Cloudflare Tunnel)

### Post-sprint bugs fixed during manual testing
- [x] `tailwindcss` missing as direct dep in web package
- [x] API `dev` script missing `--env-file` flag
- [x] DayStart offered 10m duration but shortest seed exercise is 15m
- [x] Session creation blocking on LLM → decoupled to background job
- [x] Kata body rendered as plain text → markdown + resizable split panel

---

## Retro

**What went well:**
- All 7 specs implemented in sequence with zero regressions
- Prompt testing before wiring caught the no-solution guardrail issue early
- Background session creation (GenerateSessionBody) was a clean decoupling — the domain stayed simple
- Manual testing surfaced 5 real bugs that automated tests wouldn't have caught

**What slowed us down:**
- `@hono/node-ws` not exported from `@hono/node-server` — cost time investigating the wrong package
- WebSocket factory pattern needed because of module initialization order
- `tailwindcss` not listed as direct dep — silent failure at Vite build time
- `react-resizable-panels` API differed from docs (orientation vs direction, Group vs PanelGroup)

**What goes to the next block:**
- First production deploy (Kamal config exists, VPS not yet provisioned)
- More kata content (8 is enough to start, but thin for repeat users)
- Validate prompt quality with real sessions before inviting anyone
