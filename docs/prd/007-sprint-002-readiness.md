# PRD-007: Sprint-002 Readiness — Consolidated Decisions

> **Status:** confirmed
> **Date:** 2026-03-21
> **Author:** Claude — consolidated from PRDs 001–005 + full panel review (PRD-005)

---

## Idea in one sentence

Everything PRDs 001–005 explored has been reviewed by the expert panel — this document is the output: confirmed decisions, resolved questions, open items that need owner input, and a spec outline ready to implement.

---

## Confirmed decisions — no further discussion needed

These are settled. Do not reopen unless something breaks in implementation.

| # | Decision | Source | Notes |
|---|---|---|---|
| 1 | "No skip, no reroll, no pause" is the product | PRD-005/Priya | Sacred constraint — do not soften |
| 2 | Any completed session counts toward streak | PRD-005/Priya | `needs_work` counts — showing up matters |
| 3 | `is_creator` = `CREATOR_GITHUB_ID` env var in Phase 0 | PRD-002/Tomás | Add DB column in Phase 1 |
| 4 | WHITEBOARD kata deferred from sprint-002 | PRD-003/Tomás | Connect Drawhaus in Phase 1 |
| 5 | Phase 0 schema: no new tables needed | PRD-001/Amara | All data derivable from existing 6 tables |
| 6 | Mood and duration are query params only — never persisted | PRD-001/Darius | Intentional — document as ADR |
| 7 | Session body generation is synchronous in `POST /sessions` | PRD-002 | Acceptable latency for Phase 0 |
| 8 | MockLLMAdapter must simulate streaming | PRD-004 | Env vars: `MOCK_LLM_STREAM_DELAY_MS`, `MOCK_LLM_VERDICT`, `MOCK_LLM_RESPONSE_TOKENS` |
| 9 | WebSocket reconnect message: `{type:"reconnect", attemptId}` | PRD-005/Tomás | Server caches partial response 60s |
| 10 | Server-side timer enforcement | PRD-005/Tomás | `submittedAt > startedAt + duration * 1.1` → 408 Session Expired |
| 11 | One active WS connection per user | PRD-005/Marta | Reject with `4008 Policy Violation` if concurrent |
| 12 | Code editor: **CodeMirror 6** | PRD-005/Tomás | Disable autocomplete, autocorrect, spell check |
| 13 | Dashboard today card detects active session | PRD-005/Soren | Navigate to session directly, skip Day Start flow |
| 14 | "+N positions" stat removed from Results screen (Phase 0) | PRD-005/Soren | Replace with "Your Xth kata this month" |
| 15 | Admin UI Phase 0: Exercises section only | PRD-005/Soren | Others rendered as disabled skeleton |
| 16 | Seed exercises use deterministic UUIDs (v5) | PRD-006 | Reproducible across environments, safe to re-run |
| 17 | Prompt engineering before wiring the WebSocket | PRD-005/Yemi | Test 3 variations in `scripts/test-llm.ts` first |
| 18 | `topicsToReview` must be specific technical concepts | PRD-005/Yemi | Explicit prompt instruction required |
| 19 | Sensei follow-up: LLM decides, 2-exchange hard limit | PRD-003 | Default: no follow-up if submission is clearly good/bad |
| 20 | Structured output: prose stream + final `<evaluation>` JSON block | PRD-003/Yemi | Adapter strips tags before forwarding tokens |

---

## Open questions — resolved 2026-03-21

| Question | Decision |
|---|---|
| Does mood filter affect difficulty/type (not just duration)? | ✅ Yes — `low_energy` → bias EASY/CHAT, `focused` → allows HARD, `regular` → no bias |
| `avg_score` in Admin: passed only or passed + passed_with_notes? | ✅ `(passed + passed_with_notes) / total` |
| `topics[]` on Exercise: who defines the vocabulary? | ✅ Canonical slugs defined in `packages/shared` before seed script runs |

---

## Pre-implementation checklist

Before writing any sprint-002 code:

- [ ] **Owner decision:** Does mood filter affect exercise difficulty/type?
- [ ] **Owner decision:** `avg_score` definition for admin stats
- [ ] **Write `scripts/test-llm.ts`** — standalone prompt tester (before AnthropicStreamAdapter)
- [ ] **Test 3 system prompt variations**, compare side-by-side output
- [ ] **Pick winning prompt** — commit to `apps/api/src/prompts/sensei.ts`

---

## Critical path (sprint-002 build order)

```
Seed data → HTTP routes → Prompt engineering → Anthropic adapter → WebSocket → Frontend (8 screens)
```

Each step unlocks the next. Admin UI and Kamal deploy are off the critical path.

### Step 1 — Seed data (spec 012)

No code depends on this being done first, but all testing does. Do it first.

- `apps/api/src/infrastructure/persistence/seed.ts`
- 8 exercises from PRD-006, 2 variations each
- Idempotent (upsert, not insert)
- Seed validation function: non-empty fields, at least 1 variation per exercise

### Step 2 — HTTP routes (spec 009)

Three routes unlock the entire loop:

