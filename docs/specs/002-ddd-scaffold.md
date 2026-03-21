# Spec 002 — DDD Scaffold

**Experts:** Darius Osei (domain model), Tomás Ríos (infrastructure wiring)
**Depends on:** Phase 1 (tooling)
**Blocks:** Phase 3 (database), Phase 5 (security), Phase 6 (OAuth)

## What and Why

Restructure `apps/api/src/` from a flat file into three clean layers: **domain**, **application**, and **infrastructure**. No feature code yet — only the structural skeleton, port interfaces, aggregates, value objects, and the composition root.

Everything built after this phase plugs into this structure. Getting the boundaries right now prevents the rewrites that come from getting them wrong later.

## Scope

**In:** folder structure, domain layer (aggregates, ports, events, value objects), application layer (use cases), infrastructure stubs (InMemoryEventBus, MockLLMAdapter, router, container), index.ts refactor
**Out:** database repositories (Phase 3), OAuth routes (Phase 6), rate limiting (Phase 5), WebSocket streaming (later), any UI

---

## Layer Rules (non-negotiable)

```
domain/     ← zero external imports. Pure TypeScript. No Hono, no Drizzle, no Zod.
application/ ← imports from domain/ only (via port interfaces). No Hono, no Drizzle.
infrastructure/ ← imports from application/ and domain/. Implements port interfaces.
                  Hono routes, Drizzle repos, LLM client live here.
```

`import/no-cycle` in ESLint catches violations mechanically. If the linter passes, the boundaries are clean.

---

## Domain Layer

### `src/domain/shared/types.ts`

Branded ID types. Prevents passing the wrong ID type at compile time.

```ts
type Brand<T, B> = T & { readonly _brand: B }

export type SessionId   = Brand<string, 'SessionId'>
export type UserId      = Brand<string, 'UserId'>
export type ExerciseId  = Brand<string, 'ExerciseId'>
export type VariationId = Brand<string, 'VariationId'>
export type AttemptId   = Brand<string, 'AttemptId'>

export const SessionId   = (id: string): SessionId   => id as SessionId
export const UserId      = (id: string): UserId       => id as UserId
export const ExerciseId  = (id: string): ExerciseId  => id as ExerciseId
export const VariationId = (id: string): VariationId => id as VariationId
export const AttemptId   = (id: string): AttemptId   => id as AttemptId
```

### `src/domain/shared/errors.ts`

```ts
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class SessionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Session not found: ${id}`, 'SESSION_NOT_FOUND')
  }
}

export class SessionAlreadyCompletedError extends DomainError {
  constructor(id: string) {
    super(`Session is already completed or failed: ${id}`, 'SESSION_ALREADY_COMPLETED')
  }
}

export class ExerciseNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Exercise not found: ${id}`, 'EXERCISE_NOT_FOUND')
  }
}

export class NoEligibleExercisesError extends DomainError {
  constructor() {
    super('No eligible exercises found for the given filters', 'NO_ELIGIBLE_EXERCISES')
  }
}
```

### `src/domain/shared/events.ts`

```ts
export interface DomainEvent {
  readonly type: string
  readonly aggregateId: string
  readonly occurredAt: Date
}
```

---

### `src/domain/practice/values.ts`

```ts
export type SessionStatus = 'active' | 'completed' | 'failed'
export type Verdict = 'passed' | 'passed_with_notes' | 'needs_work'

export interface EvaluationResult {
  readonly verdict: Verdict
  readonly analysis: string
  readonly topicsToReview: string[]
  readonly followUpQuestion: string | null  // null on final evaluation
}

export interface EvaluationToken {
  readonly chunk: string             // streamed text fragment
  readonly isFinal: boolean          // true on the last token
  readonly result: EvaluationResult | null  // only present when isFinal=true
}
```

### `src/domain/practice/ports.ts`

