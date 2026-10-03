import type { BrowserDriver, FramedOptions, FramedPage, RawMessage, StandalonePage } from '../browser.js'

export interface IncomingMessage {
  origin: string
  /** The window the message came from: the parent frame or some other window. */
  source: 'parent' | 'other'
  data: unknown
}

export interface SimulatedEnv {
  search: string
  framed: boolean
  scrollOrigin: string
  /** `window.parent.postMessage`: delivered only to a page whose origin matches `targetOrigin`, or to anyone for `*`. */
  post(data: unknown, targetOrigin: string): void
}

/** A scroll running in process instead of in a browser. */
export interface SimulatedScroll {
  start(env: SimulatedEnv): void
  receive(message: IncomingMessage): void
  /** Stands in for a click inside the scroll. */
  interact?(name: string): void
  dispose?(): void
}

export type ScrollFactory = () => SimulatedScroll

export interface FakeHostPage {
  interact(name: string): void
}

const nextTick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export class FakeDriver implements BrowserDriver {
  readonly origins = { host: 'http://host.test', third: 'http://third.test' }
  started = 0
  stopped = 0
  private readonly scrollOrigin: string

  constructor(
    private readonly createScroll: ScrollFactory,
    scrollUrl: string,
  ) {
    this.scrollOrigin = new URL(scrollUrl).origin
  }

  async start(): Promise<void> {
    this.started += 1
  }

  async stop(): Promise<void> {
    this.stopped += 1
  }

  async openFramed(options: FramedOptions): Promise<FramedPage> {
    const parentOrigin = options.parent === 'host' ? this.origins.host : this.origins.third
    const otherOrigin = options.parent === 'host' ? this.origins.third : this.origins.host
    const scroll = this.createScroll()
    const listeners: Array<(message: RawMessage) => void> = []
    const opened = performance.now()
    const now = () => performance.now() - opened
    const search = options.hostParam === null ? '' : `?host=${encodeURIComponent(options.hostParam)}`
    const env: SimulatedEnv = {
      search,
      framed: true,
      scrollOrigin: this.scrollOrigin,
      post: (data, targetOrigin) => {
        if (targetOrigin !== '*' && targetOrigin !== parentOrigin) return
        listeners.forEach((listener) => listener({ origin: this.scrollOrigin, data: structuredClone(data), at: now() }))
      },
    }
    setTimeout(() => {
      try {
        scroll.start(env)
      } catch {
        // an uncaught error inside a framed scroll is only observable when it runs standalone
      }
    }, 0)
    const hostPage: FakeHostPage = { interact: (name) => scroll.interact?.(name) }
    return {
      hostOrigin: parentOrigin,
      otherOrigin,
      scrollOrigin: this.scrollOrigin,
      hostPage,
      onMessage: (listener) => listeners.push(listener),
      now,
      post: async (message, from) => {
        await nextTick()
        scroll.receive({
          origin: from === 'other-origin' ? otherOrigin : parentOrigin,
          source: from === 'host' ? 'parent' : 'other',
          data: structuredClone(message),
        })
      },
      close: async () => scroll.dispose?.(),
    }
  }

  async openStandalone(): Promise<StandalonePage> {
    const scroll = this.createScroll()
    const messages: RawMessage[] = []
    const errors: string[] = []
    const opened = performance.now()
    const env: SimulatedEnv = {
      search: '',
      framed: false,
      scrollOrigin: this.scrollOrigin,
      // an unframed page is its own parent, so it posts to itself
      post: (data, targetOrigin) => {
        if (targetOrigin !== '*' && targetOrigin !== this.scrollOrigin) return
        messages.push({ origin: this.scrollOrigin, data: structuredClone(data), at: performance.now() - opened })
      },
    }
    try {
      scroll.start(env)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
    return { messages, errors, close: async () => scroll.dispose?.() }
  }
}
