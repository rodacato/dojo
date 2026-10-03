import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hostToScrollMessageSchema } from '@dojo/shared'
import {
  HELLO_TIMEOUT_MS,
  createScrollHost,
  scrollOriginOf,
  withHostParam,
  type MessageEventLike,
  type ScrollHostCallbacks,
  type ScrollInitialState,
} from './scrollHost'

const SCROLL_ORIGIN = 'https://scrolls.example.com'
const NONCE = 'n'.repeat(24)
const envelope = { dojo: 'scroll', v: 0 }

const hello = {
  ...envelope,
  type: 'hello',
  scroll: { id: 'pattern-circuit', version: '0.1.0' },
  nonce: NONCE,
  capabilities: ['progress'],
}

function setup(
  options: {
    capabilities?: Array<'progress' | 'run' | 'llm'>
    authenticated?: boolean
    initial?: ScrollInitialState
    allowRun?: boolean
  } = {},
) {
  const frame = { postMessage: vi.fn() }
  const listeners: Array<(event: MessageEventLike) => void> = []
  const listener = {
    addEventListener: (_type: 'message', fn: (event: MessageEventLike) => void) => listeners.push(fn),
    removeEventListener: (_type: 'message', fn: (event: MessageEventLike) => void) => {
      listeners.splice(listeners.indexOf(fn), 1)
    },
  }
  const callbacks: Required<ScrollHostCallbacks> = {
    onReady: vi.fn(),
    onProgress: vi.fn(),
    onComplete: vi.fn(),
    onResize: vi.fn(),
    onRun: vi.fn(),
    onError: vi.fn(),
    onTimeout: vi.fn(),
  }
  const host = createScrollHost({
    frame,
    listener,
    scrollOrigin: SCROLL_ORIGIN,
    manifest: { capabilities: options.capabilities ?? ['progress'] },
    locale: 'es-MX',
    theme: { '--color-page': '#000000' },
    authenticated: options.authenticated ?? false,
    initial: options.initial,
    allowRun: options.allowRun,
    callbacks,
    createSessionId: () => 'session-1',
  })

  const deliver = (data: unknown, overrides: Partial<MessageEventLike> = {}) => {
    const event: MessageEventLike = { origin: SCROLL_ORIGIN, source: frame, data, ...overrides }
    ;[...listeners].forEach((fn) => fn(event))
  }
  const sent = () => frame.postMessage.mock.calls.map((call) => call[0] as Record<string, unknown>)

  return { host, frame, callbacks, deliver, sent, listeners }
}

function handshake(ctx: ReturnType<typeof setup>) {
  ctx.deliver(hello)
  ctx.frame.postMessage.mockClear()
}

