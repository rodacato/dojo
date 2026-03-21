# Architecture

Everything you need to understand the system before writing a line of code — the ecosystem, domain model, bounded contexts, ports, events, and key decisions.

---

## Ecosystem

Four services, two public, two private:

```
dojo.notdefined.dev          # this repo — the practice platform
drawhaus.notdefined.dev      # separate repo — Excalidraw with MCP + API
shellm (github.com/rodacato/SheLLM)  # separate repo — LLM proxy (optional)
dojocho (private, future)    # curation tool for building kata
```

Dojo consumes Drawhaus and the LLM provider via HTTP. The user never knows what's behind the LLM endpoint — it could be the official Anthropic API, OpenAI, or SheLLM routing through CLI subscriptions.

---

## System Overview

```
[Browser]
    ↓ HTTPS (Cloudflare Tunnel)
[dojo.notdefined.dev — React + Vite]
    ↓ WebSocket (sensei streams in real time)
[Dojo API — Hono + Node.js]
    ↓                     ↓
[LLM Endpoint]      [Drawhaus API]
(any compatible)    (whiteboard kata)
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
│ Badge       │        │ Exercise · Variation│
│ Streak      │        │ Kata catalog        │
│ ShareCard   │        │                     │
└─────────────┘        └─────────────────────┘

┌─────────────────────┐
│ Identity (Generic)  │
│ User · GitHub auth  │
└─────────────────────┘
```

- **Practice** is the core domain — where value is created. Everything else supports it.
- **Content** provides the raw material (exercises, variations) that Practice consumes.
- **Recognition** reacts to Practice events to update badges, streaks, and generate share cards.
- **Identity** is generic infrastructure — user management and authentication.

---

## Domain Model

### Practice Context

**Session** — Aggregate Root

The central concept. Created when a user picks a kata. Once created, the exercise body is generated and locked — it never changes. The user committed; there is no escape.

```typescript
class Session {
  id: SessionId
  userId: UserId
  exerciseId: ExerciseId
  variationId: VariationId
  body: string               // generated at creation, immutable
  status: SessionStatus      // "active" | "completed" | "failed"
  attempts: Attempt[]        // max 3 exchanges before forced verdict
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

**Exercise** — Aggregate Root

The template. Created by the owner, published manually or via Dojocho (future). The template is immutable once published — variations handle persona/context changes.

```typescript
class Exercise {
  id: ExerciseId
  title: string
  description: string        // shown to the user
  duration: number           // minutes
  difficulty: Difficulty     // "easy" | "medium" | "hard"
  category: string
  type: ExerciseType         // "code" | "chat" | "whiteboard"
  status: ExerciseStatus     // "draft" | "published" | "archived"
  language: string[]         // ["ruby", "typescript", "agnostic", ...]
  tags: string[]
  topics: string[]           // areas covered, used in "topics to review"
  variations: Variation[]    // at least one
  createdBy: UserId
  createdAt: Date
}
```

**Variation** — Entity (child of Exercise)

At least one per exercise. Allows the same exercise to have different LLM personas or contexts, adding variability without duplication.

```typescript
class Variation {
  id: VariationId
  exerciseId: ExerciseId
  ownerRole: string          // "Senior DBA with 12 years in PostgreSQL"
  ownerContext: string       // technical briefing for the LLM
  createdAt: Date
}
```

---

### Recognition Context

Reacts to events published by the Practice context. Has no direct dependency on Practice code — only on the event contracts.

- **Badge** — awarded when specific patterns in a user's session history are met
- **Streak** — days with at least one completed session
- **ShareCard** — generated on `SessionCompleted`, carries the verdict and a memorable line from the analysis

---

### Identity Context

- **User** — `{ id, githubId, username, avatarUrl, createdAt }`
- Auth via GitHub OAuth only, shared with Drawhaus via cross-service session token

---

## Domain Events

Events published by aggregates. The only coupling between bounded contexts.

| Event | Published by | Consumed by |
|---|---|---|
| `SessionCreated` | Session | (internal — triggers body generation) |
| `AttemptSubmitted` | Session | (internal — triggers sensei evaluation) |
| `EvaluationCompleted` | Session | (internal — checks for final verdict) |
| `SessionCompleted` | Session | Recognition (badge, streak, share card) |
| `SessionFailed` | Session | Recognition (streak reset check) |
| `ExercisePublished` | Exercise | Content catalog query cache invalidation |
| `BadgeEarned` | Recognition | (future: notification context) |

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

```typescript
// Sensei evaluation — primary port for LLM integration
interface LLMPort {
  evaluate(
    ownerRole: string,
    ownerContext: string,
    sessionBody: string,
    conversationHistory: ConversationTurn[],
  ): AsyncIterator<EvaluationToken>
}

// Persistence ports
interface SessionRepositoryPort {
  save(session: Session): Promise<void>
  findById(id: SessionId): Promise<Session | null>
  findActiveByUserId(userId: UserId): Promise<Session | null>
}

interface ExerciseRepositoryPort {
  findEligible(userId: UserId, filters: ExerciseFilters): Promise<Exercise[]>
  findById(id: ExerciseId): Promise<Exercise | null>
  save(exercise: Exercise): Promise<void>
}

interface UserRepositoryPort {
  findByGithubId(githubId: string): Promise<User | null>
  save(user: User): Promise<void>
}

