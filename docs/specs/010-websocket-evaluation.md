# Spec 010 — WebSocket Evaluation Flow

**Experts:** Tomás Ríos (realtime), Marta Kowalczyk (auth on upgrade), Yemi Okafor (LLM streaming), Hiroshi Nakamura (testing)
**Depends on:** Spec 009 (HTTP routes — `pendingAttempts` Map, `GetSession`), Spec 011 (Anthropic adapter — for real LLM; MockLLMAdapter works for development)
**Blocks:** Spec 013 (frontend — streaming UI)

---

## What and Why

The WebSocket at `WS /ws/sessions/:id` is the channel through which the sensei streams evaluation tokens to the client. The HTTP layer (`POST /sessions/:id/attempts`) accepted the submission and returned an `attemptId` — this spec wires the streaming evaluation that follows.

**Key decisions (ADR-001):** WebSocket over SSE because the evaluation is bidirectional — client submits, server streams, client may send follow-up. One HTTP+WS separation keeps each transport doing what it does best.

---

## Scope

**In:** WebSocket handler at `/ws/sessions/:id`, auth on upgrade, message protocol, reconnect handling, concurrent connection limit, `SubmitAttempt` fix (ownerRole/ownerContext), MockLLMAdapter streaming simulation, `index.ts` WebSocket injection

**Out:** Anthropic adapter (spec 011 — MockLLMAdapter covers dev/test), frontend streaming UI (spec 013)

---

## Message protocol

```
Client connects  (cookie in upgrade request)
Server validates auth + session ownership
Server → {type: "ready"}

Client → {type: "submit", attemptId: string}
Server → {type: "token", content: string}   // N times
Server → {type: "evaluation", result: EvaluationResult}
Server → {type: "complete", isFinal: boolean}

// isFinal = false → follow-up available (max 2 total exchanges)
Client → {type: "submit", attemptId: string}   // follow-up attempt
// ... same token/evaluation/complete cycle

// isFinal = true → server closes with 1000 Normal Closure

// Reconnect after connection drop:
Client → {type: "reconnect", attemptId: string}
Server → {type: "token", content: string}   // resumes from cached tokens
Server → {type: "evaluation", result: EvaluationResult}   // if stream already finished
Server → {type: "complete", isFinal: boolean}

// Errors:
Server → {type: "error", code: "LLM_STREAM_ERROR" | "SESSION_NOT_FOUND" | "ATTEMPT_NOT_FOUND" | "ATTEMPT_LIMIT_REACHED"}
```

**On `LLM_STREAM_ERROR`:** session stays active, user can resubmit (send another `{type:"submit"}`).
**On `ATTEMPT_LIMIT_REACHED`:** sensei delivers final verdict regardless. Connection closes normally.

---

## 1. Fix `SubmitAttempt` — add ownerRole/ownerContext

The current `SubmitAttempt.execute()` passes empty strings to the LLM. Fix by adding params:

`apps/api/src/application/practice/SubmitAttempt.ts`:

```ts
export class SubmitAttempt {
  constructor(private readonly deps: Deps) {}

  async *execute(params: {
    sessionId: SessionId
    userResponse: string
    ownerRole: string        // ← added
    ownerContext: string     // ← added
  }): AsyncIterable<EvaluationToken> {
    const session = await this.deps.sessionRepo.findById(params.sessionId)
    if (!session) throw new SessionNotFoundError(params.sessionId)

    const history: ConversationTurn[] = session.attempts
      .filter((a) => a.evaluationResult !== null)
      .map((a) => ({
        userResponse: a.userResponse,
        llmResponse: a.evaluationResult?.analysis ?? '',
      }))

    let finalToken: EvaluationToken | null = null

    for await (const token of this.deps.llm.evaluate({
      ownerRole: params.ownerRole,         // ← now populated
      ownerContext: params.ownerContext,   // ← now populated
      sessionBody: session.body,
      history,
    })) {
      yield token
      if (token.isFinal) finalToken = token
    }

    if (finalToken?.result) {
      const attempt = Attempt.create({
        sessionId: params.sessionId,
        userResponse: params.userResponse,
        evaluationResult: finalToken.result,
        isFinalEvaluation: finalToken.result.followUpQuestion === null,
      })

      session.addAttempt(attempt)
      await this.deps.sessionRepo.save(session)

      for (const event of session.pullEvents()) {
        await this.deps.eventBus.publish(event)
      }
    }
  }
}
```

---

## 2. Enhance `MockLLMAdapter` with streaming simulation

`apps/api/src/infrastructure/llm/MockLLMAdapter.ts`:

