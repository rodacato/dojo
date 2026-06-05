# PRD-003: Implementation Phasing — What to Build First

> **Status:** exploring
> **Date:** 2026-03-21
> **Author:** Claude (Kira + panel: Priya, Darius, Tomás, Soren)

---

## Idea in one sentence

Sequence the remaining build work so every completed unit is a usable, testable slice — and the product generates value before it generates completeness.

---

## Context

From `docs/sprints/current.md`, sprint-002 has 6 committed items. This document breaks each down and sequences sub-tasks by value, so the creator can start using the product as soon as possible even if the full sprint is not done.

The north star for sequencing: **"Can the creator complete one kata end-to-end after this step?"**

---

## The critical path

```
Seed data → HTTP routes → Anthropic adapter → WebSocket eval → Frontend (Day Start → Kata → Eval → Results → Dashboard)
    ↑ needed by          ↑ needed by         ↑ needed by       ↑ needed for full loop
    HTTP routes          WebSocket            full loop
```

Kamal deploy and Admin UI are off the critical path for the first usable state.

---

## Phase 0 — Sprint 002 breakdown

### Step 1: Seed data (5–10 kata) — ⚡ Highest leverage first

**Why first:** Every other step needs exercises in the DB to test against. Without seed data, `GET /exercises` returns nothing and the whole loop breaks. This is a content task, not a code task — it can be done independently.

**What:** 5–10 exercises with at least one variation each, inserted via a seed script or SQL.
- Minimum viable: 3 exercises (one per type: CODE, CHAT, WHITEBOARD) — enough to test all three kata views
- Target: 8 exercises — enough variety for the 6-month exclusion rule to not be a constant problem in early testing

**Output:** A `seed.ts` script in `apps/api/src/infrastructure/persistence/seed.ts` that inserts exercises and variations. Idempotent — safe to re-run.

**See PRD-006** for the actual kata content.

---

### Step 2: HTTP routes

Three routes that unlock the core loop:

| Route | Spec | Depends on |
|---|---|---|
| `GET /exercises` | spec 009 | Seed data |
| `POST /sessions` | spec 009 | Exercises in DB |
| `POST /sessions/:id/attempts` | spec 009 | Session exists |

**Sub-sequence:**
1. `GET /exercises` — calls `ExerciseRepositoryPort.findEligible()` (already implemented). Wires query params → filters.
2. `POST /sessions` — calls `StartSession` use case. Body generation via `MockLLMAdapter` at first (see PRD-004), real adapter in step 3.
3. `POST /sessions/:id/attempts` — creates attempt, returns `attemptId`. Evaluation happens via WebSocket.

**Also add:** `GET /auth/me` (frontend bootstrap) and `GET /dashboard` (after the loop is working).

---

### Step 3: Anthropic streaming adapter

Replaces `MockLLMAdapter` with real API calls. This is the first "real AI" step.

**What it needs to implement:**
```typescript
interface LLMPort {
  evaluate(ownerRole, ownerContext, sessionBody, conversationHistory): AsyncIterator<EvaluationToken>
}
```

**Two concerns Yemi flags:**
1. **Structured output extraction:** The adapter must parse the final token into `EvaluationResult` (verdict, analysis, topicsToReview, followUpQuestion). This requires prompt engineering — the LLM must output a structured format at the end of the stream.
2. **Follow-up detection:** The adapter must signal `isFinalEvaluation: true` when the sensei has decided to give a verdict vs. ask a follow-up. This is prompt-level logic, not application logic.

**Recommended approach:** Stream raw prose to the frontend; emit a separate final structured JSON block at the end of the stream (e.g., wrapped in `<evaluation>...</evaluation>` tags that the adapter strips before forwarding tokens to the client).

> ⚠ Open question: Should the sensei always ask one follow-up, or decide based on the submission quality? The current architecture allows 0-2 follow-ups. The product philosophy suggests the sensei should decide — not a fixed counter.

---

### Step 4: WebSocket evaluation flow

The most complex step. Connects `POST /sessions/:id/attempts` → WebSocket stream → frontend render.

**Connection lifecycle (from PRD-002):**
```
POST /attempts → 202 {attemptId}
→ WS opens → {type:"ready"}
→ WS sends {type:"submit", attemptId}
→ WS receives {type:"token"} × N
→ WS receives {type:"evaluation", result: EvaluationResult}
→ WS receives {type:"complete", isFinal: boolean}
```

**Failure modes to handle (Tomás):**
- User closes tab mid-stream → session stays active, not failed
- LLM API error mid-stream → send `{type:"error", code:"LLM_STREAM_ERROR"}`, session stays active
- Connection drops and reconnects → client can re-open WS and request current state