```ts
import type { DomainEvent } from '../shared/events'
import type { ExerciseId, SessionId, UserId, VariationId } from '../shared/types'
import type { EvaluationToken, SessionStatus } from './values'

export interface ConversationTurn {
  userResponse: string
  llmResponse: string
}

export interface LLMPort {
  evaluate(params: {
    ownerRole: string
    ownerContext: string
    sessionBody: string
    history: ConversationTurn[]
  }): AsyncIterable<EvaluationToken>

  generateSessionBody(params: {
    ownerRole: string
    ownerContext: string
    exerciseDescription: string
  }): Promise<string>
}

export interface SessionRepositoryPort {
  save(session: import('./session').Session): Promise<void>
  findById(id: SessionId): Promise<import('./session').Session | null>
  findActiveByUserId(userId: UserId): Promise<import('./session').Session | null>
}

export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>,
  ): void
}
```

### `src/domain/practice/events.ts`

```ts
import type { DomainEvent } from '../shared/events'
import type { SessionId, UserId, ExerciseId, VariationId, AttemptId } from '../shared/types'
import type { Verdict } from './values'

export interface SessionCreated extends DomainEvent {
  readonly type: 'SessionCreated'
  readonly aggregateId: string  // SessionId
  readonly userId: UserId
  readonly exerciseId: ExerciseId
  readonly variationId: VariationId
}

export interface AttemptSubmitted extends DomainEvent {
  readonly type: 'AttemptSubmitted'
  readonly aggregateId: string  // SessionId
  readonly attemptId: AttemptId
  readonly isFinalEvaluation: boolean
}

export interface SessionCompleted extends DomainEvent {
  readonly type: 'SessionCompleted'
  readonly aggregateId: string  // SessionId
  readonly userId: UserId
  readonly verdict: Verdict
  readonly topicsToReview: string[]
}

export interface SessionFailed extends DomainEvent {
  readonly type: 'SessionFailed'
  readonly aggregateId: string  // SessionId
  readonly userId: UserId
}
```

### `src/domain/practice/attempt.ts`

```ts
import type { AttemptId, SessionId } from '../shared/types'
import type { EvaluationResult } from './values'

export interface AttemptProps {
  id: AttemptId
  sessionId: SessionId
  userResponse: string
  evaluationResult: EvaluationResult | null
  isFinalEvaluation: boolean
  submittedAt: Date
}

export class Attempt {
  readonly id: AttemptId
  readonly sessionId: SessionId
  readonly userResponse: string
  readonly evaluationResult: EvaluationResult | null
  readonly isFinalEvaluation: boolean
  readonly submittedAt: Date

  constructor(props: AttemptProps) {
    this.id = props.id
    this.sessionId = props.sessionId
    this.userResponse = props.userResponse
    this.evaluationResult = props.evaluationResult
    this.isFinalEvaluation = props.isFinalEvaluation
    this.submittedAt = props.submittedAt
  }

  static create(params: {
    sessionId: SessionId
    userResponse: string
    evaluationResult: EvaluationResult
    isFinalEvaluation: boolean
  }): Attempt {
    return new Attempt({
      id: AttemptId(crypto.randomUUID()),
      sessionId: params.sessionId,
      userResponse: params.userResponse,
      evaluationResult: params.evaluationResult,
      isFinalEvaluation: params.isFinalEvaluation,
      submittedAt: new Date(),
    })
  }
}
```

### `src/domain/practice/session.ts`

The core aggregate. Enforces all invariants. Collects domain events.