```ts
import type { LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import { config } from '../../config'

export class MockLLMAdapter implements LLMPort {
  async generateSessionBody(_params: unknown): Promise<string> {
    return 'Mock session body for testing purposes.'
  }

  async *evaluate(_params: unknown): AsyncIterable<EvaluationToken> {
    const delayMs = config.MOCK_LLM_STREAM_DELAY_MS  // default 50ms
    const verdict = config.MOCK_LLM_VERDICT           // default 'needs_work'
    const tokenCount = config.MOCK_LLM_RESPONSE_TOKENS // default 20
    const withFollowUp = config.MOCK_LLM_FOLLOW_UP    // default false

    const tokens = `Mock evaluation: your answer demonstrates understanding of the core concept. However, there are areas worth reviewing in more detail.`.split(' ')

    for (let i = 0; i < Math.min(tokenCount, tokens.length - 1); i++) {
      if (delayMs > 0) await sleep(delayMs)
      yield { chunk: tokens[i] + ' ', isFinal: false, result: null }
    }

    if (delayMs > 0) await sleep(delayMs)
    yield {
      chunk: '',
      isFinal: true,
      result: {
        verdict,
        analysis: 'Mock analysis: demonstrated core understanding with some gaps in edge case handling.',
        topicsToReview: verdict === 'needs_work' ? ['error handling', 'edge cases'] : [],
        followUpQuestion: withFollowUp ? 'Can you explain how you would handle the error case?' : null,
      },
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

Add to `apps/api/src/config.ts`:

```ts
MOCK_LLM_STREAM_DELAY_MS: z.coerce.number().int().min(0).default(50),
MOCK_LLM_VERDICT: z.enum(['passed', 'passed_with_notes', 'needs_work']).default('needs_work'),
MOCK_LLM_RESPONSE_TOKENS: z.coerce.number().int().min(1).default(20),
MOCK_LLM_FOLLOW_UP: z.coerce.boolean().default(false),
```

---

## 3. WebSocket handler

`apps/api/src/infrastructure/http/routes/ws.ts`:

```ts
import { upgradeWebSocket } from '@hono/node-server/ws'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '../../persistence/drizzle/client'
import { userSessions } from '../../persistence/drizzle/schema'
import { useCases } from '../../container'
import { pendingAttempts } from './practice'
import { SessionId } from '../../../domain/shared/types'
import type { EvaluationResult } from '../../../domain/practice/values'

// ── Concurrent connection limit ──────────────────────────────────────────────
// Maps userId → active WebSocket. One stream per user at a time.
const activeConnections = new Map<string, WebSocket>()

// ── Reconnect cache ──────────────────────────────────────────────────────────
// Maps attemptId → { tokens: string[], result: EvaluationResult | null }
// Lives for 60 seconds after stream completes
interface StreamCache {
  tokens: string[]
  result: EvaluationResult | null
  complete: boolean
  isFinal: boolean
}
const streamCache = new Map<string, StreamCache>()

// ── Message types ────────────────────────────────────────────────────────────
type ClientMessage =
  | { type: 'submit'; attemptId: string }
  | { type: 'reconnect'; attemptId: string }

type ServerMessage =
  | { type: 'ready' }
  | { type: 'token'; content: string }
  | { type: 'evaluation'; result: EvaluationResult }
  | { type: 'complete'; isFinal: boolean }
  | { type: 'error'; code: string }

export const wsRoutes = new Hono()

wsRoutes.get(
  '/ws/sessions/:id',
  upgradeWebSocket(async (c) => {
    // ── Auth on upgrade (before handshake completes) ──────────────────────
    const sessionCookie = getCookie(c, 'session')
    if (!sessionCookie) {
      // Returning undefined closes with 4001
      return { onOpen: (_, ws) => ws.close(4001, 'Unauthorized') }
    }

    const userSession = await db.query.userSessions.findFirst({
      where: and(
        eq(userSessions.id, sessionCookie),
        gt(userSessions.expiresAt, new Date()),
      ),
      with: { user: true },
    })

    if (!userSession) {
      return { onOpen: (_, ws) => ws.close(4001, 'Unauthorized') }
    }

    const user = userSession.user
    const sessionId = c.req.param('id')

    // Verify session ownership
    const session = await useCases.getSession.execute({
      sessionId,
      userId: user.id,
    })

    if (!session) {
      return { onOpen: (_, ws) => ws.close(4004, 'Session not found') }
    }

    // ── Handlers ──────────────────────────────────────────────────────────
    return {
      onOpen(_, ws) {
        // Concurrent connection limit (Marta — PRD-005)
        const existing = activeConnections.get(user.id)
        if (existing) {
          existing.close(4008, 'Policy Violation: another connection is active')
        }
        activeConnections.set(user.id, ws as unknown as WebSocket)

        send(ws, { type: 'ready' })
      },

      async onMessage(event, ws) {
        let msg: ClientMessage
        try {
          msg = JSON.parse(String(event.data)) as ClientMessage
        } catch {
          send(ws, { type: 'error', code: 'INVALID_MESSAGE' })
          return
        }

        if (msg.type === 'reconnect') {
          await handleReconnect(ws, msg.attemptId)
          return
        }

        if (msg.type === 'submit') {
          await handleSubmit(ws, msg.attemptId, session, user.id)
          return
        }
      },

      onClose() {
        activeConnections.delete(user.id)
      },

      onError(_, ws) {
        activeConnections.delete(user.id)
        ws.close(1011, 'Internal error')
      },
    }
  }),
)

