import type { Context } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { UpgradeWebSocket } from './ws'
import type { WSInstance, ClientMessage } from './ws-handlers'
import type * as WsHandlers from './ws-handlers'

// ── Hoisted spies for the boundaries the route touches ────────────────────────
const { getSessionExecute, handleSubmit, handleReconnect, send, logError } = vi.hoisted(() => ({
  logError: vi.fn(),
  getSessionExecute: vi.fn(),
  handleSubmit: vi.fn(),
  handleReconnect: vi.fn(),
  send: vi.fn(),
}))

vi.mock('../../observability/logger', () => ({
  log: { error: logError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../container', () => ({
  useCases: { getSession: { execute: getSessionExecute } },
  errorReporter: { report: vi.fn() },
}))

// activeConnections stays the REAL Map so the dedup/register/delete logic is
// exercised end to end; only the leaf functions are spied.
vi.mock('./ws-handlers', async (importOriginal) => {
  const actual = await importOriginal<typeof WsHandlers>()
  return { ...actual, send, handleSubmit, handleReconnect }
})

import { activeConnections } from './ws-handlers'
import { createWsRoutes } from './ws'
import { issueWsTicket } from './ws-tickets'

type WSEvents = {
  onOpen?: (evt: unknown, ws: WSInstance) => void
  onMessage?: (evt: { data: unknown }, ws: WSInstance) => void | Promise<void>
  onClose?: (evt: unknown, ws: WSInstance) => void
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

function makeContext(sessionId: string, ticket: string | null, query = ticket === null ? '' : `ticket=${ticket}`): Context {
  const base = 'ws://localhost:3001/ws/sessions/' + sessionId
  const url = query ? `${base}?${query}` : base
  return {
    req: {
      url,
      param: (key: string) => (key === 'id' ? sessionId : undefined),
    },
  } as unknown as Context
}

function makeSocket(): WSInstance & { close: Mock; send: Mock } {
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

async function buildEvents(sessionId: string, ticket: string | null, query?: string): Promise<WSEvents> {
  const cap = captureFactory()
  createWsRoutes(cap.upgrade)
  return cap.get()(makeContext(sessionId, ticket, query))
}

describe('createWsRoutes — auth on upgrade', () => {
  function expectRefused(events: WSEvents): void {
    const ws = makeSocket()
    events.onOpen?.(null, ws)
    expect(ws.close).toHaveBeenCalledWith(4401, 'Unauthorized')
    expect(getSessionExecute).not.toHaveBeenCalled()
    expect(events.onMessage).toBeUndefined()
  }

  it('closes 4401 when no ticket is present', async () => {
    expectRefused(await buildEvents('sess-1', null))
  })

  it('closes 4401 for a bearer token in the URL, which is no longer accepted', async () => {
    expectRefused(await buildEvents('sess-1', null, `token=${'x'.repeat(43)}`))
  })

  it('closes 4401 for a ticket it never issued', async () => {
    expectRefused(await buildEvents('sess-1', 'forged-ticket'))
  })

  it('closes 4401 for a ticket issued for another session', async () => {
    expectRefused(await buildEvents('sess-1', issueWsTicket(VALID_USER.id, 'sess-2')))
  })

  it('closes 4401 when a ticket is used a second time', async () => {
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: VALID_USER.id })
    const ticket = issueWsTicket(VALID_USER.id, 'sess-1')
    await buildEvents('sess-1', ticket)
    vi.clearAllMocks()

    expectRefused(await buildEvents('sess-1', ticket))
  })

  it('closes 4004 when the session does not exist', async () => {
    getSessionExecute.mockResolvedValue(null)
    const events = await buildEvents('sess-missing', issueWsTicket(VALID_USER.id, 'sess-missing'))
    const ws = makeSocket()
    events.onOpen?.(null, ws)

    expect(getSessionExecute).toHaveBeenCalledWith('sess-missing')
    expect(ws.close).toHaveBeenCalledWith(4004, 'Session not found')
  })

  it('closes 4003 when the session belongs to another user', async () => {
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: 'someone-else' })
    const events = await buildEvents('sess-1', issueWsTicket(VALID_USER.id, 'sess-1'))
    const ws = makeSocket()
    events.onOpen?.(null, ws)

    expect(ws.close).toHaveBeenCalledWith(4003, 'Forbidden')
    expect(events.onMessage).toBeUndefined()
  })
})