// Whiteboard integration (whiteboard kata type)
interface WhiteboardPort {
  createBoard(): Promise<BoardId>
  getBoard(id: BoardId): Promise<Board>
}

// Event bus — in-memory for Phase 0, upgradeable to Redis/BullMQ
interface EventBusPort {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void
}
```

### Adapters (infrastructure implementations)

| Port | Adapter | Notes |
|---|---|---|
| `LLMPort` | `AnthropicStreamAdapter` | Primary; also supports OpenAI-compatible endpoints |
| `LLMPort` | `MockLLMAdapter` | Used in tests — deterministic, no API calls |
| `SessionRepositoryPort` | `PostgresSessionRepository` | Primary persistence |
| `ExerciseRepositoryPort` | `PostgresExerciseRepository` | Includes eligibility filter (6-month window) |
| `UserRepositoryPort` | `PostgresUserRepository` | |
| `WhiteboardPort` | `DrawhausHttpClient` | HTTP client for Drawhaus API |
| `EventBusPort` | `InMemoryEventBus` | Phase 0; synchronous, in-process |

---

## Application Layer (Use Cases)

Use cases orchestrate domain objects and call ports. They do not contain business logic — that lives in the aggregates.

```typescript
// Practice context use cases
StartSession(userId, mood, duration)          → Session
  → calls ExerciseRepositoryPort.findEligible()
  → generates body via LLMPort
  → saves via SessionRepositoryPort
  → publishes SessionCreated

SubmitAttempt(sessionId, userResponse)        → AsyncIterator<EvaluationToken>
  → loads Session via SessionRepositoryPort
  → streams evaluation via LLMPort
  → on EvaluationResult received:
      → adds Attempt to Session
      → if isFinalEvaluation: publishes SessionCompleted or SessionFailed
      → saves Session

GetExerciseOptions(userId, mood, duration)    → Exercise[]
  → calls ExerciseRepositoryPort.findEligible() with 6-month exclusion window
```

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

GitHub OAuth only, shared across Dojo and Drawhaus. When a user authenticates with Dojo, the session token can be passed to Drawhaus for seamless whiteboard integration without a second login. The `UserRepositoryPort` adapter handles user creation/lookup on OAuth callback.

---

## LLM Integration

Dojo talks to a single configurable endpoint via the `LLMPort`. The adapter handles provider differences — the domain only sees the port interface.

```env
LLM_BASE_URL=https://api.anthropic.com
LLM_API_KEY=your_key_here
LLM_MODEL=claude-sonnet-4-20250514
```

**Streaming contract:** The adapter streams `EvaluationToken` chunks to the use case, which forwards them over the WebSocket to the browser. The final token carries the complete `EvaluationResult` — not just a string, but a structured object with `verdict`, `analysis`, and `topicsToReview`.

**Error handling:** If the stream errors mid-response, the adapter closes gracefully and the use case marks the attempt as incomplete. The session remains active — the user can resubmit. A stream error is not a session failure.

**Prompt versioning:** The `ownerRole` and `ownerContext` fields on Variation are the versioned prompt inputs. A change to these fields on an existing variation creates a new variation — it does not mutate the existing one, since active sessions may be using it.

---

## Key Design Decisions

**`body` lives in Session, not Variation.**
The exercise is the template. The session is the instance. The body is generated once at session creation and locked. Refreshing the page always shows the same exercise.

**Mood and time are filters, not persisted data.**
Query parameters that filter available exercises — not saved to the database. No complexity, no tracking, no inferred behavior. Honor code.

**No fixed attempt counter — the sensei decides.**
The sensei determines when it has enough to evaluate. It can ask follow-up questions (max 2 exchanges) before giving a final verdict. This mirrors real technical discussions.

**The sensei evaluates the process, not the answer.**
Evaluation focuses on reasoning, tradeoffs identified, and communication — not whether the solution was optimal. This is enforced in the prompt architecture, not in application code.

**No repeat exercises within 6 months.**
Enforced in `ExerciseRepositoryPort.findEligible()` — the exclusion window is a query concern, not a domain invariant.

**Exercises are multi-language by default.**
A developer should be able to reason about Ruby even if they primarily write TypeScript. Exercises can specify `language: ["agnostic"]` for language-independent scenarios.

**`InMemoryEventBus` for Phase 0.**
Simple, synchronous, in-process. No infrastructure dependency. Upgradeable to Redis/BullMQ when cross-process event delivery becomes necessary (Phase 2+).

---

## Exercise Types

### code
Split-panel view. Left: context and requirements. Right: code editor (no autocomplete — honor code). The sensei reviews the submitted code.

### chat
Technical roleplay. The sensei takes a role (tech lead, PM with an ambiguous requirement, a junior asking for help) and the user responds as they would in real life. Evaluated on reasoning and communication.

### whiteboard
System design and architecture. The user works in an embedded Drawhaus instance via the `WhiteboardPort`. The sensei evaluates the proposal — not the perfect solution, but what the user considered, what they missed, and why they made the choices they did.

---

## Content Sources

Kata come from:
- The creator's past work: real refactors, architecture decisions, production incidents
- Design patterns with real-world context applied
- Reddit / Hacker News technical scenarios
- Past interviews and the creator's own interview history
- Classic katas with language or domain variations
- Stack Overflow and technical blog posts
- Contributions from invited users (require creator approval or LLM QA gate — Phase 3)

Quality bar: every exercise should leave the user feeling they practiced or learned something, even if they failed. Wasted time is the one failure mode the product cannot afford.
