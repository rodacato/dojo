import type { Context } from 'hono'
import type * as DrizzleOrm from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UpgradeWebSocket } from '../ws-adapter'
import type { WSInstance, ClientMessage } from './ws-handlers'
import type * as WsHandlers from './ws-handlers'

// ── Hoisted spies for the boundaries the route touches ────────────────────────
const { findFirst, getSessionExecute, handleSubmit, handleReconnect, send } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  getSessionExecute: vi.fn(),
  handleSubmit: vi.fn(),
  handleReconnect: vi.fn(),
  send: vi.fn(),
}))

vi.mock('../../container', () => ({
  useCases: { getSession: { execute: getSessionExecute } },
  errorReporter: { report: vi.fn() },
}))

vi.mock('../../persistence/drizzle/client', () => ({
  db: { query: { userSessions: { findFirst } } },
}))

// Plain table refs — the route only feeds these into eq()/gt().
vi.mock('../../persistence/drizzle/schema', () => ({
  userSessions: { id: 'userSessions.id', expiresAt: 'userSessions.expiresAt' },
}))

// Partial-mock so eq/and/gt are real operators but observable. The route's
// `where` is the only place these compose, so the spy args prove the filter
// is built from the token + an expiry guard.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof DrizzleOrm>()
  return { ...actual, eq: vi.fn(actual.eq), and: vi.fn(actual.and), gt: vi.fn(actual.gt) }
})

// activeConnections stays the REAL Map so the dedup/register/delete logic is
// exercised end to end; only the leaf functions are spied.
vi.mock('./ws-handlers', async (importOriginal) => {
  const actual = await importOriginal<typeof WsHandlers>()
  return { ...actual, send, handleSubmit, handleReconnect }
})

import { and, eq, gt } from 'drizzle-orm'
import { activeConnections } from './ws-handlers'
import { createWsRoutes } from './ws'

type WSEvents = {
  onOpen?: (evt: unknown, ws: WSInstance) => void
  onMessage?: (evt: { data: unknown }, ws: WSInstance) => void | Promise<void>
  onClose?: () => void
  onError?: (evt: unknown, ws: WSInstance) => void
}

type HandlerFactory = (c: Context) => Promise<WSEvents>

// Captures the factory createWsRoutes passes to upgradeWebSocket, so the test
// can drive it directly with a mock context instead of a live socket.
function captureFactory(): { upgrade: UpgradeWebSocket; get: () => HandlerFactory } {
  let captured: HandlerFactory | undefined
  const upgrade = ((factory: HandlerFactory) => {
    captured = factory
    return async (c: Context) => c.body(null)
  }) as unknown as UpgradeWebSocket
  return {
    upgrade,
    get: () => {
      if (!captured) throw new Error('factory was not registered')
      return captured
    },
  }
}

function makeContext(sessionId: string, token: string | null): Context {
  const base = 'ws://localhost:3001/ws/sessions/' + sessionId
  const url = token === null ? base : `${base}?token=${token}`
  return {
    req: {
      url,
      param: (key: string) => (key === 'id' ? sessionId : undefined),
    },
  } as unknown as Context
}

function makeSocket(): WSInstance & { close: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn> } {
  return { close: vi.fn(), send: vi.fn() }
}

const VALID_USER = { id: 'user-1', githubId: 'gh-1' }

beforeEach(() => {
  vi.clearAllMocks()
  activeConnections.clear()
})

afterEach(() => {
  activeConnections.clear()
})

async function buildEvents(sessionId: string, token: string | null): Promise<WSEvents> {
  const cap = captureFactory()
  createWsRoutes(cap.upgrade)
  return cap.get()(makeContext(sessionId, token))
}

describe('createWsRoutes — auth on upgrade', () => {
  it('closes 4001 when no token query param is present (no DB hit)', async () => {
    const events = await buildEvents('sess-1', null)
    const ws = makeSocket()
    events.onOpen?.(null, ws)

    expect(ws.close).toHaveBeenCalledWith(4001, 'Unauthorized')
    expect(findFirst).not.toHaveBeenCalled()
    expect(getSessionExecute).not.toHaveBeenCalled()
    // Auth-fail path returns onOpen only.
    expect(events.onMessage).toBeUndefined()
  })

  it('closes 4001 when the token resolves to no session', async () => {
    findFirst.mockResolvedValue(undefined)
    const events = await buildEvents('sess-1', 'bad-token')
    const ws = makeSocket()
    events.onOpen?.(null, ws)

    expect(findFirst).toHaveBeenCalledTimes(1)
    expect(ws.close).toHaveBeenCalledWith(4001, 'Unauthorized')
    expect(getSessionExecute).not.toHaveBeenCalled()
  })

  it('builds the WHERE from the token id AND an expiry guard', async () => {
    findFirst.mockResolvedValue(undefined)
    await buildEvents('sess-1', 'tok-abc')

    expect(eq).toHaveBeenCalledWith('userSessions.id', 'tok-abc')
    // The expiry guard: gt(expiresAt, <now>) — second arg is a Date.
    const gtCall = vi.mocked(gt).mock.calls[0]
    expect(gtCall[0]).toBe('userSessions.expiresAt')
    expect(gtCall[1]).toBeInstanceOf(Date)
    // and() composes exactly the two conditions above.
    expect(and).toHaveBeenCalledTimes(1)
    const findArg = findFirst.mock.calls[0][0] as { with: { user: boolean } }
    expect(findArg.with).toEqual({ user: true })
  })

  it('closes 4004 when the session does not exist', async () => {
    findFirst.mockResolvedValue({ user: VALID_USER })
    getSessionExecute.mockResolvedValue(null)
    const events = await buildEvents('sess-missing', 'tok')
    const ws = makeSocket()
    events.onOpen?.(null, ws)

    expect(getSessionExecute).toHaveBeenCalledWith('sess-missing')
    expect(ws.close).toHaveBeenCalledWith(4004, 'Session not found')
  })

  it('closes 4003 when the session belongs to another user', async () => {
    findFirst.mockResolvedValue({ user: VALID_USER })
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: 'someone-else' })
    const events = await buildEvents('sess-1', 'tok')
    const ws = makeSocket()
    events.onOpen?.(null, ws)

    expect(ws.close).toHaveBeenCalledWith(4003, 'Forbidden')
    // Ownership-fail path returns onOpen only — no message handler wired.
    expect(events.onMessage).toBeUndefined()
  })
})