describe('createWsRoutes — onOpen for an owned session', () => {
  async function ownedEvents() {
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: VALID_USER.id })
    return buildEvents('sess-1', issueWsTicket(VALID_USER.id, 'sess-1'))
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
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: VALID_USER.id })
    return buildEvents('sess-1', issueWsTicket(VALID_USER.id, 'sess-1'))
  }

  it('sends INVALID_MESSAGE on non-JSON payloads', async () => {
    const events = await ownedEvents()
    const ws = makeSocket()
    await events.onMessage?.({ data: 'not-json{' }, ws)

    expect(send).toHaveBeenCalledWith(ws, { type: 'error', code: 'INVALID_MESSAGE' })
    expect(handleSubmit).not.toHaveBeenCalled()
    expect(handleReconnect).not.toHaveBeenCalled()
  })

  it.each(['null', '42', '"submit"'])('answers INVALID_MESSAGE to the non-object JSON frame %s', async (frame) => {
    const events = await ownedEvents()
    const ws = makeSocket()
    await expect(events.onMessage?.({ data: frame }, ws)).resolves.toBeUndefined()

    expect(send).toHaveBeenCalledWith(ws, { type: 'error', code: 'INVALID_MESSAGE' })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('reports INTERNAL_ERROR instead of rejecting when a handler throws', async () => {
    const events = await ownedEvents()
    const ws = makeSocket()
    const failure = new Error('db down')
    handleSubmit.mockRejectedValueOnce(failure)

    await expect(
      events.onMessage?.({ data: JSON.stringify({ type: 'submit', attemptId: 'att-1' }) }, ws),
    ).resolves.toBeUndefined()

    expect(send).toHaveBeenCalledWith(ws, { type: 'error', code: 'INTERNAL_ERROR' })
    expect(logError).toHaveBeenCalledWith('ws.handler_failed', expect.objectContaining({ err: failure }))
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

  it.each([
    ['an unknown type', { type: 'ping', attemptId: 'x' }],
    ['a submit with no attemptId', { type: 'submit' }],
    ['a reconnect whose attemptId is not a string', { type: 'reconnect', attemptId: 7 }],
    ['an attemptId too long to be one', { type: 'submit', attemptId: 'x'.repeat(65) }],
  ])('answers INVALID_MESSAGE to %s, without calling a handler', async (_case, frame) => {
    const events = await ownedEvents()
    const ws = makeSocket()
    await events.onMessage?.({ data: JSON.stringify(frame) }, ws)

    expect(send).toHaveBeenCalledWith(ws, { type: 'error', code: 'INVALID_MESSAGE' })
    expect(handleSubmit).not.toHaveBeenCalled()
    expect(handleReconnect).not.toHaveBeenCalled()
  })
})

describe('createWsRoutes — onClose / onError', () => {
  async function ownedEventsConnected(ws: WSInstance) {
    getSessionExecute.mockResolvedValue({ id: 'sess-1', userId: VALID_USER.id })
    const events = await buildEvents('sess-1', issueWsTicket(VALID_USER.id, 'sess-1'))
    events.onOpen?.(null, ws)
    return events
  }

  it('onClose removes the user from activeConnections', async () => {
    const ws = makeSocket()
    const events = await ownedEventsConnected(ws)
    expect(activeConnections.has(VALID_USER.id)).toBe(true)

    events.onClose?.(null, ws)
    expect(activeConnections.has(VALID_USER.id)).toBe(false)
  })

  it('an evicted socket closing does not unregister the connection that replaced it', async () => {
    const stale = makeSocket()
    const staleEvents = await ownedEventsConnected(stale)
    const fresh = makeSocket()
    const freshEvents = await ownedEventsConnected(fresh)
    expect(activeConnections.get(VALID_USER.id)).toBe(fresh)

    staleEvents.onClose?.(null, stale)

    expect(activeConnections.get(VALID_USER.id)).toBe(fresh)
    freshEvents.onClose?.(null, fresh)
    expect(activeConnections.has(VALID_USER.id)).toBe(false)
  })

  it('onError removes the connection and closes with 1011', async () => {
    const ws = makeSocket()
    const events = await ownedEventsConnected(ws)

    const socketError = new Error('connection reset')

    events.onError?.({ error: socketError }, ws)

    expect(activeConnections.has(VALID_USER.id)).toBe(false)
    expect(ws.close).toHaveBeenCalledWith(1011, 'Internal error')
    expect(logError).toHaveBeenCalledWith(
      'ws.socket_error',
      expect.objectContaining({ userId: VALID_USER.id, err: socketError }),
    )
  })
})
