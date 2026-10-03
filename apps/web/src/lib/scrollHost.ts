import {
  SCROLL_PROTOCOL_VERSION,
  hostToScrollMessageSchema,
  scrollToHostMessageSchema,
  type HostToScrollMessage,
  type ScrollCapability,
  type ScrollManifest,
  type ScrollToHostMessage,
} from '@dojo/shared'

export const HELLO_TIMEOUT_MS = 10_000

// `run` and `llm` are reserved by the protocol and never granted.
const GRANTED_CAPABILITIES: readonly ScrollCapability[] = ['progress']

export type ScrollTheme = Record<string, string>

export interface MessageEventLike {
  origin: string
  source: unknown
  data: unknown
}

export interface ScrollFrame {
  postMessage(message: unknown, targetOrigin: string): void
}

export interface ScrollListenerTarget {
  addEventListener(type: 'message', listener: (event: MessageEventLike) => void): void
  removeEventListener(type: 'message', listener: (event: MessageEventLike) => void): void
}

type Message<T extends ScrollToHostMessage['type']> = Extract<ScrollToHostMessage, { type: T }>

export interface ScrollHostCallbacks {
  onReady?: () => void
  onProgress?: (message: Message<'progress'>) => void
  onComplete?: (message: Message<'complete'>) => void
  onResize?: (height: number) => void
  onError?: (message: Message<'error'>) => void
  onTimeout?: () => void
}

export interface ScrollHostOptions {
  frame: ScrollFrame
  listener: ScrollListenerTarget
  scrollOrigin: string
  manifest: Pick<ScrollManifest, 'capabilities'>
  locale: string
  theme: ScrollTheme
  authenticated: boolean
  callbacks?: ScrollHostCallbacks
  helloTimeoutMs?: number
  createSessionId?: () => string
}

export interface ScrollHost {
  setLocale(locale: string): void
  setTheme(theme: ScrollTheme): void
  /** Forget the session and wait for a new `hello`, e.g. after the frame reloaded. */
  reset(): void
  destroy(): void
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1'])

export function scrollOriginOf(entry: string): string | null {
  try {
    const url = new URL(entry)
    if (url.protocol === 'https:') return url.origin
    const loopbackInDev = url.protocol === 'http:' && !import.meta.env.PROD && LOOPBACK_HOSTS.has(url.hostname)
    return loopbackInDev ? url.origin : null
  } catch {
    return null
  }
}

export function withHostParam(entry: string, hostOrigin: string): string {
  const url = new URL(entry)
  url.searchParams.set('host', hostOrigin)
  return url.toString()
}

export function createScrollHost(options: ScrollHostOptions): ScrollHost {
  const {
    frame,
    listener,
    scrollOrigin,
    manifest,
    callbacks = {},
    helloTimeoutMs = HELLO_TIMEOUT_MS,
    createSessionId = () => crypto.randomUUID(),
  } = options

  let locale = options.locale
  let theme = options.theme
  let session: string | null = null
  let closed = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const granted = manifest.capabilities.filter((capability) => GRANTED_CAPABILITIES.includes(capability))

  function send(message: HostToScrollMessage) {
    const parsed = hostToScrollMessageSchema.safeParse(message)
    if (parsed.success) frame.postMessage(parsed.data, scrollOrigin)
  }

  function startTimer() {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (session || closed) return
      closed = true
      callbacks.onTimeout?.()
    }, helloTimeoutMs)
  }

  function handleHello(message: Message<'hello'>) {
    if (session) return
    clearTimeout(timer)
    session = createSessionId()
    send({
      dojo: 'scroll',
      v: SCROLL_PROTOCOL_VERSION,
      type: 'init',
      nonce: message.nonce,
      session,
      locale,
      theme,
      progress: {},
      capabilities: granted,
      userRef: null,
      authenticated: options.authenticated,
    })
    callbacks.onReady?.()
  }

  function handleSessionMessage(message: Exclude<ScrollToHostMessage, { type: 'hello' }>) {
    if (message.session !== session) return
    switch (message.type) {
      case 'progress':
        callbacks.onProgress?.(message)
        break
      case 'complete':
        callbacks.onComplete?.(message)
        break
      case 'resize':
        callbacks.onResize?.(message.height)
        break
    }
  }

  function onMessage(event: MessageEventLike) {
    if (closed) return
    if (event.origin !== scrollOrigin || event.source !== frame) return
    const parsed = scrollToHostMessageSchema.safeParse(event.data)
    if (!parsed.success) return
    const message = parsed.data

    if (message.type === 'hello') {
      handleHello(message)
    } else if (message.type === 'error') {
      if (message.session === undefined || message.session === session) callbacks.onError?.(message)
    } else if (session) {
      handleSessionMessage(message)
    }
  }

  listener.addEventListener('message', onMessage)
  startTimer()

  return {
    setLocale(next) {
      locale = next
      if (session) send({ dojo: 'scroll', v: SCROLL_PROTOCOL_VERSION, type: 'setLocale', session, locale })
    },
    setTheme(next) {
      theme = next
      if (session) send({ dojo: 'scroll', v: SCROLL_PROTOCOL_VERSION, type: 'setTheme', session, theme })
    },
    reset() {
      session = null
      closed = false
      startTimer()
    },
    destroy() {
      closed = true
      clearTimeout(timer)
      listener.removeEventListener('message', onMessage)
    },
  }
}