describe('createWsRoutes — onOpen for an owned session', () => {
  async function ownedEvents() {
    findFirst.mockResolvedValue({ user: VALID_USER })
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: VALID_USER.id })
    return buildEvents('sess-1', 'tok')
  }

  it('registers the connection and sends {type:ready}', async () => {
    const events = await ownedEvents()
    const ws = makeSocket()
    events.onOpen?.(null, ws)

    expect(activeConnections.get(VALID_USER.id)).toBe(ws)
    expect(send).toHaveBeenCalledWith(ws, { type: 'ready' })
  })

  it('evicts a pre-existing connection for the same user with 4008', async () => {
    const stale = makeSocket()
    activeConnections.set(VALID_USER.id, stale)

    const events = await ownedEvents()
    const fresh = makeSocket()
    events.onOpen?.(null, fresh)

    expect(stale.close).toHaveBeenCalledWith(4008, 'Policy Violation: another connection is active')
    expect(activeConnections.get(VALID_USER.id)).toBe(fresh)
  })
})

describe('createWsRoutes — onMessage', () => {
  async function ownedEvents() {
    findFirst.mockResolvedValue({ user: VALID_USER })
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: VALID_USER.id })
    return buildEvents('sess-1', 'tok')
  }

  it('sends INVALID_MESSAGE on non-JSON payloads', async () => {
    const events = await ownedEvents()
    const ws = makeSocket()
    await events.onMessage?.({ data: 'not-json{' }, ws)

    expect(send).toHaveBeenCalledWith(ws, { type: 'error', code: 'INVALID_MESSAGE' })
    expect(handleSubmit).not.toHaveBeenCalled()
    expect(handleReconnect).not.toHaveBeenCalled()
  })

  it('routes a reconnect message to handleReconnect with the attemptId', async () => {
    const events = await ownedEvents()
    const ws = makeSocket()
    const msg: ClientMessage = { type: 'reconnect', attemptId: 'att-9' }
    await events.onMessage?.({ data: JSON.stringify(msg) }, ws)

    expect(handleReconnect).toHaveBeenCalledWith(ws, 'att-9')
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('routes a submit message to handleSubmit with attemptId, sessionId and userId', async () => {
    const events = await ownedEvents()
    const ws = makeSocket()
    const msg: ClientMessage = { type: 'submit', attemptId: 'att-7' }
    await events.onMessage?.({ data: JSON.stringify(msg) }, ws)

    expect(handleSubmit).toHaveBeenCalledWith(ws, 'att-7', 'sess-1', VALID_USER.id)
    expect(handleReconnect).not.toHaveBeenCalled()
  })

  it('ignores a well-formed message with an unknown type', async () => {
    const events = await ownedEvents()
    const ws = makeSocket()
    await events.onMessage?.({ data: JSON.stringify({ type: 'ping', attemptId: 'x' }) }, ws)

    expect(handleSubmit).not.toHaveBeenCalled()
    expect(handleReconnect).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })
})

describe('createWsRoutes — onClose / onError', () => {
  async function ownedEventsConnected(ws: WSInstance) {
    findFirst.mockResolvedValue({ user: VALID_USER })
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: VALID_USER.id })
    const events = await buildEvents('sess-1', 'tok')
    events.onOpen?.(null, ws)
    return events
  }

  it('onClose removes the user from activeConnections', async () => {
    const ws = makeSocket()
    const events = await ownedEventsConnected(ws)
    expect(activeConnections.has(VALID_USER.id)).toBe(true)

    events.onClose?.()
    expect(activeConnections.has(VALID_USER.id)).toBe(false)
  })

  it('onError removes the connection and closes with 1011', async () => {
    const ws = makeSocket()
    const events = await ownedEventsConnected(ws)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    events.onError?.({ message: 'boom' }, ws)

    expect(activeConnections.has(VALID_USER.id)).toBe(false)
    expect(ws.close).toHaveBeenCalledWith(1011, 'Internal error')
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