```ts
import { SessionAlreadyCompletedError } from '../shared/errors'
import type { DomainEvent } from '../shared/events'
import type { ExerciseId, SessionId, UserId, VariationId } from '../shared/types'
import type { Attempt } from './attempt'
import type { AttemptSubmitted, SessionCompleted, SessionCreated, SessionFailed } from './events'
import type { SessionStatus, Verdict } from './values'

export interface SessionProps {
  id: SessionId
  userId: UserId
  exerciseId: ExerciseId
  variationId: VariationId
  body: string
  status: SessionStatus
  attempts: Attempt[]
  startedAt: Date
  completedAt: Date | null
}

export class Session {
  readonly id: SessionId
  readonly userId: UserId
  readonly exerciseId: ExerciseId
  readonly variationId: VariationId
  readonly body: string
  private _status: SessionStatus
  private _attempts: Attempt[]
  readonly startedAt: Date
  private _completedAt: Date | null
  private _pendingEvents: DomainEvent[] = []

  constructor(props: SessionProps) {
    this.id = props.id
    this.userId = props.userId
    this.exerciseId = props.exerciseId
    this.variationId = props.variationId
    this.body = props.body
    this._status = props.status
    this._attempts = [...props.attempts]
    this.startedAt = props.startedAt
    this._completedAt = props.completedAt
  }

  get status(): SessionStatus { return this._status }
  get attempts(): Attempt[] { return [...this._attempts] }
  get completedAt(): Date | null { return this._completedAt }

  static create(params: {
    userId: UserId
    exerciseId: ExerciseId
    variationId: VariationId
    body: string
  }): Session {
    const session = new Session({
      id: SessionId(crypto.randomUUID()),
      userId: params.userId,
      exerciseId: params.exerciseId,
      variationId: params.variationId,
      body: params.body,
      status: 'active',
      attempts: [],
      startedAt: new Date(),
      completedAt: null,
    })

    session._pendingEvents.push({
      type: 'SessionCreated',
      aggregateId: session.id,
      occurredAt: new Date(),
      userId: params.userId,
      exerciseId: params.exerciseId,
      variationId: params.variationId,
    } satisfies SessionCreated)

    return session
  }

  addAttempt(attempt: Attempt): void {
    if (this._status !== 'active') {
      throw new SessionAlreadyCompletedError(this.id)
    }

    this._attempts.push(attempt)

    const event: AttemptSubmitted = {
      type: 'AttemptSubmitted',
      aggregateId: this.id,
      occurredAt: new Date(),
      attemptId: attempt.id,
      isFinalEvaluation: attempt.isFinalEvaluation,
    }
    this._pendingEvents.push(event)

    if (attempt.isFinalEvaluation && attempt.evaluationResult) {
      this._complete(attempt.evaluationResult.verdict, attempt.evaluationResult.topicsToReview)
    }
  }

  private _complete(verdict: Verdict, topicsToReview: string[]): void {
    this._status = verdict === 'needs_work' ? 'failed' : 'completed'
    this._completedAt = new Date()

    if (this._status === 'completed') {
      const event: SessionCompleted = {
        type: 'SessionCompleted',
        aggregateId: this.id,
        occurredAt: new Date(),
        userId: this.userId,
        verdict,
        topicsToReview,
      }
      this._pendingEvents.push(event)
    } else {
      const event: SessionFailed = {
        type: 'SessionFailed',
        aggregateId: this.id,
        occurredAt: new Date(),
        userId: this.userId,
      }
      this._pendingEvents.push(event)
    }
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._pendingEvents]
    this._pendingEvents = []
    return events
  }
}
```

---

### Content Context

**`src/domain/content/values.ts`**

```ts
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ExerciseType = 'code' | 'chat' | 'whiteboard'
export type ExerciseStatus = 'draft' | 'published' | 'archived'
```

**`src/domain/content/ports.ts`**

```ts
import type { ExerciseId, UserId } from '../shared/types'

export interface ExerciseFilters {
  mood?: 'focused' | 'regular' | 'low_energy'
  maxDuration?: number   // minutes
}

export interface ExerciseRepositoryPort {
  findEligible(userId: UserId, filters: ExerciseFilters): Promise<import('./exercise').Exercise[]>
  findById(id: ExerciseId): Promise<import('./exercise').Exercise | null>
  save(exercise: import('./exercise').Exercise): Promise<void>
}
```

**`src/domain/content/exercise.ts`**

Full Exercise aggregate with Variation entities. Follow the same pattern as Session (static `create`, `pullEvents`). Key rule: once published, `status` can only move to `archived` — not back to `draft`.

**`src/domain/content/events.ts`**

`ExercisePublished` event.

---

### Identity Context

**`src/domain/identity/user.ts`** — plain entity, no invariants needed for Phase 0:
```ts
export interface UserProps {
  id: UserId
  githubId: string
  username: string
  avatarUrl: string
  createdAt: Date
}
export class User { ... }
```

**`src/domain/identity/ports.ts`** — `UserRepositoryPort` with `findByGithubId` and `save`.

---

### Recognition Context

**`src/domain/recognition/ports.ts`** — empty file with a comment: `// Phase 0: recognition context reacts to SessionCompleted events. Ports TBD in Phase 2.`

**`src/domain/recognition/events.ts`** — `BadgeEarned` event interface.

---

## Application Layer

### `src/application/practice/StartSession.ts`