**Auth on upgrade:** Cookie validation before the WebSocket handshake completes. Reject with `4001` if invalid.

---

### Step 5: Frontend — core screens

**Sequence within frontend (each screen is independently testable):**

1. **Login / Landing** (`/login`) — simplest, already designed, pure auth redirect
2. **Dashboard** (`/dashboard`) — shows the "before" state (empty streak, no kata today)
3. **Day Start** (`/start`) — mood/time selection, generates 3 options
4. **Kata Selection** (`/kata`) — pick one of 3, navigate to active view
5. **Kata Active — CODE** (`/kata/:id`) — split panel, timer, submit
6. **Kata Active — CHAT** (`/kata/:id`) — same layout, textarea instead of editor
7. **Sensei Evaluation** (`/kata/:id/eval`) — streaming chat, verdict card
8. **Results & Analysis** (`/kata/:id/result`) — post-kata debrief
9. **Kata Active — WHITEBOARD** (`/kata/:id`) — Mermaid editor (most complex, can defer)

**Whiteboard screen deferred:** The `WhiteboardPort` / Drawhaus integration adds external dependency. For Phase 0 completion, treat WHITEBOARD kata as temporarily unavailable (filter them out of `findEligible` if `WhiteboardPort` is not connected).

---

### Step 6: Admin UI

**Not on the critical path for first usable state.** The creator can insert exercises via seed script until the Admin UI is ready.

But it is needed before inviting others — the creator needs to add/edit exercises without touching the DB directly.

**Build order:**
1. Admin — Exercise List (`/admin`) — read-only first, confirms data is in DB
2. Admin — New Exercise (`/admin/exercises/new`) — create + publish
3. Admin — Edit (reuses the New Exercise form)

**Admin auth:** `CREATOR_GITHUB_ID` env var check in `requireCreator` middleware (wraps `requireAuth`).

---

### Step 7: Kamal deploy config

Last step before "done with Phase 0." The product should be end-to-end tested locally before deploying.

**What's needed:**
- `config/deploy.yml` — Kamal v2 configuration
- GitHub Environment `production` — secrets: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `GITHUB_CALLBACK_URL`
- Hetzner VPS pre-provisioned (Ubuntu, Docker, SSH key)
- Cloudflare Tunnel config (already implicit in the architecture diagram)

**Yuki's note:** The production docker-compose.yml already exists from spec 004. Kamal uses the individual Dockerfiles, not the compose file. The compose file is for local smoke testing only.

---

## Revised sprint-002 order

```
1. Seed data (content, no code)
2. GET /exercises + POST /sessions + GET /auth/me
3. Anthropic adapter (with prompt engineering)
4. POST /sessions/:id/attempts + WebSocket evaluation
5. Frontend: Login → Dashboard → Day Start → Kata Selection → Kata Active (CODE + CHAT) → Eval → Results
6. Admin UI (Exercise List + New Exercise)
7. Kamal deploy
8. Kata Active — WHITEBOARD (after the above is stable)
```

**First "creator can do one kata" checkpoint:** After step 5, screens 1–8 are wired end-to-end with a real LLM.

---

## Phase 1 — what comes after Phase 0 is working

Do not start until Phase 0 is in daily use. Priority within Phase 1:

1. **Public Profile** — lowest cost, high trust-building value
2. **Invite token system** — needed before any other user enters
3. **Share card generation** — highest social leverage, generates external visibility
4. **Leaderboard** — only meaningful once there are 3+ active users
5. **Streak badges** (`FIRST KATA`, `5 STREAK`) — quick win, add after leaderboard

---

## What to skip or defer

| Item | Current plan | Recommendation |
|---|---|---|
| WHITEBOARD kata | Sprint-002 | Defer to after core loop is stable |
| Extended Dashboard (Phase 2 analytics) | Phase 2 | Do not start until Phase 1 has real usage data |
| Cross-session LLM analysis | Phase 2 | Defer — needs a corpus of sessions to be meaningful |
| Badge full system | Phase 2 | First two badges only in Phase 1, full system in Phase 2 |
| Public landing page | Public phase | Not needed until Phase 4 or public opening decision |

---

## Provisional conclusion

The implementation sequence is clear. The critical path is:
`Seed data → HTTP routes → Anthropic adapter → WebSocket → Frontend (8 screens)`

Everything else — Admin UI, Kamal, WHITEBOARD, social features — can follow once the creator can do one kata end-to-end.

**Estimated sprint-002 "usable" checkpoint:** Steps 1–5 above.

---

## Next step

- [ ] Update `docs/sprints/current.md` to reflect this sub-sequence
- [ ] Begin with seed data (see PRD-006)
- [ ] Advance HTTP routes + WebSocket to spec (specs 009, 010)
