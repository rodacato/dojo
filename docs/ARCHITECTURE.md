# Architecture

> **Status:** Canonical · **Last reviewed:** 2026-11-02

Everything you need to understand the system before writing a line of code — the ecosystem, domain model, bounded contexts, ports, events, and key decisions.

---

## Ecosystem

Dojo and the projects around it:

```
dojo                         # this repo — the practice app you run yourself (the author's reference instance: dojo.notdefined.dev, not a service)
drawhaus.notdefined.dev      # separate repo — Excalidraw with MCP + API; dojo does not call it today
shellm (github.com/rodacato/SheLLM)  # separate repo — LLM proxy (optional)
dojocho (private, future)    # curation tool for building kata
```

Dojo consumes the LLM provider via HTTP. The user never knows what's behind the LLM endpoint — it could be the official Anthropic API, OpenAI, or SheLLM routing through CLI subscriptions.

---

## System Overview

```
[Browser]
    ↓ HTTPS (Cloudflare Tunnel)
[dojo web — React + Vite]
    ↓ WebSocket (evaluation) · SSE (session body, playground)
[Dojo API — Hono + Node.js]
    ↓                     ↓
[LLM Endpoint]      [Piston]
(any compatible)    (sandboxed code execution)
    ↓
[PostgreSQL]
```

The sensei's evaluation streams over a WebSocket; generating a session body and the playground stream over SSE ([ADR 001](adr/001-websocket-vs-sse.md)). The LLM endpoint must support streaming.

---

## Bounded Contexts

The domain is split into four contexts with explicit boundaries. Events crossing boundaries are the only coupling between them.

```
┌─────────────────────────────────────────────────────┐
│  Practice (Core Domain)                             │
│  Session · Attempt · Verdict · Timer                │
│                                                     │
│  publishes: SessionCompleted, SessionFailed         │
└──────────────────┬──────────────────────────────────┘
                   │ domain events
       ┌───────────┴────────────┐
       ▼                        ▼
┌─────────────┐        ┌─────────────────────┐
│ Recognition │        │ Content             │
│ (Supporting)│        │ (Supporting)        │
│             │        │                     │
│ Belt        │        │ Kata · Variation    │
│ Milestone   │        │ Kata catalog        │
└─────────────┘        └─────────────────────┘

┌─────────────────────┐
│ Identity (Generic)  │
│ User · GitHub auth  │
└─────────────────────┘
```

- **Practice** is the core domain — where value is created. Everything else supports it.
- **Content** provides the raw material (katas, variations) that Practice consumes.
- **Recognition** awards milestones from Practice events; belts are computed on read from session history, not event-driven.
- **Scrolls** are external apps embedded by iframe; Dojo hosts them, records progress and runs their code for signed-in users ([ADR 025](adr/025-external-embedded-scrolls.md) to [029](adr/029-scroll-conformance-suite.md)). The native Learning context was removed.
- **Identity** is generic infrastructure — user management and authentication.

---

## Domain Model

### Practice Context

Types live in `domain/practice/` (`session.ts`, `values.ts`); this section keeps only what the types cannot say.

- **Session** is the aggregate root, created when a user starts a kata. Its body is generated once and locked: refreshing shows the same kata. Attempts cannot be added after it completes or fails, and only the final attempt carries a verdict.
- **Attempt** is one exchange with the sensei, who can ask a follow-up before the verdict. `isFinalEvaluation` marks the attempt that publishes `SessionCompleted` or `SessionFailed`.
- **EvaluationResult** is a typed value, not a string, so Recognition never parses prose.

### Content Context

A **Kata** is the template and a **Variation** gives it an LLM persona (`ownerRole`, `ownerContext`); every kata has at least one. Types: `domain/content/kata.ts`.

### Recognition Context

Milestones react to events published by the Practice context, with no direct dependency on Practice code — only on the event contracts. Belts are computed from session history on read.

- **Milestone** — awarded when specific patterns in a user's session history are met
- **Belt** — rank derived from evaluated katas (any verdict), topics touched, active days and cooldown, with its dated record replayed on read and never demoted. `/belts` shows it as an illustrated room ([ADR 032](adr/032-belts-room.md)).
- **Practitioner** — a pixel avatar with a saved look; its pieces are awarded from practice history after each evaluation, never from the verdict (D66). There is no editor: the look shows on public profiles and the result receipt, where a new piece can be put on. The catalog lives in `packages/shared/src/practitioner.ts`