```ts
import type { EventBusPort, LLMPort, SessionRepositoryPort } from '../../domain/practice/ports'
import type { ExerciseRepositoryPort } from '../../domain/content/ports'
import type { ExerciseId, UserId, VariationId } from '../../domain/shared/types'
import { ExerciseNotFoundError } from '../../domain/shared/errors'
import { Session } from '../../domain/practice/session'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
  sessionRepo: SessionRepositoryPort
  llm: LLMPort
  eventBus: EventBusPort
}

export class StartSession {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    userId: UserId
    exerciseId: ExerciseId
    variationId: VariationId
  }): Promise<Session> {
    const exercise = await this.deps.exerciseRepo.findById(params.exerciseId)
    if (!exercise) throw new ExerciseNotFoundError(params.exerciseId)

    const variation = exercise.variations.find((v) => v.id === params.variationId)
    if (!variation) throw new ExerciseNotFoundError(params.variationId)

    const body = await this.deps.llm.generateSessionBody({
      ownerRole: variation.ownerRole,
      ownerContext: variation.ownerContext,
      exerciseDescription: exercise.description,
    })

    const session = Session.create({
      userId: params.userId,
      exerciseId: params.exerciseId,
      variationId: params.variationId,
      body,
    })

    await this.deps.sessionRepo.save(session)

    for (const event of session.pullEvents()) {
      await this.deps.eventBus.publish(event)
    }

    return session
  }
}
```

### `src/application/practice/SubmitAttempt.ts`

```ts
// Returns AsyncIterable<EvaluationToken>
// On the final token, adds Attempt to Session, saves, publishes SessionCompleted/Failed
```

Signature:
```ts
execute(params: {
  sessionId: SessionId
  userResponse: string
}): AsyncIterable<EvaluationToken>
```

Implementation note: this is a generator function (`async function*`). It yields tokens from `LLMPort.evaluate()`. When `isFinal: true`, it creates the Attempt, calls `session.addAttempt()`, saves, and publishes events before the generator returns.

### `src/application/practice/GetExerciseOptions.ts`

```ts
execute(params: {
  userId: UserId
  filters: ExerciseFilters
}): Promise<Exercise[]>
```

Thin orchestration: calls `exerciseRepo.findEligible()`. Returns exactly 3 options (the repository handles the limit and exclusion window).

### `src/application/identity/UpsertUser.ts`

```ts
execute(params: {
  githubId: string
  username: string
  avatarUrl: string
}): Promise<User>
```

Find by `githubId`, create if missing, save, return User.

---

## Infrastructure Layer

### `src/infrastructure/events/InMemoryEventBus.ts`

```ts
import type { EventBusPort } from '../../domain/practice/ports'
import type { DomainEvent } from '../../domain/shared/events'

export class InMemoryEventBus implements EventBusPort {
  private handlers = new Map<string, Array<(event: DomainEvent) => Promise<void>>>()

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? []
    for (const handler of handlers) {
      await handler(event)
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>,
  ): void {
    const existing = this.handlers.get(eventType) ?? []
    this.handlers.set(eventType, [...existing, handler as (event: DomainEvent) => Promise<void>])
  }
}
```

### `src/infrastructure/llm/MockLLMAdapter.ts`

For use in tests only. Implements `LLMPort` with deterministic responses.

```ts
import type { LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'

export class MockLLMAdapter implements LLMPort {
  async generateSessionBody(_params: unknown): Promise<string> {
    return 'Mock session body for testing purposes.'
  }

  async *evaluate(_params: unknown): AsyncIterable<EvaluationToken> {
    yield { chunk: 'Mock evaluation ', isFinal: false, result: null }
    yield {
      chunk: 'complete.',
      isFinal: true,
      result: {
        verdict: 'passed',
        analysis: 'Mock analysis: good reasoning demonstrated.',
        topicsToReview: [],
        followUpQuestion: null,
      },
    }
  }
}
```

### `src/infrastructure/http/routes/health.ts`

```ts
import { Hono } from 'hono'

export const healthRoutes = new Hono()

healthRoutes.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))
```

### `src/infrastructure/http/router.ts`

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { config } from '../../config'
import { healthRoutes } from './routes/health'
// other routes imported here as they are created

