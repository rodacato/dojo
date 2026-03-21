# Spec 009 — HTTP Routes: Practice & Dashboard

**Experts:** Tomás Ríos (implementation), Marta Kowalczyk (auth review), Darius Osei (domain)
**Depends on:** Spec 003 (database), Spec 006 (auth + `requireAuth`), Spec 012 (seed data)
**Blocks:** Spec 010 (WebSocket — needs `POST /sessions/:id/attempts`), Spec 013 (frontend)

---

## What and Why

Six HTTP routes that enable the complete kata loop from the frontend's perspective. The WebSocket (spec 010) handles evaluation streaming — these routes handle everything before and after.

**New:** Admin routes are mounted on a dedicated sub-router (`/admin`) with `requireCreator` middleware. Only the skeleton is created here; route handlers come in spec 014.

---

## Scope

**In:** `GET /exercises`, `GET /auth/me`, `POST /sessions`, `GET /sessions/:id`, `POST /sessions/:id/attempts`, `GET /dashboard`, admin sub-router skeleton, `GetDashboard` use case, `requireCreator` middleware, mood→difficulty bias in `ExerciseFilters`

**Out:** WebSocket handler (spec 010), Anthropic adapter (spec 011), all `/admin/*` handler implementations (spec 014), feedback endpoints (post-core-loop)

---

## 1. Update `ExerciseFilters` — mood difficulty bias

`apps/api/src/domain/content/ports.ts`:

```ts
export interface ExerciseFilters {
  mood?: 'focused' | 'regular' | 'low_energy'
  maxDuration?: number  // minutes
  // Derived from mood in findEligible():
  // - low_energy  → prefer EASY, CHAT type
  // - focused     → allow HARD
  // - regular     → no difficulty bias
}

export interface ExerciseRepositoryPort {
  findEligible(userId: UserId, filters: ExerciseFilters): Promise<Exercise[]>
  findById(id: ExerciseId): Promise<Exercise | null>
  save(exercise: Exercise): Promise<void>
}
```

The bias logic lives in `PostgresExerciseRepository.findEligible()` — not in the route. The route passes the mood through; the repository applies the ordering/filtering.

---

## 2. New use case — `GetDashboard`

`apps/api/src/application/practice/GetDashboard.ts`:

```ts
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import type { UserId } from '../../domain/shared/types'

export interface DashboardData {
  streak: number
  lastPracticed: string | null  // ISO date
  heatmap: Array<{ date: string; practiced: boolean; passed: boolean }>  // 30 days
  today: {
    completed: boolean
    activeSessionId: string | null  // non-null → resume CTA
  }
  recent: Array<{
    sessionId: string
    exerciseTitle: string
    verdict: string | null
    completedAt: string | null
  }>
}

interface Deps {
  sessionRepo: SessionRepositoryPort
}

export class GetDashboard {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId): Promise<DashboardData> {
    return this.deps.sessionRepo.getDashboardData(userId)
  }
}
```

**`getDashboardData` is a new method on `SessionRepositoryPort`:**

```ts
// apps/api/src/domain/practice/ports.ts — add to SessionRepositoryPort:
getDashboardData(userId: UserId): Promise<DashboardData>
```

**`PostgresSessionRepository` implementation** (`getDashboardData`):

```ts
async getDashboardData(userId: UserId): Promise<DashboardData> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // All sessions in last 30 days + recent 4
  const recentSessions = await this.db.query.sessions.findMany({
    where: and(
      eq(sessions.userId, userId),
      gte(sessions.startedAt, thirtyDaysAgo),
    ),
    with: {
      attempts: { orderBy: (a, { desc }) => [desc(a.submittedAt)], limit: 1 },
      exercise: { columns: { title: true } },
    },
    orderBy: (s, { desc }) => [desc(s.startedAt)],
  })

  // Active session (for resume CTA)
  const activeSession = await this.findActiveByUserId(userId)

  // Heatmap — group by day
  const heatmap = buildHeatmap(recentSessions, thirtyDaysAgo)

  // Streak — consecutive days with at least one completed/failed session
  const streak = calculateStreak(recentSessions)

  // Today check
  const todayStr = new Date().toISOString().slice(0, 10)
  const completedToday = recentSessions.some(
    (s) =>
      s.startedAt.toISOString().slice(0, 10) === todayStr &&
      (s.status === 'completed' || s.status === 'failed'),
  )

  const recent = recentSessions
    .filter((s) => s.status === 'completed' || s.status === 'failed')
    .slice(0, 4)
    .map((s) => ({
      sessionId: s.id,
      exerciseTitle: s.exercise?.title ?? '',
      verdict: s.attempts[0]
        ? JSON.parse(s.attempts[0].llmResponse ?? 'null')?.verdict ?? null
        : null,
      completedAt: s.completedAt?.toISOString() ?? null,
    }))

  return {
    streak,
    lastPracticed: recentSessions[0]?.startedAt.toISOString() ?? null,
    heatmap,
    today: {
      completed: completedToday,
      activeSessionId: activeSession?.id ?? null,
    },
    recent,
  }
}
```

