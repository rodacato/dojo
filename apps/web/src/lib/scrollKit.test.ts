import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollToHostMessageSchema } from '@dojo/shared'
import shimSource from '../../public/scroll-kit/v0.js?raw'

const HOST = 'https://dojo.example'
const NONCE_LENGTH = 32

type Listener = (event: { origin: string; source: unknown; data: unknown }) => void

interface ShimApi {
  onInit(cb: (init: Record<string, unknown>) => void): void
  onLocale(cb: (locale: string) => void): void
  onTheme(cb: (theme: Record<string, string>) => void): void
  progress(unitId: string, state?: unknown): void
  complete(unitId?: string): void
  resize(height: number): void
  run(): Promise<unknown>
  llm(): Promise<unknown>
}

function loadShim(options: { search?: string; framed?: boolean } = {}) {
  const { search = `?host=${encodeURIComponent(HOST)}`, framed = true } = options
  const parent = { postMessage: vi.fn() }
  const listeners: Listener[] = []
  const fakeWindow: Record<string, unknown> = {
    location: { search },
    localStorage: window.localStorage,
    crypto: window.crypto,
    navigator: { language: 'es-MX' },
    document: {
      currentScript: {
        getAttribute: (name: string) =>
          ({
            'data-scroll-id': 'my-scroll',
            'data-scroll-version': '0.1.0',
            'data-capabilities': 'progress',
          })[name] ?? null,
      },
    },
    addEventListener: (_type: string, listener: Listener) => listeners.push(listener),
    setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
  }
  fakeWindow['parent'] = framed ? parent : fakeWindow
  // eslint-disable-next-line sonarjs/code-eval -- runs our own committed shim against a fake window
  new Function('window', shimSource)(fakeWindow)

  return {
    api: fakeWindow['DojoScroll'] as ShimApi,
    parent,
    posted: () => parent.postMessage.mock.calls.map((call) => call[0] as Record<string, unknown>),
    deliver: (data: unknown, overrides: { origin?: string; source?: unknown } = {}) => {
      const event = {
        origin: overrides.origin ?? HOST,
        source: 'source' in overrides ? overrides.source : parent,
        data,
      }
      listeners.forEach((listener) => listener(event))
    },
  }
}

function initFor(nonce: unknown, extra: Record<string, unknown> = {}) {
  return {
    dojo: 'scroll',
    v: 0,
    type: 'init',
    nonce,
    session: 'sess-1',
    locale: 'en',
    theme: { '--bg': '#fff' },
    progress: { u1: { completed: false, state: { step: 2 } } },
    capabilities: ['progress'],
    userRef: 'ref-1',
    authenticated: true,
    ...extra,
  }
}

function handshake(harness: ReturnType<typeof loadShim>) {
  const hello = harness.posted()[0]!
  harness.deliver(initFor(hello['nonce']))
  return hello
}

