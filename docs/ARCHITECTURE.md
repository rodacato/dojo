# Architecture

> **Status:** Canonical · **Last reviewed:** 2026-10-15

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
    ↓ WebSocket (sensei streams in real time)
[Dojo API — Hono + Node.js]
    ↓                     ↓
[LLM Endpoint]      [Piston]
(any compatible)    (sandboxed code execution)
    ↓
[PostgreSQL]
```

WebSockets are used for the sensei evaluation flow — tokens stream from the LLM through the API to the browser in real time. Hono has native WebSocket support. The LLM endpoint must support streaming.

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
- **Scrolls** are not a bounded context in Dojo. The native Learning context was removed (ADR 025); scrolls are being rebuilt as external apps embedded by iframe, with Dojo as a minimal host (epic [#116](https://github.com/rodacato/dojo/issues/116)).
- **Identity** is generic infrastructure — user management and authentication.

---

## Domain Model

### Practice Context

**Session** — Aggregate Root

The central concept. Created when a user picks a kata. Once created, the kata body is generated and locked — it never changes. The user committed; there is no escape.

```typescript
class Session {
  id: SessionId
  userId: UserId
  kataId: KataId
  variationId: VariationId
  body: string               // generated at creation, immutable
  status: SessionStatus      // "preparing" | "active" | "completed" | "failed"
  attempts: Attempt[]        // capped at MAX_ATTEMPTS (2) before forced verdict
  startedAt: Date
  completedAt: Date | null

