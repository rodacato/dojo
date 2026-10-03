import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ScrollEntryDTO } from '@dojo/shared'
import { ScrollPage } from './ScrollPage'
import { api, ApiError } from '../lib/api'
import type * as ApiModule from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { HELLO_TIMEOUT_MS } from '../lib/scrollHost'

vi.mock('../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof ApiModule>()
  return { ...original, api: { getScroll: vi.fn() } }
})
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

const mockedApi = vi.mocked(api)
const mockedUseAuth = vi.mocked(useAuth)

const ORIGIN = 'https://scrolls.example.com'
const NONCE = 'n'.repeat(24)
const envelope = { dojo: 'scroll', v: 0 }
const hello = {
  ...envelope,
  type: 'hello',
  scroll: { id: 'pattern-circuit', version: '0.1.0' },
  nonce: NONCE,
  capabilities: ['progress'],
}

function entry(overrides: Partial<ScrollEntryDTO['manifest']> = {}): ScrollEntryDTO {
  return {
    id: '3f0c6d0e-0d0e-4a1b-9c1e-0a5a1d2b3c4d',
    slug: 'pattern-circuit',
    status: 'published',
    visibility: 'public',
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    manifest: {
      id: 'pattern-circuit',
      version: '0.1.0',
      protocol: 0,
      entry: `${ORIGIN}/pattern-circuit/index.html`,
      locales: ['en', 'es'],
      title: { en: 'Pattern Circuit', es: 'Circuito de patrones' },
      description: { en: 'Learn patterns', es: 'Aprende patrones' },
      programmingLanguages: ['ruby'],
      units: [{ id: 'u1' }],
      capabilities: ['progress'],
      ...overrides,
    },
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/scrolls/pattern-circuit']}>
      <Routes>
        <Route path="/scrolls/:slug" element={<ScrollPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function fromScroll(iframe: HTMLIFrameElement, data: unknown, origin = ORIGIN) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source: iframe.contentWindow }))
  })
}