beforeEach(() => {
  vi.useFakeTimers()
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('scroll-kit: embedded', () => {
  it('sends a valid hello to the host origin only', () => {
    const h = loadShim()
    expect(h.parent.postMessage).toHaveBeenCalledTimes(1)
    const [message, targetOrigin] = h.parent.postMessage.mock.calls[0]!
    expect(targetOrigin).toBe(HOST)
    expect(scrollToHostMessageSchema.safeParse(message).success).toBe(true)
    expect(message).toMatchObject({
      type: 'hello',
      scroll: { id: 'my-scroll', version: '0.1.0' },
      capabilities: ['progress'],
    })
    expect(String(message.nonce)).toHaveLength(NONCE_LENGTH)
    expect(message).not.toHaveProperty('session')
  })

  it('hydrates state from init, including the previous progress', () => {
    const h = loadShim()
    const onInit = vi.fn()
    h.api.onInit(onInit)
    const hello = handshake(h)
    expect(onInit).toHaveBeenCalledTimes(1)
    expect(onInit.mock.calls[0]![0]).toMatchObject({
      standalone: false,
      session: 'sess-1',
      locale: 'en',
      userRef: 'ref-1',
      authenticated: true,
      progress: { u1: { completed: false, state: { step: 2 } } },
    })
    const lateInit = vi.fn()
    h.api.onInit(lateInit)
    expect(lateInit).toHaveBeenCalledTimes(1)
    expect(hello['nonce']).toBeTruthy()
  })

  it('sends progress, complete and resize with the session id, always to the host origin', () => {
    const h = loadShim()
    handshake(h)
    h.api.progress('u1', { step: 3 })
    h.api.complete('u1')
    h.api.resize(640.4)

    const sent = h.posted().slice(1)
    expect(sent).toEqual([
      { dojo: 'scroll', v: 0, session: 'sess-1', type: 'progress', unitId: 'u1', state: { step: 3 } },
      { dojo: 'scroll', v: 0, session: 'sess-1', type: 'complete', unitId: 'u1' },
      { dojo: 'scroll', v: 0, session: 'sess-1', type: 'resize', height: 640 },
    ])
    sent.forEach((m) => expect(scrollToHostMessageSchema.safeParse(m).success).toBe(true))
    h.parent.postMessage.mock.calls.forEach((call) => expect(call[1]).toBe(HOST))
  })

  it('holds calls made before init and sends them with the session afterwards', () => {
    const h = loadShim()
    h.api.progress('u1', { early: true })
    expect(h.posted()).toHaveLength(1)
    handshake(h)
    expect(h.posted()[1]).toMatchObject({ type: 'progress', session: 'sess-1', unitId: 'u1' })
  })

  it('forwards setLocale and setTheme that carry the session', () => {
    const h = loadShim()
    const onLocale = vi.fn()
    const onTheme = vi.fn()
    h.api.onLocale(onLocale)
    h.api.onTheme(onTheme)
    handshake(h)
    h.deliver({ dojo: 'scroll', v: 0, type: 'setLocale', session: 'sess-1', locale: 'es' })
    h.deliver({ dojo: 'scroll', v: 0, type: 'setTheme', session: 'sess-1', theme: { '--bg': '#000' } })
    expect(onLocale).toHaveBeenCalledWith('es')
    expect(onTheme).toHaveBeenCalledWith({ '--bg': '#000' })
  })

  it('does not fall back to standalone once init arrived', () => {
    const h = loadShim()
    handshake(h)
    vi.advanceTimersByTime(10_000)
    h.api.progress('u1', { a: 1 })
    expect(h.posted()).toHaveLength(2)
    expect(window.localStorage).toHaveLength(0)
  })

  it('rejects the reserved capabilities', async () => {
    const h = loadShim()
    await expect(h.api.run()).rejects.toThrow('capability not available')
    await expect(h.api.llm()).rejects.toThrow('capability not available')
  })
})

describe('scroll-kit: messages that must be ignored', () => {
  it('ignores an init from another origin', () => {
    const h = loadShim()
    const onInit = vi.fn()
    h.api.onInit(onInit)
    const nonce = h.posted()[0]!['nonce']
    h.deliver(initFor(nonce), { origin: 'https://evil.example' })
    expect(onInit).not.toHaveBeenCalled()
  })

  it('ignores an init from another window', () => {
    const h = loadShim()
    const onInit = vi.fn()
    h.api.onInit(onInit)
    const nonce = h.posted()[0]!['nonce']
    h.deliver(initFor(nonce), { source: { postMessage: vi.fn() } })
    h.deliver(initFor(nonce), { source: null })
    expect(onInit).not.toHaveBeenCalled()
  })

  it('ignores an init with a wrong nonce', () => {
    const h = loadShim()
    const onInit = vi.fn()
    h.api.onInit(onInit)
    h.deliver(initFor('f'.repeat(NONCE_LENGTH)))
    expect(onInit).not.toHaveBeenCalled()
  })

  it('ignores malformed init, wrong envelope and wrong version', () => {
    const h = loadShim()
    const onInit = vi.fn()
    h.api.onInit(onInit)
    const nonce = h.posted()[0]!['nonce']
    h.deliver(initFor(nonce, { session: 42 }))
    h.deliver(initFor(nonce, { dojo: 'other' }))
    h.deliver(initFor(nonce, { v: 1 }))
    h.deliver(null)
    expect(onInit).not.toHaveBeenCalled()
  })

  it('ignores a second init', () => {
    const h = loadShim()
    const hello = handshake(h)
    const onInit = vi.fn()
    h.api.onInit(onInit)
    onInit.mockClear()
    h.deliver(initFor(hello['nonce'], { session: 'sess-2' }))
    h.api.progress('u1')
    expect(h.posted()[1]).toMatchObject({ session: 'sess-1' })
    expect(onInit).not.toHaveBeenCalled()
  })

  it('ignores setLocale and setTheme from another origin, another window or another session', () => {
    const h = loadShim()
    const onLocale = vi.fn()
    const onTheme = vi.fn()
    h.api.onLocale(onLocale)
    h.api.onTheme(onTheme)
    handshake(h)
    const locale = { dojo: 'scroll', v: 0, type: 'setLocale', session: 'sess-1', locale: 'es' }
    h.deliver(locale, { origin: 'https://evil.example' })
    h.deliver(locale, { source: {} })
    h.deliver({ ...locale, session: 'other' })
    h.deliver({ dojo: 'scroll', v: 0, type: 'setTheme', session: 'other', theme: {} })
    expect(onLocale).not.toHaveBeenCalled()
    expect(onTheme).not.toHaveBeenCalled()
  })

  it('ignores setLocale before init', () => {
    const h = loadShim()
    const onLocale = vi.fn()
    h.api.onLocale(onLocale)
    h.deliver({ dojo: 'scroll', v: 0, type: 'setLocale', session: 'sess-1', locale: 'es' })
    expect(onLocale).not.toHaveBeenCalled()
  })
})

describe('scroll-kit: standalone', () => {
  it('persists progress to localStorage and posts nothing when not framed', () => {
    const h = loadShim({ framed: false })
    h.api.progress('u1', { step: 1 })
    h.api.complete('u1')
    h.api.resize(500)
    expect(h.parent.postMessage).not.toHaveBeenCalled()
    expect(JSON.parse(window.localStorage.getItem('dojo-scroll:my-scroll:u1')!)).toEqual({
      completed: true,
      state: { step: 1 },
    })
  })

  it('hydrates onInit from localStorage', () => {
    window.localStorage.setItem('dojo-scroll:my-scroll:u1', JSON.stringify({ completed: true, state: { a: 1 } }))
    window.localStorage.setItem('unrelated', 'x')
    const h = loadShim({ framed: false })
    const onInit = vi.fn()
    h.api.onInit(onInit)
    expect(onInit.mock.calls[0]![0]).toMatchObject({
      standalone: true,
      session: null,
      authenticated: false,
      progress: { u1: { completed: true, state: { a: 1 } } },
    })
  })

  it('stays standalone without a host parameter even when framed', () => {
    const h = loadShim({ search: '', framed: true })
    h.api.progress('u1', { step: 1 })
    expect(h.parent.postMessage).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('dojo-scroll:my-scroll:u1')).not.toBeNull()
  })

  it('refuses a host parameter that is not an http(s) origin', () => {
    const h = loadShim({ search: '?host=javascript:alert(1)', framed: true })
    expect(h.parent.postMessage).not.toHaveBeenCalled()
  })

  it('goes standalone when no init arrives in time, flushing held calls to storage', () => {
    const h = loadShim()
    const onInit = vi.fn()
    h.api.onInit(onInit)
    h.api.progress('u1', { step: 9 })
    vi.advanceTimersByTime(3000)
    expect(onInit.mock.calls[0]![0]).toMatchObject({ standalone: true })
    expect(JSON.parse(window.localStorage.getItem('dojo-scroll:my-scroll:u1')!)).toEqual({
      completed: false,
      state: { step: 9 },
    })
    h.api.progress('u1', { step: 10 })
    expect(h.posted()).toHaveLength(1)
  })

  it('ignores an init that arrives after the fallback', () => {
    const h = loadShim()
    const nonce = h.posted()[0]!['nonce']
    vi.advanceTimersByTime(3000)
    const onLocale = vi.fn()
    h.api.onLocale(onLocale)
    h.deliver(initFor(nonce))
    h.deliver({ dojo: 'scroll', v: 0, type: 'setLocale', session: 'sess-1', locale: 'es' })
    expect(onLocale).not.toHaveBeenCalled()
  })

  it('survives a localStorage that throws', () => {
    const h = loadShim({ framed: false })
    const broken = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => h.api.progress('u1', {})).not.toThrow()
    broken.mockRestore()
  })
})

describe('scroll-kit: source', () => {
  it('has a single postMessage call and it passes an explicit origin', () => {
    const calls = shimSource.split('\n').filter((line) => line.includes('postMessage('))
    expect(calls).toHaveLength(1)
    expect(calls[0]).toContain('hostOrigin')
    expect(shimSource).not.toMatch(/['"]\*['"]/)
  })
})