const progress = { ...envelope, type: 'progress', session: 'session-1', unitId: 'u1', state: { step: 2 } }
const complete = { ...envelope, type: 'complete', session: 'session-1', unitId: 'u1' }
const resize = { ...envelope, type: 'resize', session: 'session-1', height: 500 }

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('handshake', () => {
  it('answers hello with an init that echoes the nonce and issues a session', () => {
    const ctx = setup({ authenticated: true })
    ctx.deliver(hello)

    expect(ctx.frame.postMessage).toHaveBeenCalledTimes(1)
    const [message, targetOrigin] = ctx.frame.postMessage.mock.calls[0] as [Record<string, unknown>, string]
    expect(targetOrigin).toBe(SCROLL_ORIGIN)
    expect(hostToScrollMessageSchema.safeParse(message).success).toBe(true)
    expect(message).toMatchObject({
      type: 'init',
      nonce: NONCE,
      session: 'session-1',
      locale: 'es-MX',
      theme: { '--color-page': '#000000' },
      progress: {},
      userRef: null,
      authenticated: true,
    })
    expect(ctx.callbacks.onReady).toHaveBeenCalledTimes(1)
  })

  it('carries the initial progress and userRef in init', () => {
    const initial: ScrollInitialState = {
      progress: { u1: { completed: true, state: { step: 4 } }, u2: { completed: false } },
      userRef: 'opaque-ref',
    }
    const ctx = setup({ initial })
    ctx.deliver(hello)

    const [message] = ctx.sent()
    expect(hostToScrollMessageSchema.safeParse(message).success).toBe(true)
    expect(message).toMatchObject({ progress: initial.progress, userRef: 'opaque-ref' })
  })

  it('issues a random session id by default', () => {
    const frame = { postMessage: vi.fn() }
    let handler: (event: MessageEventLike) => void = () => {}
    createScrollHost({
      frame,
      listener: { addEventListener: (_t, fn) => (handler = fn), removeEventListener: () => {} },
      scrollOrigin: SCROLL_ORIGIN,
      manifest: { capabilities: [] },
      locale: 'en',
      theme: {},
      authenticated: false,
    })
    handler({ origin: SCROLL_ORIGIN, source: frame, data: hello })
    const init = frame.postMessage.mock.calls[0]?.[0] as { session: string }
    expect(init.session).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('grants only the capabilities the host supports', () => {
    const ctx = setup({ capabilities: ['progress', 'run', 'llm'] })
    ctx.deliver(hello)
    expect(ctx.sent()[0]).toMatchObject({ capabilities: ['progress'] })
  })

  it('grants run only when the manifest declares it and the host allows it', () => {
    const allowed = setup({ capabilities: ['progress', 'run', 'llm'], allowRun: true })
    allowed.deliver(hello)
    expect(allowed.sent()[0]).toMatchObject({ capabilities: ['progress', 'run'] })

    const undeclared = setup({ capabilities: ['progress'], allowRun: true })
    undeclared.deliver(hello)
    expect(undeclared.sent()[0]).toMatchObject({ capabilities: ['progress'] })
  })

  it('grants nothing when the manifest asks for nothing', () => {
    const ctx = setup({ capabilities: [] })
    ctx.deliver(hello)
    expect(ctx.sent()[0]).toMatchObject({ capabilities: [] })
  })

  it('never posts with a wildcard target origin', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.host.setLocale('en')
    ctx.host.setTheme({ '--color-page': '#fff' })
    ctx.deliver(hello)
    const origins = ctx.frame.postMessage.mock.calls.map((call) => call[1])
    expect(origins).not.toContain('*')
    expect(origins.every((origin) => origin === SCROLL_ORIGIN)).toBe(true)
  })
})

describe('session messages', () => {
  it('forwards progress, complete and resize', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.deliver(progress)
    ctx.deliver(complete)
    ctx.deliver(resize)

    expect(ctx.callbacks.onProgress).toHaveBeenCalledWith(expect.objectContaining({ unitId: 'u1', state: { step: 2 } }))
    expect(ctx.callbacks.onComplete).toHaveBeenCalledWith(expect.objectContaining({ unitId: 'u1' }))
    expect(ctx.callbacks.onResize).toHaveBeenCalledWith(500)
  })

  it('forwards scroll errors as data', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.deliver({ ...envelope, type: 'error', session: 'session-1', code: 'internal', message: '<b>boom</b>' })
    expect(ctx.callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'internal', message: '<b>boom</b>' }),
    )
  })

  it('accepts an error that carries no session', () => {
    const ctx = setup()
    ctx.deliver({ ...envelope, type: 'error', code: 'unsupported-version', message: 'v1 only' })
    expect(ctx.callbacks.onError).toHaveBeenCalledTimes(1)
  })

  it('sends setLocale and setTheme with the session', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.host.setLocale('en')
    ctx.host.setTheme({ '--color-page': '#ffffff' })
    expect(ctx.sent()).toEqual([
      { ...envelope, type: 'setLocale', session: 'session-1', locale: 'en' },
      { ...envelope, type: 'setTheme', session: 'session-1', theme: { '--color-page': '#ffffff' } },
    ])
  })

  it('does not send locale or theme changes before the handshake', () => {
    const ctx = setup()
    ctx.host.setLocale('en')
    ctx.host.setTheme({})
    expect(ctx.frame.postMessage).not.toHaveBeenCalled()
  })

  it('uses the latest locale and theme for a later handshake', () => {
    const ctx = setup()
    ctx.host.setLocale('en')
    ctx.host.setTheme({ '--color-page': '#ffffff' })
    ctx.deliver(hello)
    expect(ctx.sent()[0]).toMatchObject({ locale: 'en', theme: { '--color-page': '#ffffff' } })
  })
})