beforeEach(() => {
  vi.spyOn(globalThis.navigator, 'language', 'get').mockReturnValue('es-MX')
  mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
  mockedApi.getScroll.mockResolvedValue(entry())
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('ScrollPage — iframe container', () => {
  it('embeds the scroll with the sandbox of ADR 027 and the host origin in the URL', async () => {
    renderPage()
    const iframe = await screen.findByTitle('Circuito de patrones')

    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin')
    expect(iframe).toHaveAttribute('allow', '')
    const src = new URL(iframe.getAttribute('src') ?? '')
    expect(src.origin).toBe(ORIGIN)
    expect(src.searchParams.get('host')).toBe(globalThis.location.origin)
    expect(mockedApi.getScroll).toHaveBeenCalledWith('pattern-circuit')
  })

  it('shows the title and description in the user locale and moves focus to the heading', async () => {
    renderPage()
    const heading = await screen.findByRole('heading', { name: 'Circuito de patrones' })
    expect(screen.getByText('Aprende patrones')).toBeInTheDocument()
    await waitFor(() => expect(heading).toHaveFocus())
  })

  it('falls back to the first manifest locale', async () => {
    vi.spyOn(globalThis.navigator, 'language', 'get').mockReturnValue('ja')
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Pattern Circuit' })).toBeInTheDocument()
  })

  it('announces loading until the handshake completes, then answers hello with init', async () => {
    renderPage()
    const iframe = (await screen.findByTitle('Circuito de patrones')) as HTMLIFrameElement
    const postMessage = vi.spyOn(iframe.contentWindow as Window, 'postMessage').mockImplementation(() => {})
    expect(screen.getByRole('status')).toHaveTextContent(/loading scroll/)

    fromScroll(iframe, hello)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(postMessage).toHaveBeenCalledTimes(1)
    const [message, targetOrigin] = postMessage.mock.calls[0] as unknown as [Record<string, unknown>, string]
    expect(targetOrigin).toBe(ORIGIN)
    expect(message).toMatchObject({ type: 'init', nonce: NONCE, locale: 'es', authenticated: false, capabilities: ['progress'] })
  })

  it('tells the scroll the user is authenticated when signed in', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'u1', username: 'sensei', avatarUrl: 'x', createdAt: '2026-01-01T00:00:00.000Z' },
      loading: false,
      logout: vi.fn(),
    })
    renderPage()
    const iframe = (await screen.findByTitle('Circuito de patrones')) as HTMLIFrameElement
    const postMessage = vi.spyOn(iframe.contentWindow as Window, 'postMessage').mockImplementation(() => {})
    fromScroll(iframe, hello)
    expect(postMessage.mock.calls[0]?.[0]).toMatchObject({ authenticated: true })
  })

  it('resizes the frame from the scroll and ignores a resize from another origin', async () => {
    renderPage()
    const iframe = (await screen.findByTitle('Circuito de patrones')) as HTMLIFrameElement
    const postMessage = vi.spyOn(iframe.contentWindow as Window, 'postMessage').mockImplementation(() => {})
    fromScroll(iframe, hello)
    const session = (postMessage.mock.calls[0]?.[0] as unknown as { session: string }).session

    fromScroll(iframe, { ...envelope, type: 'resize', session, height: 900 })
    expect(iframe.style.height).toBe('900px')

    fromScroll(iframe, { ...envelope, type: 'resize', session, height: 300 }, 'https://evil.example.com')
    expect(iframe.style.height).toBe('900px')
  })

  it('shows what the scroll reports as text, never as markup', async () => {
    renderPage()
    const iframe = (await screen.findByTitle('Circuito de patrones')) as HTMLIFrameElement
    vi.spyOn(iframe.contentWindow as Window, 'postMessage').mockImplementation(() => {})
    fromScroll(iframe, hello)
    fromScroll(iframe, { ...envelope, type: 'error', code: 'internal', message: '<img src=x onerror=alert(1)>' })

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
  })

  it('goes back to loading when the frame reloads and waits for a new hello', async () => {
    renderPage()
    const iframe = (await screen.findByTitle('Circuito de patrones')) as HTMLIFrameElement
    vi.spyOn(iframe.contentWindow as Window, 'postMessage').mockImplementation(() => {})
    fireEvent.load(iframe)
    fromScroll(iframe, hello)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fireEvent.load(iframe)
    expect(screen.getByRole('status')).toBeInTheDocument()
    fromScroll(iframe, hello)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('ScrollPage — no hello (AC5)', () => {
  it('ends in an error state with no frame, then recovers on retry', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    renderPage()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByTitle('Circuito de patrones')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(HELLO_TIMEOUT_MS)
    })

    expect(screen.getByRole('alert')).toHaveTextContent('This scroll did not start.')
    expect(screen.queryByTitle('Circuito de patrones')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByTitle('Circuito de patrones')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not time out when the hello arrives in time', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    renderPage()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const iframe = screen.getByTitle('Circuito de patrones') as HTMLIFrameElement
    vi.spyOn(iframe.contentWindow as Window, 'postMessage').mockImplementation(() => {})
    fromScroll(iframe, hello)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(HELLO_TIMEOUT_MS * 2)
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTitle('Circuito de patrones')).toBeInTheDocument()
  })
})

describe('ScrollPage — never creates the iframe (AC7)', () => {
  it('for an unknown or draft scroll (404)', async () => {
    mockedApi.getScroll.mockRejectedValue(new ApiError(404, 'not found'))
    renderPage()
    expect(await screen.findByText('This scroll is not available.')).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()
    expect(screen.getByRole('link', { name: /browse scrolls/i })).toHaveAttribute('href', '/scrolls')
  })

  it('for a private scroll when anonymous (401)', async () => {
    mockedApi.getScroll.mockRejectedValue(new ApiError(401, 'login required'))
    renderPage()
    expect(await screen.findByText('Sign in to continue.')).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/')
  })

  it('while the request is still pending', () => {
    mockedApi.getScroll.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading/)).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('while authentication is still resolving', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: true, logout: vi.fn() })
    renderPage()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('when the entry is not an https URL', async () => {
    mockedApi.getScroll.mockResolvedValue(entry({ entry: 'http://scrolls.example.com/app/' }))
    renderPage()
    expect(await screen.findByText('This scroll is not available.')).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('on a server failure, offering a retry', async () => {
    mockedApi.getScroll.mockRejectedValueOnce(new ApiError(500, 'boom'))
    renderPage()
    expect(await screen.findByText('The scroll could not be loaded.')).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByTitle('Circuito de patrones')).toBeInTheDocument()
  })
})
