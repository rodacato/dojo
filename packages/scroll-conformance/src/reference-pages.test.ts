import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { HOST_PAGE, REFERENCE_PAGES, SPOOFER_PAGE } from './reference-pages.js'
import { startPageServer } from './static-server.js'

const scriptOf = (html: string) => html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''

type Listener = (event: { source: unknown; data?: unknown; origin?: string }) => void

function stubWindow(search: string) {
  const listeners: Listener[] = []
  const scrollWindow = { postMessage: vi.fn() }
  const frame = { contentWindow: scrollWindow, src: '' }
  const spoofers: Array<{ style: Record<string, string>; contentWindow: { postMessage: ReturnType<typeof vi.fn> }; src: string; onload?: () => void }> = []
  const window: Record<string, unknown> = {
    addEventListener: (_type: string, listener: Listener) => listeners.push(listener),
    __scRecord: vi.fn(),
  }
  const sandbox = {
    window,
    location: { search },
    URL,
    URLSearchParams,
    document: {
      body: {
        appendChild: (element: { onload?: () => void }) => element.onload?.(),
      },
      getElementById: () => frame,
      createElement: () => {
        const spoofer = { style: {}, contentWindow: { postMessage: vi.fn() }, src: '' }
        spoofers.push(spoofer)
        return spoofer
      },
    },
  }
  return { sandbox, window, listeners, scrollWindow, frame, spoofers }
}

describe('the host page script', () => {
  const frameUrl = 'http://scroll.test/app/index.html?host=http%3A%2F%2F127.0.0.1%3A1'
  const load = () => {
    const stub = stubWindow(`?frame=${encodeURIComponent(frameUrl)}`)
    // eslint-disable-next-line sonarjs/code-eval -- runs the page script this package serves
    vm.runInNewContext(scriptOf(HOST_PAGE), stub.sandbox)
    return stub
  }

  it('loads the scroll URL into the frame', () => {
    expect(load().frame.src).toBe(frameUrl)
  })

  it('records only what the scroll frame sends, with the origin the host saw', () => {
    const { listeners, scrollWindow, window } = load()
    listeners[0]?.({ source: scrollWindow, origin: 'http://scroll.test', data: { type: 'hello' } })
    listeners[0]?.({ source: {}, origin: 'http://elsewhere.test', data: { type: 'noise' } })
    expect(window['__scRecord']).toHaveBeenCalledTimes(1)
    expect(window['__scRecord']).toHaveBeenCalledWith({ origin: 'http://scroll.test', data: { type: 'hello' } })
  })

  it('posts to the scroll with its exact origin as the target', () => {
    const { window, scrollWindow } = load()
    ;(window['__scPost'] as (message: unknown) => void)({ type: 'init' })
    expect(scrollWindow.postMessage).toHaveBeenCalledWith({ type: 'init' }, 'http://scroll.test')
  })

  it('asks a hidden frame on the given origin to post to the scroll', async () => {
    const { window, spoofers } = load()
    await (window['__scSpoof'] as (origin: string, message: unknown) => Promise<void>)('http://other.test', { type: 'init' })
    expect(spoofers).toHaveLength(1)
    expect(spoofers[0]?.src).toBe('http://other.test/spoofer.html')
    expect(spoofers[0]?.contentWindow.postMessage).toHaveBeenCalledWith(
      { message: { type: 'init' }, scrollOrigin: 'http://scroll.test' },
      'http://other.test',
    )
  })
})

describe('the spoofer page script', () => {
  it('forwards a command from its parent to the first frame of the parent, and ignores everyone else', () => {
    const listeners: Listener[] = []
    const scrollWindow = { postMessage: vi.fn() }
    const parent = { frames: [scrollWindow] }
    // eslint-disable-next-line sonarjs/code-eval -- runs the page script this package serves
    vm.runInNewContext(scriptOf(SPOOFER_PAGE), {
      window: { parent, addEventListener: (_type: string, listener: Listener) => listeners.push(listener) },
    })
    listeners[0]?.({ source: {}, data: { message: 'ignored', scrollOrigin: 'http://scroll.test' } })
    expect(scrollWindow.postMessage).not.toHaveBeenCalled()
    listeners[0]?.({ source: parent, data: { message: { type: 'init' }, scrollOrigin: 'http://scroll.test' } })
    expect(scrollWindow.postMessage).toHaveBeenCalledWith({ type: 'init' }, 'http://scroll.test')
  })
})

describe('the host frame', () => {
  it('uses the sandbox the real host uses', () => {
    expect(HOST_PAGE).toContain('sandbox="allow-scripts allow-same-origin" allow=""')
  })
})

describe('startPageServer', () => {
  it('serves the reference pages on two different origins and 404s the rest', async () => {
    const [first, second] = [await startPageServer(REFERENCE_PAGES), await startPageServer(REFERENCE_PAGES)]
    try {
      expect(first.origin).not.toBe(second.origin)
      const page = await fetch(`${first.origin}/host.html?frame=x`)
      expect(page.status).toBe(200)
      expect(page.headers.get('content-type')).toContain('text/html')
      expect(await page.text()).toBe(HOST_PAGE)
      expect((await fetch(`${second.origin}/spoofer.html`)).status).toBe(200)
      expect((await fetch(`${first.origin}/nope`)).status).toBe(404)
    } finally {
      await Promise.all([first.close(), second.close()])
    }
  })
})