---

### Identity Context

- **User** — `{ id, githubId, username, avatarUrl, createdAt }`
- Auth via GitHub OAuth only

---

## Domain Events

Events published by aggregates. The only coupling between bounded contexts.

| Event | Published by | Consumed by |
|---|---|---|
| `SessionCreated` | Session | No consumer: body generation is started by the SSE route |
| `AttemptSubmitted` | Session | No consumer: evaluation is started by the WebSocket message |
| `SessionCompleted` | Session | Recognition (milestones, practitioner pieces) |
| `SessionFailed` | Session | Recognition (milestones, practitioner pieces) |
| `KataPublished` | Kata | No consumer yet |

---

## Ports & Adapters

The domain defines interfaces (ports). Infrastructure implements them (adapters). The domain never imports from infrastructure.

```
Domain / Application Layer
    ↓ calls ports (interfaces)
Infrastructure Layer
    ↓ implements adapters
External Services
```

### Ports (interfaces defined by the domain)

The interfaces live next to the aggregates and are the source of truth; this list only says where to look.

| Port | Defined in |
|---|---|
| `LLMPort`. Every method takes one params object | `domain/practice/ports.ts` |
| `SessionRepositoryPort`, `CodeExecutionPort` | `domain/practice/ports.ts` |
| `KataRepositoryPort` | `domain/content/ports.ts` |
| `UserRepositoryPort`, `UserPreferencesPort` | `domain/identity/ports.ts` |
| `MilestoneRepositoryPort` | `domain/recognition/milestone.ts` |
| `PractitionerRepositoryPort` | `domain/recognition/practitioner.ts` |
| `ScrollRepositoryPort`, `ScrollProgressPort`, `ScrollCodeRunnerPort` | `domain/scrolls/ports.ts` |
| `EventBusPort` — in-memory today, upgradeable to Redis/BullMQ if events must cross processes | `domain/shared/events.ts` |

### Adapters (infrastructure implementations)

| Port | Adapter | Notes |
|---|---|---|
| `LLMPort` | `AnthropicStreamAdapter`, `OpenAIStreamAdapter` | Picked by `LLM_ADAPTER_FORMAT` |
| `LLMPort` | `MockLLMAdapter` | Default and test adapter — deterministic, no API calls |
| `CodeExecutionPort` | `PistonAdapter` | When `FF_CODE_EXECUTION_ENABLED`; otherwise `MockExecutionAdapter` |
| `EventBusPort` | `InMemoryEventBus` | Synchronous, in-process |

Every repository port has a `Postgres*Repository` under `infrastructure/persistence/`.

### Not built: Drawhaus integration

There is no `WhiteboardPort` or Drawhaus client. `whiteboard` katas are answered as a Mermaid diagram in the editor. `DRAWHAUS_URL` in `config.ts` is read by nothing.

---

## Application Layer (Use Cases)

Use cases orchestrate domain objects and call ports. They do not contain business logic — that lives in the aggregates.

One class per use case under `apps/api/src/application/<context>/` (for example `StartSession`, `SubmitAttempt`, `GetKataOptions`); read the class for its exact inputs. `SubmitAttempt` streams the evaluation, adds the `Attempt` to the `Session`, and on a final evaluation publishes `SessionCompleted` or `SessionFailed`.

---

## Infrastructure Layer

Hono routes are thin adapters — they parse the HTTP request, call the use case, and return the response. No business logic in routes.

```
apps/api/
  src/
    domain/          ← aggregates, entities, value objects, port interfaces
    application/     ← use cases
    infrastructure/  ← adapters (Hono routes, Postgres repos, LLM client, event bus)
```

---

## Auth