| Route | Use case | Auth |
|---|---|---|
| `GET /exercises` | `FindEligibleExercises` | `requireAuth` |
| `POST /sessions` | `StartSession` | `requireAuth` |
| `GET /sessions/:id` | `GetSession` | `requireAuth`, own session only |
| `POST /sessions/:id/attempts` | `SubmitAttempt` | `requireAuth`, own session only |
| `GET /auth/me` | Return current user | `requireAuth` |
| `GET /dashboard` | `GetDashboard` | `requireAuth` |

### Step 3 — Anthropic streaming adapter (spec 011)

**Write `scripts/test-llm.ts` first.** The adapter is not done until the prompt is tested.

```typescript
interface LLMPort {
  evaluate(
    ownerRole: string,
    ownerContext: string,
    sessionBody: string,
    userResponse: string,
    conversationHistory: ConversationTurn[]
  ): AsyncIterator<EvaluationToken>
}
```

Output contract:
- Raw prose tokens streamed to client
- Final `<evaluation>` block stripped by adapter, parsed into `EvaluationResult`
- `isFinalEvaluation: true` when sensei delivers verdict

### Step 4 — WebSocket evaluation flow (spec 010)

Full message protocol:

```
Client connects (cookie) → {type:"ready"}
Client {type:"submit", attemptId} → {type:"token"} ×N → {type:"evaluation", result} → {type:"complete", isFinal}
Client {type:"reconnect", attemptId} → resumes from cached partial response (60s window)
Error: {type:"error", code:"LLM_STREAM_ERROR"|"SESSION_NOT_FOUND"|"ATTEMPT_LIMIT_REACHED"}
```

Key enforcement:
- Auth validated on upgrade, not first message
- One active WS per user (4008 on concurrent)
- Server-side timer enforcement in `SubmitAttempt` use case

### Step 5 — Frontend (spec 013)

8 screens in order:

1. Login / Landing (`/login`)
2. Dashboard (`/dashboard`) — streak, today card, recent activity
3. Day Start (`/start`) — mood + duration selector → 3 exercises
4. Kata Selection (`/kata`) — pick one of 3
5. Kata Active — CODE (`/kata/:id`) — CodeMirror 6, countdown, submit
6. Kata Active — CHAT (`/kata/:id`) — textarea, word count, countdown
7. Sensei Evaluation (`/kata/:id/eval`) — streaming, verdict card
8. Results & Analysis (`/kata/:id/result`) — verdict, topics, share preview

### Step 6 — Admin UI (spec 014)

- Exercise List: table with sessionCount and avgScore derived queries
- New Exercise form: multi-field, chip input for topics/languages/tags
- `requireCreator` middleware wrapping `requireAuth` + `CREATOR_GITHUB_ID` check
- Other sections: rendered as disabled skeleton with "coming in Phase 1" labels

### Step 7 — Kamal deploy (spec 015)

Last step. Do not start until the full loop works locally.

- `config/deploy.yml` (Kamal v2)
- GitHub Environment `production` secrets
- VPS pre-provisioned (Ubuntu, Docker, SSH key)
- Cloudflare Tunnel config

---

## Spec outline

| Spec | Title | Priority | Depends on |
|---|---|---|---|
| 009 | HTTP routes | Critical path | Seed data |
| 010 | WebSocket evaluation | Critical path | HTTP routes + Anthropic adapter |
| 011 | Anthropic streaming adapter | Critical path | Prompt engineering (scripts/test-llm.ts) |
| 012 | Seed data | First | Nothing |
| 013 | Frontend — core screens | Critical path | All backend specs |
| 014 | Admin UI | Off critical path | HTTP routes |
| 015 | Kamal deploy | Last | Full loop working locally |

---

## What was explicitly validated as strong

From PRD-005 panel review — these do not need adjustment:

- **Auth implementation** (PKCE, no stored tokens, HttpOnly cookies, DB-validated sessions) — Marta: already correct
- **Domain model** (`Session` aggregate, `Attempt` child, bounded contexts) — Darius: correct and will hold
- **WebSocket HTTP+WS separation** (HTTP command, WebSocket stream) — Tomás: right architecture
- **Invite-only framing** — frame as "we want practitioners, not tourists" — Amara: brand asset
- **Streak reset on miss** (no grace day for now) — Priya: consistent with "showing up" philosophy
- **Leaderboard footer copy** "Consistency compounds." — Amara: do not change

---

## Risk register

| Risk | Owner | Mitigation |
|---|---|---|
| Prompt quality doesn't meet bar | Yemi's lens | Test 3 variations before wiring WS; monitor verdict distribution |
| WS reconnection missed in implementation | Tomás's lens | Add integration test: drop connection mid-stream, reconnect, verify resume |
| `topics[]` vocabulary drift between seed data and LLM output | Darius's lens | Define canonical topic slugs in `packages/shared` before seed |
| Timer enforcement off by edge cases | Hiroshi's lens | Unit test with `vi.useFakeTimers()` in use case test |
| Mood filter is cosmetic (no real filtering) | Priya's lens | Owner decision required before implementing `findEligible()` |

---

## Next step

- [ ] Owner: answer the 3 open questions above
- [ ] Write `scripts/test-llm.ts` (Yemi: highest-risk item in sprint)
- [ ] Begin with spec 012 (seed data) — no decisions needed, unblocks everything
- [ ] Advance specs 009 and 010 to implementation once prompt is tested