// ── Handle submit ─────────────────────────────────────────────────────────────
async function handleSubmit(
  ws: { send: (data: string) => void; close: (code?: number, reason?: string) => void },
  attemptId: string,
  session: Awaited<ReturnType<typeof useCases.getSession.execute>>,
  userId: string,
) {
  const pending = pendingAttempts.get(attemptId)
  if (!pending) {
    send(ws, { type: 'error', code: 'ATTEMPT_NOT_FOUND' })
    return
  }

  // Attempt limit check — max 2 exchanges
  const currentSession = await useCases.getSession.execute({
    sessionId: session!.id,
    userId,
  })
  if (!currentSession) {
    send(ws, { type: 'error', code: 'SESSION_NOT_FOUND' })
    return
  }
  if (currentSession.attempts.length >= 2) {
    send(ws, { type: 'error', code: 'ATTEMPT_LIMIT_REACHED' })
    return
  }

  // Get ownerRole/ownerContext from the exercise variation
  const exercise = await useCases.getExerciseById.execute(currentSession.exerciseId)
  const variation = exercise?.variations.find((v) => v.id === currentSession.variationId)

  // Initialize stream cache for reconnect support
  const cache: StreamCache = { tokens: [], result: null, complete: false, isFinal: false }
  streamCache.set(attemptId, cache)

  pendingAttempts.delete(attemptId)

  try {
    for await (const token of useCases.submitAttempt.execute({
      sessionId: SessionId(pending.sessionId),
      userResponse: pending.userResponse,
      ownerRole: variation?.ownerRole ?? '',
      ownerContext: variation?.ownerContext ?? '',
    })) {
      if (token.chunk) {
        send(ws, { type: 'token', content: token.chunk })
        cache.tokens.push(token.chunk)
      }

      if (token.isFinal && token.result) {
        cache.result = token.result
        cache.complete = true
        cache.isFinal = token.result.followUpQuestion === null

        send(ws, { type: 'evaluation', result: token.result })
        send(ws, { type: 'complete', isFinal: cache.isFinal })

        if (cache.isFinal) {
          ws.close(1000, 'Evaluation complete')
        }
      }
    }
  } catch {
    send(ws, { type: 'error', code: 'LLM_STREAM_ERROR' })
    cache.complete = true
  } finally {
    // Clear cache after 60 seconds (reconnect window)
    setTimeout(() => streamCache.delete(attemptId), 60_000)
  }
}

// ── Handle reconnect ──────────────────────────────────────────────────────────
async function handleReconnect(
  ws: { send: (data: string) => void; close: (code?: number, reason?: string) => void },
  attemptId: string,
) {
  const cache = streamCache.get(attemptId)
  if (!cache) {
    send(ws, { type: 'error', code: 'ATTEMPT_NOT_FOUND' })
    return
  }

  // Replay cached tokens
  for (const token of cache.tokens) {
    send(ws, { type: 'token', content: token })
  }

  // If stream already completed, send evaluation + complete
  if (cache.complete && cache.result) {
    send(ws, { type: 'evaluation', result: cache.result })
    send(ws, { type: 'complete', isFinal: cache.isFinal })
    if (cache.isFinal) ws.close(1000, 'Evaluation complete')
  }
  // If stream still in progress — tokens will arrive via the ongoing generator
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function send(
  ws: { send: (data: string) => void },
  msg: ServerMessage,
): void {
  ws.send(JSON.stringify(msg))
}
```

---

## 4. Install WebSocket package

```bash
pnpm add @hono/node-server --filter=@dojo/api
```

(Already installed as `@hono/node-server` for `serve()` — just confirm the `/ws` export is included. No new package needed if version ≥ 1.13.)

---

## 5. Update `router.ts` — add WS routes

```ts
import { wsRoutes } from './routes/ws'

// Inside createRouter():
app.route('/', wsRoutes)
```

---

## 6. Update `index.ts` — inject WebSocket into Node server

```ts
import './config'
import { serve } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-server/ws'
import { config } from './config'
import { createRouter } from './infrastructure/http/router'

const app = createRouter()
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// Export upgradeWebSocket so ws.ts can import it
export { upgradeWebSocket }

const server = serve({ fetch: app.fetch, port: config.API_PORT }, (info) => {
  console.log(`dojo_ api running on port ${info.port}`)
})

injectWebSocket(server)
```

> **Note:** `upgradeWebSocket` must be exported from `index.ts` (or a shared module) so `ws.ts` can import it after the server is initialized. Alternatively, pass it via the container.

**Cleaner approach — avoid circular imports:**

Create `apps/api/src/infrastructure/http/ws-adapter.ts`:

```ts
import { createNodeWebSocket } from '@hono/node-server/ws'
import type { Hono } from 'hono'

let _upgradeWebSocket: ReturnType<typeof createNodeWebSocket>['upgradeWebSocket']
let _injectWebSocket: ReturnType<typeof createNodeWebSocket>['injectWebSocket']

export function initWebSocket(app: Hono) {
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })
  _upgradeWebSocket = upgradeWebSocket
  _injectWebSocket = injectWebSocket
}