**Helper functions** (same file or `src/infrastructure/persistence/helpers.ts`):

```ts
function buildHeatmap(
  sessions: Array<{ startedAt: Date; status: string }>,
  since: Date,
): Array<{ date: string; practiced: boolean; passed: boolean }> {
  const map = new Map<string, { practiced: boolean; passed: boolean }>()

  // Fill 30 days with empty
  for (let i = 0; i < 30; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    map.set(d.toISOString().slice(0, 10), { practiced: false, passed: false })
  }

  for (const s of sessions) {
    const day = s.startedAt.toISOString().slice(0, 10)
    if (map.has(day)) {
      map.set(day, {
        practiced: true,
        passed: s.status === 'completed' || map.get(day)!.passed,
      })
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))
}

function calculateStreak(sessions: Array<{ startedAt: Date; status: string }>): number {
  // Any session (completed or failed) counts — "showing up matters"
  const days = new Set(
    sessions
      .filter((s) => s.status === 'completed' || s.status === 'failed')
      .map((s) => s.startedAt.toISOString().slice(0, 10)),
  )

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const day = d.toISOString().slice(0, 10)
    if (days.has(day)) streak++
    else break
  }
  return streak
}
```

> ⚠ **Timezone note (from PRD-013):** streak and heatmap use server UTC dates. Phase 0 (single creator, known timezone) this is acceptable. Phase 1: add `X-Timezone` header support.

---

## 3. `requireCreator` middleware

`apps/api/src/infrastructure/http/middleware/auth.ts` — add alongside `requireAuth`:

```ts
export const requireCreator = async (c: Context, next: Next) => {
  const user = c.var.user
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const creatorGithubId = process.env.CREATOR_GITHUB_ID
  if (!creatorGithubId) {
    console.error('CREATOR_GITHUB_ID not set')
    return c.json({ error: 'Forbidden' }, 403)
  }

  if (String(user.githubId) !== creatorGithubId) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return next()
}
```

`requireCreator` wraps `requireAuth` — the admin router applies both in sequence (see router.ts update below).

---

## 4. New file — `practice.ts`

`apps/api/src/infrastructure/http/routes/practice.ts`:

```ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { sessionLimiter } from '../middleware/rateLimiter'
import { useCases } from '../../container'
import type { Variables } from '../middleware/auth'  // { user: User }

export const practiceRoutes = new Hono<{ Variables: Variables }>()

// ─── GET /auth/me ────────────────────────────────────────────────────────────
practiceRoutes.get('/auth/me', requireAuth, (c) => {
  const user = c.var.user
  return c.json({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
  })
})

// ─── GET /exercises ───────────────────────────────────────────────────────────
const exercisesQuerySchema = z.object({
  mood: z.enum(['focused', 'regular', 'low_energy']).optional(),
  maxDuration: z.coerce.number().int().min(10).max(60).optional(),
})

practiceRoutes.get(
  '/exercises',
  requireAuth,
  sessionLimiter,
  zValidator('query', exercisesQuerySchema),
  async (c) => {
    const { mood, maxDuration } = c.req.valid('query')
    const user = c.var.user

    const exercises = await useCases.getExerciseOptions.execute({
      userId: user.id,
      filters: { mood, maxDuration },
    })

    return c.json(exercises)
  },
)

// ─── POST /sessions ───────────────────────────────────────────────────────────
const startSessionSchema = z.object({
  exerciseId: z.string().uuid(),
})

practiceRoutes.post(
  '/sessions',
  requireAuth,
  zValidator('json', startSessionSchema),
  async (c) => {
    const { exerciseId } = c.req.valid('json')
    const user = c.var.user

    // Route picks a random variation — use case doesn't decide
    const exercise = await useCases.getExerciseOptions.execute({
      userId: user.id,
      filters: {},  // no filter — we already know the exerciseId
    })
    const target = exercise.find((e) => e.id === exerciseId)
    if (!target || target.variations.length === 0) {
      return c.json({ error: 'Exercise not found', code: 'EXERCISE_NOT_FOUND' }, 404)
    }

    const variation = target.variations[Math.floor(Math.random() * target.variations.length)]

    const session = await useCases.startSession.execute({
      userId: user.id,
      exerciseId: target.id,
      variationId: variation.id,
    })

    return c.json(
      {
        id: session.id,
        exerciseId: session.exerciseId,
        variationId: session.variationId,
        body: session.body,
        status: session.status,
        startedAt: session.startedAt.toISOString(),
      },
      201,
    )
  },
)

// ─── GET /sessions/:id ────────────────────────────────────────────────────────
practiceRoutes.get('/sessions/:id', requireAuth, async (c) => {
  const sessionId = c.req.param('id')
  const user = c.var.user

  const session = await useCases.getSession.execute({ sessionId, userId: user.id })
  if (!session) return c.json({ error: 'Session not found', code: 'SESSION_NOT_FOUND' }, 404)

  return c.json({
    id: session.id,
    exerciseId: session.exerciseId,
    body: session.body,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    attempts: session.attempts.map((a) => ({
      id: a.id,
      verdict: a.evaluationResult?.verdict ?? null,
      isFinalEvaluation: a.isFinalEvaluation,
      submittedAt: a.submittedAt.toISOString(),
    })),
  })
})

// ─── POST /sessions/:id/attempts ──────────────────────────────────────────────
const submitAttemptSchema = z.object({
  userResponse: z.string().min(1),
})

// In-memory store: attemptId → userResponse (lives until WS consumes it)
// Scoped to this module — cleared when WS evaluation completes
export const pendingAttempts = new Map<string, { sessionId: string; userResponse: string }>()

practiceRoutes.post(
  '/sessions/:id/attempts',
  requireAuth,
  zValidator('json', submitAttemptSchema),
  async (c) => {
    const sessionId = c.req.param('id')
    const { userResponse } = c.req.valid('json')
    const user = c.var.user

    // Verify session exists and belongs to user
    const session = await useCases.getSession.execute({ sessionId, userId: user.id })
    if (!session) return c.json({ error: 'Session not found', code: 'SESSION_NOT_FOUND' }, 404)
    if (session.status !== 'active') {
      return c.json({ error: 'Session already completed', code: 'SESSION_ALREADY_COMPLETED' }, 409)
    }

    // Server-side timer enforcement (10% grace — ADR-005 decision)
    const exercise = await useCases.getExerciseById.execute(session.exerciseId)
    if (exercise) {
      const durationMs = exercise.duration * 60 * 1000 * 1.1
      const elapsed = Date.now() - session.startedAt.getTime()
      if (elapsed > durationMs) {
        return c.json({ error: 'Session time expired', code: 'SESSION_EXPIRED' }, 408)
      }
    }

    // Generate an attemptId — WS will consume this
    const attemptId = crypto.randomUUID()
    pendingAttempts.set(attemptId, { sessionId, userResponse })

    // Auto-clear after 5 minutes if WS never connects
    setTimeout(() => pendingAttempts.delete(attemptId), 5 * 60 * 1000)

    return c.json({ attemptId }, 202)
  },
)

// ─── GET /dashboard ───────────────────────────────────────────────────────────
practiceRoutes.get('/dashboard', requireAuth, async (c) => {
  const user = c.var.user
  const data = await useCases.getDashboard.execute(user.id)
  return c.json(data)
})
```

---

## 5. New file — `admin.ts` (skeleton)

`apps/api/src/infrastructure/http/routes/admin.ts`:

```ts
import { Hono } from 'hono'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { Variables } from '../middleware/auth'

// Admin sub-router — all routes require creator role
// Handler implementations: spec 014
export const adminRoutes = new Hono<{ Variables: Variables }>()

adminRoutes.use('*', requireAuth, requireCreator)

// Placeholder — spec 014 adds the actual handlers
adminRoutes.get('/exercises', (c) => c.json({ message: 'Admin routes — spec 014' }))
```

---

## 6. New use cases to add

**`GetSession`** — needed by `GET /sessions/:id` and `POST /sessions/:id/attempts`:

`apps/api/src/application/practice/GetSession.ts`:

```ts
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import type { SessionId, UserId } from '../../domain/shared/types'
import { Session } from '../../domain/practice/session'

interface Deps {
  sessionRepo: SessionRepositoryPort
}

export class GetSession {
  constructor(private readonly deps: Deps) {}

  async execute(params: { sessionId: string; userId: UserId }): Promise<Session | null> {
    const session = await this.deps.sessionRepo.findById(SessionId(params.sessionId))
    if (!session) return null
    // Ownership check — a user can only see their own sessions
    if (session.userId !== params.userId) return null
    return session
  }
}
```

**`GetExerciseById`** — needed for timer enforcement:

`apps/api/src/application/practice/GetExerciseById.ts`:

