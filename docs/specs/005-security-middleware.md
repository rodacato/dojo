# Spec 005 — Security Middleware

**Expert:** Marta Kowalczyk
**Depends on:** Phase 2 (router must exist), Phase 3 (DB client needed for session lookup)
**Can run in parallel with:** Phase 4 (Docker)

## What and Why

Two pieces of security infrastructure that go in before routes carry real traffic:

1. **Rate limiting** — every request potentially triggers an LLM call that costs money. An unprotected endpoint is a financial attack surface, not just a DoS concern.
2. **Zod input validation helper** — establishes the validation pattern for all future route handlers. Validation happens at the adapter layer boundary, explicitly, not via magic middleware.

## Scope

**In:** `rateLimiter.ts` middleware, `validation.ts` helper, applied to router
**Out:** auth middleware (Phase 6), CORS (already in router), HTTP security headers (Nginx — Phase 4)

---

## Packages

Add to `apps/api/package.json` dependencies:
```
@hono/rate-limiter@^0.4.0
```

---

## File: `src/infrastructure/http/middleware/rateLimiter.ts`

```ts
import { rateLimiter } from '@hono/rate-limiter'

// Key extractor: uses Cloudflare real IP when behind Cloudflare Tunnel,
// falls back to X-Forwarded-For, then the direct connection IP.
const keyGenerator = (c: Parameters<typeof rateLimiter>[0]['keyGenerator'] extends (...args: infer A) => unknown ? (...args: A) => string : never) => {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

// 200 requests per 15 minutes per IP — applied to all routes
export const globalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  keyGenerator,
  message: { error: 'Too many requests. Try again later.' },
})

// 10 requests per 15 minutes per IP — applied to /auth/* routes
export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator,
  message: { error: 'Too many authentication attempts. Try again later.' },
})

// 5 requests per hour per IP — applied to POST /sessions (starts a kata)
// Each session start triggers an LLM call — this is the primary cost control.
export const sessionLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator,
  message: { error: 'Session limit reached. You can start up to 5 kata per hour.' },
})
```

---

## File: `src/infrastructure/http/validation.ts`

```ts
import { HTTPException } from 'hono/http-exception'
import type { ZodSchema } from 'zod'

/**
 * Validates `data` against `schema`. Returns the parsed, typed value.
 * Throws an HTTPException(400) with formatted errors on failure.
 *
 * Use explicitly in route handlers — not as middleware injection.
 * This makes the validation boundary visible in code review.
 *
 * @example
 * const body = validate(StartSessionSchema, await c.req.json())
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new HTTPException(400, {
      message: JSON.stringify({
        error: 'Validation failed',
        fields: result.error.flatten().fieldErrors,
      }),
    })
  }
  return result.data
}
```

---

## File: `src/infrastructure/http/router.ts` (modified)

Apply rate limiters at the correct scope:

```ts
import { globalLimiter, authLimiter, sessionLimiter } from './middleware/rateLimiter'

export function createRouter() {
  const app = new Hono()

  app.use('*', logger())
  app.use('*', cors({ origin: config.WEB_URL, credentials: true }))
  app.use('*', globalLimiter)         // ← global: all routes
  app.use('/auth/*', authLimiter)     // ← tighter: auth routes

  app.route('/', healthRoutes)

  // POST /sessions will apply sessionLimiter inline in the route handler:
  // app.post('/sessions', sessionLimiter, sessionsHandler)

  // Error handler — maps DomainErrors to HTTP status codes
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()

    // Map domain errors
    if (err.name === 'DomainError') {
      const code = (err as { code?: string }).code
      const status = domainErrorToStatus(code)
      return c.json({ error: err.message, code }, status)
    }

    console.error('Unhandled error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}

function domainErrorToStatus(code?: string): number {
  switch (code) {
    case 'SESSION_NOT_FOUND':
    case 'EXERCISE_NOT_FOUND': return 404
    case 'SESSION_ALREADY_COMPLETED': return 409
    case 'NO_ELIGIBLE_EXERCISES': return 422
    default: return 500
  }
}
```

---

## Usage Pattern in Route Handlers

Show how `validate` and `sessionLimiter` are used together. This is the template for all future route handlers.

```ts
// apps/api/src/infrastructure/http/routes/sessions.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { sessionLimiter } from '../middleware/rateLimiter'
import { validate } from '../validation'
import { useCases } from '../../container'

export const sessionRoutes = new Hono()

const StartSessionSchema = z.object({
  exerciseId: z.string().uuid(),
  variationId: z.string().uuid(),
})

sessionRoutes.post('/', sessionLimiter, async (c) => {
  const user = c.get('user')  // set by auth middleware (Phase 6)
  const body = validate(StartSessionSchema, await c.req.json())

  const session = await useCases.startSession.execute({
    userId: UserId(user.id),
    exerciseId: ExerciseId(body.exerciseId),
    variationId: VariationId(body.variationId),
  })

  return c.json({ id: session.id, body: session.body, status: session.status }, 201)
})
```

---

## Acceptance Criteria

- [ ] `globalLimiter` returns 429 after 200 requests from the same IP in 15 minutes (manual test or script)
- [ ] `authLimiter` returns 429 after 10 requests to `/auth/*` in 15 minutes
- [ ] `sessionLimiter` returns 429 after 5 `POST /sessions` in 1 hour
- [ ] `validate()` returns 400 with field-level errors for invalid input
- [ ] `validate()` returns the typed parsed value for valid input
- [ ] Domain errors are mapped to correct HTTP status codes in the error handler
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

## Out of Scope

- Redis-backed rate limiter store (in-memory is sufficient for Phase 0 single-process)
- IP allowlisting (not needed for Phase 0)
- Content-Security-Policy header (Nginx handles this in Phase 4)
- Request size limits (Hono default is sufficient for Phase 0)