  // Invariants enforced by the aggregate:
  // - body cannot be regenerated after creation
  // - attempts cannot be added after status is completed or failed
  // - only the final attempt carries a Verdict
}
```

**Attempt** — Entity (child of Session)

One exchange in the evaluation conversation. The sensei can ask follow-up questions before giving a final verdict. `isFinalEvaluation: true` marks the row that triggers `SessionCompleted` or `SessionFailed`.

```typescript
class Attempt {
  id: AttemptId
  sessionId: SessionId
  userResponse: string
  evaluation: EvaluationResult | null  // null while streaming
  isFinalEvaluation: boolean
  submittedAt: Date
}
```

**EvaluationResult** — Value Object

Structured output from the sensei. Not a raw string — a typed object that the Recognition context can consume without parsing.

```typescript
interface EvaluationResult {
  verdict: "passed" | "passed_with_notes" | "needs_work"
  analysis: string           // the sensei's full written evaluation
  topicsToReview: string[]   // used on the results screen and dashboard
  followUpQuestion: string | null  // null on final evaluation
}
```

**Verdict** — Value Object

```typescript
type Verdict = "passed" | "passed_with_notes" | "needs_work"
```

---

### Content Context

**Kata** — Aggregate Root

The template. Created by the owner, published manually or via Dojocho (future). The template is immutable once published — variations handle persona/context changes.

```typescript
class Kata {
  id: KataId
  title: string
  description: string        // shown to the user
  duration: number           // minutes
  difficulty: Difficulty     // "easy" | "medium" | "hard"
  category: string
  type: KataType         // "code" | "chat" | "whiteboard" | "review"
  status: KataStatus     // "draft" | "published" | "archived"
  language: string[]         // ["ruby", "typescript", "agnostic", ...]
  tags: string[]
  topics: string[]           // areas covered, used in "topics to review"
  variations: Variation[]    // at least one
  createdBy: UserId
  createdAt: Date
}
```

**Variation** — Entity (child of Kata)

At least one per kata. Allows the same kata to have different LLM personas or contexts, adding variability without duplication.

```typescript
class Variation {
  id: VariationId
  kataId: KataId
  ownerRole: string          // "Senior DBA with 12 years in PostgreSQL"
  ownerContext: string       // technical briefing for the LLM
  createdAt: Date
}
```

---

### Recognition Context

Milestones react to events published by the Practice context, with no direct dependency on Practice code — only on the event contracts. Belts are computed from session history on read.

- **Milestone** — awarded when specific patterns in a user's session history are met
- **Belt** — rank derived from evaluated katas (any verdict), topics touched, active days and cooldown ([ADR 020](adr/020-ubiquitous-language-pass.md))
- **Practitioner** — a pixel avatar with a saved look; its pieces are awarded from practice history after each evaluation, never from the verdict (D66). The catalog lives in `packages/shared/src/practitioner.ts`

---

### Identity Context

- **User** — `{ id, githubId, username, avatarUrl, createdAt }`
- Auth via GitHub OAuth only

---

## Domain Events

Events published by aggregates. The only coupling between bounded contexts.

| Event | Published by | Consumed by |
|---|---|---|
| `SessionCreated` | Session | (internal — triggers body generation) |
| `AttemptSubmitted` | Session | (internal — triggers sensei evaluation) |
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
| `LLMPort` — `evaluate`, `generateSessionBody`, `generateSessionBodyStream`, `askSensei`. Every method takes one params object | `domain/practice/ports.ts` |
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
| `SessionRepositoryPort` | `PostgresSessionRepository` | |
| `KataRepositoryPort` | `PostgresKataRepository` | Includes the eligibility filter (6-month window) |
| `UserRepositoryPort` | `PostgresUserRepository` | |
| `EventBusPort` | `InMemoryEventBus` | Synchronous, in-process |

### Not built: Drawhaus integration

There is no `WhiteboardPort` or Drawhaus client. `whiteboard` katas are answered as a Mermaid diagram in the editor. `DRAWHAUS_URL` is declared in `apps/api/src/config.ts` but nothing reads it: dead config, kept pending the owner's decision on the integration.

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

**Streaming contract:** The adapter streams `EvaluationToken` chunks to the use case, which forwards them over the WebSocket to the browser. The final token carries the complete `EvaluationResult` — not just a string, but a structured object with `verdict`, `analysis`, and `topicsToReview`.

**Error handling:** If the stream errors mid-response, the adapter closes gracefully and the use case marks the attempt as incomplete. The session remains active — the user can resubmit. A stream error is not a session failure.

**Prompt versioning:** The `ownerRole` and `ownerContext` fields on Variation are the versioned prompt inputs. A change to these fields on an existing variation creates a new variation — it does not mutate the existing one, since active sessions may be using it.

---

## Key Design Decisions

**`body` lives in Session, not Variation.**
The kata is the template. The session is the instance. The body is generated once at session creation and locked. Refreshing the page always shows the same kata.

**Mood and time are filters, not persisted data.**
Query parameters that filter available katas — not saved to the database. No complexity, no tracking, no inferred behavior. Honor code.

**Hard attempt cap, enforced in the aggregate.**
The sensei decides when it has enough to evaluate and can ask follow-up questions before giving a final verdict, mirroring real technical discussions — but the conversation is bounded by `MAX_ATTEMPTS` (currently `2`), a named constant in `Session`. The aggregate's `addAttempt` throws `AttemptLimitReachedError` once that many attempts have been recorded, so the cap is a domain invariant, not just prompt guidance.

**The sensei evaluates the process, not the answer.**
Evaluation focuses on reasoning, tradeoffs identified, and communication — not whether the solution was optimal. This is enforced in the prompt architecture, not in application code.

**No repeat katas within 6 months.**
Enforced in `KataRepositoryPort.findEligible()` — the exclusion window is a query concern, not a domain invariant.

**Katas are multi-language by default.**
A developer should be able to reason about Ruby even if they primarily write TypeScript. Katas can specify `language: ["agnostic"]` for language-independent scenarios.

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

---

## Content Sources

Kata come from:
- The creator's past work: real refactors, architecture decisions, production incidents
- Design patterns with real-world context applied
- Reddit / Hacker News technical scenarios
- Past interviews and the creator's own interview history
- Classic katas with language or domain variations
- Stack Overflow and technical blog posts
- Contributions from invited users (would require creator approval or an LLM QA gate)

Quality bar: every kata should leave the user feeling they practiced or learned something, even if they failed. Wasted time is the one failure mode the product cannot afford.
