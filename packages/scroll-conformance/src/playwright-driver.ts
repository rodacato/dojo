import { chromium, type Browser, type Page } from '@playwright/test'
import {
  withHostParam,
  type BrowserDriver,
  type FramedOptions,
  type FramedPage,
  type RawMessage,
  type Sender,
  type StandalonePage,
} from './browser.js'
import { REFERENCE_PAGES } from './reference-pages.js'
import { startPageServer, type PageServer } from './static-server.js'

interface PageHooks {
  __scPost(message: unknown): void
  __scSpoof(spooferOrigin: string, message: unknown): Promise<void>
}

/** Chromium through Playwright, with the reference host served from two local origins. */
export class PlaywrightDriver implements BrowserDriver {
  private browser: Browser | undefined
  private servers: { host: PageServer; third: PageServer } | undefined

  get origins(): { host: string; third: string } {
    if (!this.servers) throw new Error('the driver has not been started')
    return { host: this.servers.host.origin, third: this.servers.third.origin }
  }

  async start(): Promise<void> {
    this.servers = { host: await startPageServer(REFERENCE_PAGES), third: await startPageServer(REFERENCE_PAGES) }
    this.browser = await chromium.launch({ headless: true })
  }

  async stop(): Promise<void> {
    await this.browser?.close()
    await this.servers?.host.close()
    await this.servers?.third.close()
  }

  async openFramed(options: FramedOptions): Promise<FramedPage> {
    const { host, third } = this.origins
    const hostOrigin = options.parent === 'host' ? host : third
    const otherOrigin = options.parent === 'host' ? third : host
    const { page, messages, close, now } = await this.newPage()
    const listeners: Array<(message: RawMessage) => void> = []
    await page.exposeFunction('__scRecord', (message: { origin: string; data: unknown }) => {
      const raw = { ...message, at: now() }
      messages.push(raw)
      listeners.forEach((listener) => listener(raw))
    })
    const frameUrl = options.hostParam === null ? options.scrollUrl : withHostParam(options.scrollUrl, options.hostParam)
    await page.goto(`${hostOrigin}/host.html?frame=${encodeURIComponent(frameUrl)}`, { waitUntil: 'domcontentloaded' })

    const post = async (message: unknown, from: Sender) => {
      if (from === 'host') {
        await page.evaluate((payload) => (window as unknown as PageHooks).__scPost(payload), message)
        return
      }
      const spooferOrigin = from === 'other-origin' ? otherOrigin : hostOrigin
      await page.evaluate(
        ([origin, payload]) => (window as unknown as PageHooks).__scSpoof(origin as string, payload),
        [spooferOrigin, message] as const,
      )
    }

    return {
      hostOrigin,
      otherOrigin,
      scrollOrigin: new URL(options.scrollUrl).origin,
      hostPage: page,
      onMessage: (listener) => listeners.push(listener),
      post,
      now,
      close,
    }
  }

  async openStandalone(scrollUrl: string): Promise<StandalonePage> {
    const { page, messages, close, now } = await this.newPage()
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.exposeFunction('__scRecord', (message: { origin: string; data: unknown }) => {
      messages.push({ ...message, at: now() })
    })
    await page.addInitScript(() => {
      window.addEventListener('message', (event) => {
        ;(window as unknown as { __scRecord(message: unknown): void }).__scRecord({ origin: event.origin, data: event.data })
      })
    })
    await page.goto(scrollUrl, { waitUntil: 'domcontentloaded' })
    return { messages, errors, close }
  }

  private async newPage(): Promise<{
    page: Page
    messages: RawMessage[]
    close: () => Promise<void>
    now: () => number
  }> {
    if (!this.browser) throw new Error('the driver has not been started')
    const context = await this.browser.newContext()
    const opened = performance.now()
    return {
      page: await context.newPage(),
      messages: [],
      close: () => context.close(),
      now: () => performance.now() - opened,
    }
  }
}