```ts
import type { ExerciseRepositoryPort } from '../../domain/content/ports'
import type { ExerciseId } from '../../domain/shared/types'

interface Deps {
  exerciseRepo: ExerciseRepositoryPort
}

export class GetExerciseById {
  constructor(private readonly deps: Deps) {}

  async execute(exerciseId: ExerciseId) {
    return this.deps.exerciseRepo.findById(exerciseId)
  }
}
```

---

## 7. Update `container.ts`

```ts
import { GetExerciseOptions } from '../application/practice/GetExerciseOptions'
import { GetExerciseById } from '../application/practice/GetExerciseById'
import { GetSession } from '../application/practice/GetSession'
import { GetDashboard } from '../application/practice/GetDashboard'
import { StartSession } from '../application/practice/StartSession'
import { SubmitAttempt } from '../application/practice/SubmitAttempt'
import { UpsertUser } from '../application/identity/UpsertUser'
// ... existing imports

export const useCases = {
  startSession:       new StartSession({ exerciseRepo, sessionRepo, llm, eventBus }),
  submitAttempt:      new SubmitAttempt({ sessionRepo, llm, eventBus }),
  getExerciseOptions: new GetExerciseOptions({ exerciseRepo }),
  getExerciseById:    new GetExerciseById({ exerciseRepo }),
  getSession:         new GetSession({ sessionRepo }),
  getDashboard:       new GetDashboard({ sessionRepo }),
  upsertUser:         new UpsertUser({ userRepo }),
}
```

---

## 8. Update `router.ts`

```ts
import { practiceRoutes } from './routes/practice'
import { adminRoutes } from './routes/admin'
// ... existing imports

export function createRouter() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({ origin: config.WEB_URL, credentials: true }))
  app.use('*', globalLimiter)
  app.use('/auth/*', authLimiter)

  app.route('/', healthRoutes)
  app.route('/', authRoutes)
  app.route('/', practiceRoutes)   // ← new
  app.route('/admin', adminRoutes)  // ← new (skeleton)

  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    if (err.name === 'DomainError') {
      const code = (err as { code?: string }).code
      return c.json({ error: err.message, code }, domainErrorToStatus(code))
    }
    console.error('Unhandled error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}

function domainErrorToStatus(code?: string): ContentfulStatusCode {
  switch (code) {
    case 'SESSION_NOT_FOUND':
    case 'EXERCISE_NOT_FOUND':   return 404
    case 'SESSION_ALREADY_COMPLETED': return 409
    case 'SESSION_EXPIRED':      return 408  // ← new
    case 'NO_ELIGIBLE_EXERCISES': return 422
    default:                     return 500
  }
}
```

---

## 9. Add `SESSION_EXPIRED` to domain errors

`apps/api/src/domain/shared/errors.ts` — add:

```ts
export class SessionExpiredError extends Error {
  readonly name = 'DomainError'
  readonly code = 'SESSION_EXPIRED'
  constructor(sessionId: string) {
    super(`Session ${sessionId} has expired`)
  }
}
```

---

## 10. Package required

`@hono/zod-validator` — add to `apps/api/package.json` if not already present:

```bash
pnpm add @hono/zod-validator --filter=@dojo/api
```

---

## Tests required

`apps/api/src/infrastructure/http/routes/practice.test.ts`:

```ts
describe('GET /exercises', () => {
  it('returns 401 without auth')
  it('returns 3 exercises for authenticated user')
  it('filters by maxDuration')
  it('passes mood filter through to use case')
})

describe('GET /auth/me', () => {
  it('returns 401 without auth')
  it('returns current user')
})

describe('POST /sessions', () => {
  it('returns 401 without auth')
  it('creates session and returns 201 with body')
  it('returns 404 for unknown exerciseId')
})

describe('GET /sessions/:id', () => {
  it('returns 401 without auth')
  it('returns 404 for another user\'s session')
  it('returns session with attempts')
})

describe('POST /sessions/:id/attempts', () => {
  it('returns 401 without auth')
  it('returns 202 with attemptId for valid submission')
  it('returns 409 if session already completed')
  it('returns 408 if submission is past time limit')
})

describe('GET /dashboard', () => {
  it('returns 401 without auth')
  it('returns streak 0 for new user')
  it('returns activeSessionId when session is in progress')
})
```

Use `withMockUser()` helper (from PRD-004) to inject a fake user — no real GitHub OAuth needed in tests.

---

## Implementation order

1. `requireCreator` middleware
2. `GetSession` + `GetExerciseById` + `GetDashboard` use cases
3. `getDashboardData` on `PostgresSessionRepository`
4. `practice.ts` routes (top to bottom — each is testable independently)
5. `admin.ts` skeleton
6. Update `router.ts` + `container.ts`
7. Tests

**Done when:** `pnpm typecheck` passes, `pnpm test --filter=api` passes on `practice.test.ts`.