describe('ignored messages', () => {
  it('ignores a hello from another origin', () => {
    const ctx = setup()
    ctx.deliver(hello, { origin: 'https://evil.example.com' })
    expect(ctx.frame.postMessage).not.toHaveBeenCalled()
    expect(ctx.callbacks.onReady).not.toHaveBeenCalled()
  })

  it('ignores session messages from another origin', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.deliver(progress, { origin: 'https://evil.example.com' })
    ctx.deliver(complete, { origin: 'https://evil.example.com' })
    ctx.deliver(resize, { origin: 'https://evil.example.com' })
    expect(ctx.callbacks.onProgress).not.toHaveBeenCalled()
    expect(ctx.callbacks.onComplete).not.toHaveBeenCalled()
    expect(ctx.callbacks.onResize).not.toHaveBeenCalled()
  })

  it('ignores errors from another origin', () => {
    const ctx = setup()
    ctx.deliver({ ...envelope, type: 'error', code: 'internal', message: 'x' }, { origin: 'https://evil.example.com' })
    expect(ctx.callbacks.onError).not.toHaveBeenCalled()
  })

  it('ignores a hello from another window', () => {
    const ctx = setup()
    ctx.deliver(hello, { source: { postMessage: vi.fn() } })
    expect(ctx.frame.postMessage).not.toHaveBeenCalled()
    expect(ctx.callbacks.onReady).not.toHaveBeenCalled()
  })

  it('ignores session messages from another window', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.deliver(progress, { source: { postMessage: vi.fn() } })
    ctx.deliver(resize, { source: null })
    expect(ctx.callbacks.onProgress).not.toHaveBeenCalled()
    expect(ctx.callbacks.onResize).not.toHaveBeenCalled()
  })

  it('ignores a hello whose nonce is too short to be a nonce', () => {
    const ctx = setup()
    ctx.deliver({ ...hello, nonce: 'short' })
    expect(ctx.frame.postMessage).not.toHaveBeenCalled()
  })

  it('ignores a second hello with a different nonce once a session exists', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.deliver({ ...hello, nonce: 'z'.repeat(24) })
    expect(ctx.frame.postMessage).not.toHaveBeenCalled()
    expect(ctx.callbacks.onReady).toHaveBeenCalledTimes(1)
  })

  it('ignores messages with a wrong session id', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.deliver({ ...progress, session: 'other' })
    ctx.deliver({ ...complete, session: 'other' })
    ctx.deliver({ ...resize, session: 'other' })
    ctx.deliver({ ...envelope, type: 'error', session: 'other', code: 'internal', message: 'x' })
    expect(ctx.callbacks.onProgress).not.toHaveBeenCalled()
    expect(ctx.callbacks.onComplete).not.toHaveBeenCalled()
    expect(ctx.callbacks.onResize).not.toHaveBeenCalled()
    expect(ctx.callbacks.onError).not.toHaveBeenCalled()
  })

  it('ignores session messages that arrive before the handshake', () => {
    const ctx = setup()
    ctx.deliver(progress)
    ctx.deliver(resize)
    expect(ctx.callbacks.onProgress).not.toHaveBeenCalled()
    expect(ctx.callbacks.onResize).not.toHaveBeenCalled()
  })

  it('ignores malformed, foreign and reserved messages', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.deliver('hello')
    ctx.deliver(null)
    ctx.deliver({ ...progress, dojo: 'other' })
    ctx.deliver({ ...progress, v: 1 })
    ctx.deliver({ ...resize, height: -1 })
    ctx.deliver({ ...resize, height: 100_001 })
    ctx.deliver({ ...envelope, type: 'run', session: 'session-1', id: 'r1', language: 'ruby', files: [] })
    ctx.deliver({ ...envelope, type: 'llm', session: 'session-1' })
    expect(ctx.callbacks.onProgress).not.toHaveBeenCalled()
    expect(ctx.callbacks.onResize).not.toHaveBeenCalled()
  })
})

describe('run capability', () => {
  const runRequest = {
    ...envelope,
    type: 'run',
    session: 'session-1',
    id: 'req-7',
    language: 'ruby',
    files: [{ name: 'main.rb', content: 'puts 1' }],
  }
  const outcome = { kind: 'ok' as const, exitCode: 0, stdout: '1\n', stderr: '', durationMs: 9 }

  it('hands a granted run to the caller and answers with a result carrying the same id', () => {
    const ctx = setup({ capabilities: ['progress', 'run'], allowRun: true })
    handshake(ctx)
    ctx.deliver(runRequest)

    expect(ctx.callbacks.onRun).toHaveBeenCalledWith(expect.objectContaining({ id: 'req-7', language: 'ruby' }))
    ctx.host.sendResult({ id: 'req-7', ...outcome })

    const [reply, targetOrigin] = ctx.frame.postMessage.mock.calls[0] as [Record<string, unknown>, string]
    expect(targetOrigin).toBe(SCROLL_ORIGIN)
    expect(hostToScrollMessageSchema.safeParse(reply).success).toBe(true)
    expect(reply).toMatchObject({ type: 'result', session: 'session-1', id: 'req-7', kind: 'ok', stdout: '1\n' })
  })

  it.each([
    ['the manifest does not declare run', { capabilities: ['progress'] as Array<'progress' | 'run'>, allowRun: true }],
    ['the host does not allow it (anonymous or execution disabled)', { capabilities: ['progress', 'run'] as Array<'progress' | 'run'>, allowRun: false }],
  ])('answers capability-denied when %s', (_label, options) => {
    const ctx = setup(options)
    handshake(ctx)
    ctx.deliver(runRequest)

    expect(ctx.callbacks.onRun).not.toHaveBeenCalled()
    expect(ctx.sent()).toEqual([
      expect.objectContaining({ type: 'error', session: 'session-1', id: 'req-7', code: 'capability-denied' }),
    ])
    expect(hostToScrollMessageSchema.safeParse(ctx.sent()[0]).success).toBe(true)
  })

  it('ignores a run from another session or before the handshake', () => {
    const ctx = setup({ capabilities: ['progress', 'run'], allowRun: true })
    ctx.deliver(runRequest)
    handshake(ctx)
    ctx.deliver({ ...runRequest, session: 'other' })
    expect(ctx.callbacks.onRun).not.toHaveBeenCalled()
    expect(ctx.sent()).toEqual([])
  })

  it('does not send a result before the handshake', () => {
    const ctx = setup({ capabilities: ['progress', 'run'], allowRun: true })
    ctx.host.sendResult({ id: 'req-7', ...outcome })
    expect(ctx.sent()).toEqual([])
  })
})