GitHub OAuth only. The `UserRepositoryPort` adapter handles user creation/lookup on the OAuth callback; session details are in [SECURITY.md](../SECURITY.md#session-security).

---

## LLM Integration

Dojo talks to a single configurable endpoint via the `LLMPort`. The adapter handles provider differences — the domain only sees the port interface.

Configured with the `LLM_*` variables described in the [README](../README.md#connect-a-real-sensei).

**Streaming contract:** the adapter streams tokens to the use case, which forwards them over the WebSocket. The final message carries the complete `EvaluationResult`. The wire messages are in `infrastructure/http/routes/ws-handlers.ts`.

**Error handling:** if the stream errors mid-response, the WebSocket handler records the attempt as incomplete. The session stays active and the user can resubmit: a stream error is not a session failure. A per-attempt stream cache replays tokens to a reconnecting browser ([ADR 009](adr/009-websocket-stream-cache-reconnect.md)); the submitted answer waits in memory meanwhile ([ADR 008](adr/008-pending-attempts-memory-bridge.md)), so a restart loses it.

**Variations are replaced, not versioned:** editing a kata deletes and reinserts its variations. Sessions already started keep their locked body, so nothing in flight changes.

---

## Key Design Decisions

**`body` lives in Session, not Variation.**
The kata is the template. The session is the instance. The body is generated once at session creation and locked. Refreshing the page always shows the same kata.

**Today's kata is fixed per learner and day, on the server** ([ADR 031](adr/031-surprise-daily-kata.md)). Only a session started from the daily entry (`sessions.is_daily`) makes or completes today's kata. Choose a kata ([ADR 034](adr/034-choose-a-kata.md)) remembers its last duration, type and language in the browser only, and never offers today's kata.

**Hard attempt cap, enforced in the aggregate.**
The sensei decides when it has enough to evaluate and can ask follow-up questions before giving a final verdict, mirroring real technical discussions — but the conversation is bounded by `MAX_ATTEMPTS`, a named constant in `Session`. The aggregate's `addAttempt` throws `AttemptLimitReachedError` once that many attempts have been recorded, so the cap is a domain invariant, not just prompt guidance.

**The sensei evaluates the process, not the answer.**
Evaluation focuses on reasoning, tradeoffs identified, and communication — not whether the solution was optimal. This is enforced in the prompt architecture, not in application code.

**No repeat katas within 6 months.**
Enforced in `KataRepositoryPort.findEligible()` — the exclusion window is a query concern, not a domain invariant.

**Katas are multi-language by default.**
A developer should be able to reason about Ruby even if they primarily write TypeScript. A kata can be language-agnostic.

**`InMemoryEventBus`.**
Simple, synchronous, in-process. No infrastructure dependency. Upgradeable to Redis/BullMQ when cross-process event delivery becomes necessary.

---

## Kata Types

### code
Split-panel view. Left: context and requirements. Right: code editor (no autocomplete — honor code). The sensei reviews the submitted code.

### chat
Technical roleplay. The sensei takes a role (tech lead, PM with an ambiguous requirement, a junior asking for help) and the user responds as they would in real life. Evaluated on reasoning and communication.

### whiteboard
System design and architecture, answered as a Mermaid diagram in the editor. The sensei evaluates the proposal — not the perfect solution, but what the user considered, what they missed, and why.

### review
Rubric-graded katas (PRD-027). The learner writes prose, and the sensei evaluates it against a structured `Rubric` rather than running a generic code evaluation. When a `rubric` is present, the `LLMPort.evaluate` adapter switches to the review prompt variant.

A review kata with starter code may carry an answer key in `rubric.answer`, which fixes how the learner answers. `point`: tap the faulty line, then say why. `predict`: write what the snippet prints, then say why. The API composes the stored answer text and computes the deterministic part (the line, or whether the normalized output matches exactly), and the sensei grades the why against it. The key and the real output stay hidden until the final verdict. A predict kata's output is checked against real Piston by `PistonAdapter.integration.test.ts`, not at seed time.

**Every type may carry a hidden rubric.** For code, chat and whiteboard kata it reaches the sensei as `guide`, a reference answer plus the points it must cover; the generic prompt stays the same without one. Test results reach the sensei as `testResults`, apart from the learner's text, so an answer cannot forge them. One block of grading rules in `prompts/sensei.ts` is shared by every graded prompt ([research](research/KATA_TYPES.md#how-the-sensei-should-grade)).

**The kata is leveled to the learner.** A session stores the learner's level (junior, mid, senior) from their preferences when it starts. The session-body prompt uses it to decide how much to specify — a senior body leaves out constraints and trade-offs to name and defend — and the generic grading prompt grades against that level's bar. A session with no level behaves as before. Review kata are unaffected: their body is the authored description.