export function createRouter() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({ origin: config.WEB_URL, credentials: true }))

  app.route('/', healthRoutes)
  // app.route('/', sessionRoutes)   ← added in later phases
  // app.route('/', authRoutes)      ← added in Phase 6

  return app
}
```

### `src/infrastructure/container.ts`

The composition root. Wires all ports to adapters. No DI framework.

```ts
import { InMemoryEventBus } from './events/InMemoryEventBus'
import { StartSession } from '../application/practice/StartSession'
import { SubmitAttempt } from '../application/practice/SubmitAttempt'
import { GetExerciseOptions } from '../application/practice/GetExerciseOptions'
import { UpsertUser } from '../application/identity/UpsertUser'
// Database adapters imported in Phase 3

// Phase 0: stubs for repositories (replaced with real adapters in Phase 3)
const stubSessionRepo = { save: async () => {}, findById: async () => null, findActiveByUserId: async () => null }
const stubExerciseRepo = { findEligible: async () => [], findById: async () => null, save: async () => {} }
const stubUserRepo = { findByGithubId: async () => null, save: async () => {} }
const stubLlm = { evaluate: async function* () {}, generateSessionBody: async () => '' }

export const eventBus = new InMemoryEventBus()

export const useCases = {
  startSession: new StartSession({
    exerciseRepo: stubExerciseRepo,
    sessionRepo: stubSessionRepo,
    llm: stubLlm,
    eventBus,
  }),
  submitAttempt: new SubmitAttempt({ sessionRepo: stubSessionRepo, llm: stubLlm, eventBus }),
  getExerciseOptions: new GetExerciseOptions({ exerciseRepo: stubExerciseRepo }),
  upsertUser: new UpsertUser({ userRepo: stubUserRepo }),
}
```

> Stubs are replaced with real Drizzle adapters in Phase 3 without touching the use cases.

### `src/index.ts` (refactored)

```ts
import './config'  // must be first — validates env
import { serve } from '@hono/node-server'
import { config } from './config'
import { createRouter } from './infrastructure/http/router'

const app = createRouter()

serve({ fetch: app.fetch, port: config.API_PORT }, (info) => {
  console.log(`API running on port ${info.port}`)
})
```

---

## Test Files (create alongside domain files)

**`src/domain/practice/session.test.ts`**

Key scenarios to cover:
- `Session.create()` sets status to `active` and emits `SessionCreated` event
- `session.addAttempt()` on an active session succeeds and emits `AttemptSubmitted`
- `session.addAttempt()` on a completed session throws `SessionAlreadyCompletedError`
- A final attempt with `verdict: 'passed'` transitions status to `completed` and emits `SessionCompleted`
- A final attempt with `verdict: 'needs_work'` transitions status to `failed` and emits `SessionFailed`
- `session.pullEvents()` clears the pending events array

**`src/infrastructure/events/InMemoryEventBus.test.ts`**

- `publish()` calls all subscribers for the event type
- Multiple subscribers on the same event type are all called
- Events with no subscribers do not error
- `pullEvents()` pattern works correctly with the bus

**`src/application/practice/StartSession.test.ts`**

- Uses `MockLLMAdapter` and in-memory stub repos
- Asserts `SessionCreated` event is published
- Asserts that `ExerciseNotFoundError` is thrown when exercise doesn't exist

---

## Acceptance Criteria

- [ ] `pnpm lint` passes — no circular imports between layers
- [ ] `pnpm typecheck` passes
- [ ] `pnpm --filter=@dojo/api test` runs and all domain + event bus tests pass
- [ ] `domain/` has 0 imports from `application/` or `infrastructure/`
- [ ] `application/` has 0 imports from `infrastructure/`
- [ ] `GET /health` returns `{ status: 'ok' }`
- [ ] `Session.addAttempt()` throws on completed session (covered by test)
- [ ] `pullEvents()` returns events and clears them on the next call (covered by test)
- [ ] `StartSession` publishes `SessionCreated` (covered by test with `MockLLMAdapter`)

## Out of Scope

- Real LLM calls (Phase 0 runs with stubs)
- Database persistence (Phase 3)
- HTTP route implementations beyond health check (sessions/exercises routes are stubs)
- Authentication middleware (Phase 6)
- WebSocket handler (after foundation)