describe('timeout', () => {
  it('reports a timeout when no hello arrives in time', () => {
    const ctx = setup()
    vi.advanceTimersByTime(HELLO_TIMEOUT_MS - 1)
    expect(ctx.callbacks.onTimeout).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(ctx.callbacks.onTimeout).toHaveBeenCalledTimes(1)
  })

  it('does not time out once the handshake completed', () => {
    const ctx = setup()
    vi.advanceTimersByTime(HELLO_TIMEOUT_MS - 1)
    ctx.deliver(hello)
    vi.advanceTimersByTime(HELLO_TIMEOUT_MS * 2)
    expect(ctx.callbacks.onTimeout).not.toHaveBeenCalled()
  })

  it('still times out when the only hello came from another origin', () => {
    const ctx = setup()
    ctx.deliver(hello, { origin: 'https://evil.example.com' })
    vi.advanceTimersByTime(HELLO_TIMEOUT_MS)
    expect(ctx.callbacks.onTimeout).toHaveBeenCalledTimes(1)
    expect(ctx.callbacks.onReady).not.toHaveBeenCalled()
  })

  it('ignores a hello that arrives after the timeout', () => {
    const ctx = setup()
    vi.advanceTimersByTime(HELLO_TIMEOUT_MS)
    ctx.deliver(hello)
    expect(ctx.frame.postMessage).not.toHaveBeenCalled()
  })
})

describe('reset and destroy', () => {
  it('accepts a new hello after reset and drops the old session', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.host.reset()
    ctx.deliver(progress)
    expect(ctx.callbacks.onProgress).not.toHaveBeenCalled()
    ctx.deliver(hello)
    expect(ctx.callbacks.onReady).toHaveBeenCalledTimes(2)
  })

  it('restarts the timeout on reset', () => {
    const ctx = setup()
    handshake(ctx)
    ctx.host.reset()
    vi.advanceTimersByTime(HELLO_TIMEOUT_MS)
    expect(ctx.callbacks.onTimeout).toHaveBeenCalledTimes(1)
  })

  it('stops listening and cancels the timer on destroy', () => {
    const ctx = setup()
    ctx.host.destroy()
    expect(ctx.listeners).toHaveLength(0)
    vi.advanceTimersByTime(HELLO_TIMEOUT_MS)
    expect(ctx.callbacks.onTimeout).not.toHaveBeenCalled()
  })
})

describe('scrollOriginOf', () => {
  it('returns the origin of an https entry', () => {
    expect(scrollOriginOf('https://scrolls.example.com/app/index.html?x=1')).toBe(SCROLL_ORIGIN)
  })

  it.each(['http://scrolls.example.com/', 'javascript:alert(1)', '/relative/path', 'not a url', ''])(
    'rejects %j',
    (entry) => {
      expect(scrollOriginOf(entry)).toBeNull()
    },
  )

  it.each(['http://localhost:4010/index.html', 'http://127.0.0.1:4010/'])(
    'accepts loopback http %j outside a production build',
    (entry) => {
      expect(scrollOriginOf(entry)).toBe(new URL(entry).origin)
    },
  )

  it('rejects loopback http in a production build', () => {
    vi.stubEnv('PROD', true)
    try {
      expect(scrollOriginOf('http://localhost:4010/')).toBeNull()
    } finally {
      vi.unstubAllEnvs()
    }
  })
})

describe('withHostParam', () => {
  it('appends the host origin and keeps existing parameters', () => {
    const url = new URL(withHostParam('https://scrolls.example.com/app/?lang=ruby', 'https://dojo.example'))
    expect(url.searchParams.get('host')).toBe('https://dojo.example')
    expect(url.searchParams.get('lang')).toBe('ruby')
    expect(url.origin).toBe(SCROLL_ORIGIN)
  })

  it('replaces a host parameter the manifest already carried', () => {
    const url = new URL(withHostParam('https://scrolls.example.com/?host=https://evil.example', 'https://dojo.example'))
    expect(url.searchParams.getAll('host')).toEqual(['https://dojo.example'])
  })
})