export function upgradeWebSocket(...args: Parameters<typeof _upgradeWebSocket>) {
  return _upgradeWebSocket(...args)
}

export function injectWebSocket(server: Parameters<typeof _injectWebSocket>[0]) {
  return _injectWebSocket(server)
}
```

Then in `ws.ts`: `import { upgradeWebSocket } from '../ws-adapter'`
And in `index.ts`: `initWebSocket(app)` before `serve()`.

---

## 7. Add `SESSION_EXPIRED` to `domainErrorToStatus` (already in spec 009)

Confirmed — no additional change needed.

---

## Tests required

`apps/api/src/infrastructure/http/routes/ws.test.ts`:

```ts
// Use MockLLMAdapter with MOCK_LLM_STREAM_DELAY_MS=0 for synchronous tests

describe('WebSocket /ws/sessions/:id', () => {
  it('rejects with 4001 if no session cookie')
  it('rejects with 4001 if session cookie is invalid')
  it('rejects with 4004 if session belongs to another user')
  it('sends {type:"ready"} on connect')

  describe('{type:"submit"}', () => {
    it('returns error ATTEMPT_NOT_FOUND if attemptId not in pendingAttempts')
    it('streams tokens then sends evaluation + complete')
    it('isFinal=true closes connection with 1000')
    it('isFinal=false keeps connection open for follow-up')
    it('sends ATTEMPT_LIMIT_REACHED after 2 exchanges')
    it('sends LLM_STREAM_ERROR and keeps session active on LLM failure')
  })

  describe('{type:"reconnect"}', () => {
    it('replays cached tokens if stream is in progress')
    it('sends evaluation+complete if stream already finished')
    it('sends ATTEMPT_NOT_FOUND if cache expired (>60s)')
  })

  describe('concurrent connections', () => {
    it('closes existing connection with 4008 when new connection opens for same user')
  })
})
```

**Test setup for WebSocket tests:**

```ts
// test/helpers/ws.ts
import { createServer } from 'http'
import { WebSocket } from 'ws'
import { createRouter } from '../../src/infrastructure/http/router'
import { initWebSocket, injectWebSocket } from '../../src/infrastructure/http/ws-adapter'

export async function createTestServer() {
  const app = createRouter()
  initWebSocket(app)
  const server = createServer(app.fetch)
  injectWebSocket(server)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const port = (server.address() as { port: number }).port
  return { server, port, close: () => server.close() }
}

export function connectWS(port: number, sessionId: string, cookie: string): WebSocket {
  return new WebSocket(`ws://localhost:${port}/ws/sessions/${sessionId}`, {
    headers: { cookie: `session=${cookie}` },
  })
}
```

---

## Timer enforcement — clarification

Timer enforcement (`408 SESSION_EXPIRED`) happens in **`POST /sessions/:id/attempts`** (spec 009), not here. By the time the WebSocket receives `{type:"submit"}`, the timer has already been validated. This keeps the WebSocket handler stateless with respect to timing.

---

## Implementation order

1. Fix `SubmitAttempt` (ownerRole/ownerContext params)
2. Enhance `MockLLMAdapter` (streaming simulation + env config)
3. `ws-adapter.ts` (avoids circular imports)
4. `ws.ts` handler
5. Update `router.ts` + `index.ts`
6. Add `ws` dev dependency: `pnpm add -D ws @types/ws --filter=@dojo/api` (for tests)
7. Tests

**Done when:** `pnpm typecheck` passes, WebSocket integration test streams tokens end-to-end with `MockLLMAdapter`, reconnect test passes.
