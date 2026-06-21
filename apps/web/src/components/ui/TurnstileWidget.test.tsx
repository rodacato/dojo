import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { render } from '@testing-library/react'

import { TurnstileWidget, type TurnstileHandle } from './TurnstileWidget'

// TurnstileWidget talks to two genuine externals: an injected <script> tag and
// the `window.turnstile` global it attaches. We stub the global and observe the
// injected script. The component caches the script-load promise at MODULE scope
// (`scriptPromise`), so once it resolves it stays resolved for the rest of this
// file. The single script-FAILURE scenario therefore has to be the first effect
// to run — it lives in the leading `describe` and never sets `window.turnstile`
// before mounting, forcing the real <script> + onerror path exactly once.

interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'error-callback'?: (err?: string) => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  appearance?: string
}

interface TurnstileStub {
  render: ReturnType<typeof vi.fn<(el: HTMLElement, opts: TurnstileOptions) => string>>
  remove: ReturnType<typeof vi.fn<(id: string) => void>>
  reset: ReturnType<typeof vi.fn<(id: string) => void>>
  execute: ReturnType<typeof vi.fn<(id: string) => void>>
}

const WIDGET_ID = 'widget-abc'

function installTurnstile(): TurnstileStub {
  const stub: TurnstileStub = {
    render: vi.fn(() => WIDGET_ID),
    remove: vi.fn(),
    reset: vi.fn(),
    execute: vi.fn(),
  }
  window.turnstile = stub
  return stub
}

// The render call lands in a `.then()` (microtask), so a single awaited macro
// flush lets the effect's promise chain settle before we assert.
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

afterEach(() => {
  delete window.turnstile
  document.head.querySelectorAll('script').forEach((s) => s.remove())
})

// MUST run first: this is the only path that exercises the uncached, failing
// script load. After this test, `scriptPromise` is reset to null on error, but
// every later test pre-installs `window.turnstile` so the promise short-circuits
// to resolved and stays that way.
describe('TurnstileWidget — script load failure (runs first)', () => {
  it('injects the Cloudflare script and reports a null token when it fails to load', async () => {
    const onToken = vi.fn()
    render(<TurnstileWidget siteKey="key" onToken={onToken} />)

    const script = document.head.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    )
    expect(script).not.toBeNull()
    expect(script).toHaveAttribute('src', 'https://challenges.cloudflare.com/turnstile/v0/api.js')

    // jsdom never fires network events; drive onerror ourselves.
    script!.onerror?.(new Event('error'))
    await flush()

    expect(onToken).toHaveBeenCalledTimes(1)
    expect(onToken).toHaveBeenCalledWith(null)
  })
})

describe('TurnstileWidget — with the global ready', () => {
  let turnstile: TurnstileStub

  beforeEach(() => {
    turnstile = installTurnstile()
  })

  it('renders the challenge into its own container with the given site key', async () => {
    const onToken = vi.fn()
    const { container } = render(<TurnstileWidget siteKey="my-site-key" onToken={onToken} />)
    await flush()

    expect(turnstile.render).toHaveBeenCalledTimes(1)
    const [el, opts] = turnstile.render.mock.calls[0]!
    expect(el).toBe(container.firstChild)
    expect(opts.sitekey).toBe('my-site-key')
    // Hidden-unless-needed UX; never the deprecated size:'invisible'.
    expect(opts.appearance).toBe('interaction-only')
  })

  it('forwards the earned token to onToken via the success callback', async () => {
    const onToken = vi.fn()
    render(<TurnstileWidget siteKey="key" onToken={onToken} />)
    await flush()

    const opts = turnstile.render.mock.calls[0]![1]
    opts.callback('earned-token-123')

    expect(onToken).toHaveBeenCalledExactlyOnceWith('earned-token-123')
  })

  it.each([
    ['error-callback'] as const,
    ['expired-callback'] as const,
    ['timeout-callback'] as const,
  ])('reports a null token when Turnstile fires its %s', async (event) => {
    const onToken = vi.fn()
    render(<TurnstileWidget siteKey="key" onToken={onToken} />)
    await flush()

    const opts = turnstile.render.mock.calls[0]![1]
    opts[event]?.()

    expect(onToken).toHaveBeenCalledExactlyOnceWith(null)
  })

  it('always reads the latest onToken so a re-render does not call a stale handler', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<TurnstileWidget siteKey="key" onToken={first} />)
    await flush()

    rerender(<TurnstileWidget siteKey="key" onToken={second} />)
    // Same site key -> the effect does not re-run, the widget is rendered once.
    expect(turnstile.render).toHaveBeenCalledTimes(1)

    turnstile.render.mock.calls[0]![1].callback('tok')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledExactlyOnceWith('tok')
  })

  it('resets the live widget through the imperative ref handle', async () => {
    const ref = createRef<TurnstileHandle>()
    render(<TurnstileWidget ref={ref} siteKey="key" onToken={vi.fn()} />)
    await flush()

    ref.current!.reset()
    expect(turnstile.reset).toHaveBeenCalledExactlyOnceWith(WIDGET_ID)
  })

  it('reset is a safe no-op before the widget has mounted (no token earned yet)', () => {
    const ref = createRef<TurnstileHandle>()
    render(<TurnstileWidget ref={ref} siteKey="key" onToken={vi.fn()} />)

    // No flush: render() has not run, so there is no widget id to reset.
    expect(() => ref.current!.reset()).not.toThrow()
    expect(turnstile.reset).not.toHaveBeenCalled()
  })

  it('swallows a throw from turnstile.reset instead of crashing the caller', async () => {
    turnstile.reset.mockImplementation(() => {
      throw new Error('widget destroyed')
    })
    const ref = createRef<TurnstileHandle>()
    render(<TurnstileWidget ref={ref} siteKey="key" onToken={vi.fn()} />)
    await flush()

    expect(() => ref.current!.reset()).not.toThrow()
  })

  it('removes the widget on unmount to free the single-use slot', async () => {
    const { unmount } = render(<TurnstileWidget siteKey="key" onToken={vi.fn()} />)
    await flush()

    unmount()
    expect(turnstile.remove).toHaveBeenCalledExactlyOnceWith(WIDGET_ID)
  })

  it('does not render or report a token when the global vanishes before the promise settles', async () => {
    const onToken = vi.fn()
    // Promise is already resolved (cached) but the global is gone by the time
    // the .then() runs -> the guard bails: no render, no onToken.
    render(<TurnstileWidget siteKey="key" onToken={onToken} />)
    delete window.turnstile
    await flush()

    expect(onToken).not.toHaveBeenCalled()
  })
})
