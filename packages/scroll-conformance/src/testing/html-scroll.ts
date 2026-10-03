import { randomFillSync } from 'node:crypto'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import type { IncomingMessage, ScrollFactory, SimulatedEnv, SimulatedScroll } from './fake-driver.js'

const SHIM_PATH = new URL('../../../../apps/web/public/scroll-kit/v0.js', import.meta.url)

interface Element {
  textContent: string
  onclick: (() => void) | null
}

function inlineScripts(html: string): string[] {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script[^>]*>/gi)].map((match) => match[1] ?? '')
}

function attributesOf(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]))
}

/** Runs the inline scripts of a plain HTML scroll in a stub window, as a stand-in for a browser. */
class HtmlScroll implements SimulatedScroll {
  private listeners: Array<(event: unknown) => void> = []
  private elements = new Map<string, Element>()
  private timers = new Set<NodeJS.Timeout>()
  private parentWindow: unknown

  constructor(
    private readonly html: string,
    private readonly shim: string,
  ) {}

  start(env: SimulatedEnv): void {
    const written: string[] = []
    const storage = new Map<string, string>()
    const document = {
      currentScript: null as unknown,
      documentElement: { scrollHeight: 100 },
      write: (markup: string) => written.push(markup),
      getElementById: (id: string) => this.element(id),
    }
    const sandbox: Record<string, unknown> = {
      document,
      location: { search: env.search, origin: env.scrollOrigin },
      navigator: { language: 'en' },
      crypto: { getRandomValues: (view: Uint8Array) => randomFillSync(view) },
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => void storage.set(key, value),
        key: (index: number) => [...storage.keys()][index] ?? null,
        get length() {
          return storage.size
        },
      },
      URL,
      URLSearchParams,
      console,
      setTimeout: (callback: () => void, ms: number) => {
        const handle = setTimeout(callback, ms)
        this.timers.add(handle)
        return handle
      },
      clearTimeout,
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        if (type === 'message') this.listeners.push(listener)
      },
      postMessage: (data: unknown, targetOrigin: string) => env.post(data, targetOrigin),
    }
    sandbox['window'] = sandbox
    sandbox['self'] = sandbox
    this.parentWindow = env.framed ? { postMessage: sandbox['postMessage'] } : sandbox
    sandbox['parent'] = this.parentWindow
    const context = vm.createContext(sandbox)

    for (const script of inlineScripts(this.html)) {
      // eslint-disable-next-line sonarjs/code-eval -- runs the repo's own fixture page
      vm.runInContext(script, context)
      while (written.length > 0) this.runWrittenShim(written.shift() ?? '', context, document)
    }
  }

  receive(message: IncomingMessage): void {
    const event = {
      origin: message.origin,
      source: message.source === 'parent' ? this.parentWindow : {},
      data: message.data,
    }
    this.listeners.slice().forEach((listener) => listener(event))
  }

  interact(name: string): void {
    this.elements.get(name)?.onclick?.()
  }

  dispose(): void {
    this.timers.forEach(clearTimeout)
  }

  private element(id: string): Element {
    const existing = this.elements.get(id)
    if (existing) return existing
    const created: Element = { textContent: '', onclick: null }
    this.elements.set(id, created)
    return created
  }

  private runWrittenShim(markup: string, context: vm.Context, document: { currentScript: unknown }): void {
    const tag = markup.match(/<script\b([^>]*)>/i)?.[1] ?? ''
    const attributes = attributesOf(tag)
    document.currentScript = { getAttribute: (name: string) => attributes[name] ?? null }
    // eslint-disable-next-line sonarjs/code-eval -- runs the repo's own shim
    vm.runInContext(this.shim, context)
    document.currentScript = null
  }
}

/** A scroll made of an HTML file; the scroll-kit shim is run when the page writes its script tag. */
export function htmlScroll(htmlPath: string, shimPath: URL | string = SHIM_PATH): ScrollFactory {
  const html = readFileSync(htmlPath, 'utf8')
  const shim = readFileSync(shimPath, 'utf8')
  return () => new HtmlScroll(html, shim)
}
