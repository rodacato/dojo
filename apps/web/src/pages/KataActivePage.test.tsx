import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { SessionWithKata } from '../lib/api'
import { ApiError } from '../lib/api'
import { KataActivePage } from './KataActivePage'

// react-resizable-panels' Group reads ResizeObserver in a layout effect;
// jsdom does not implement it. Stub a no-op so the loaded shell mounts.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub)

const navigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigate }
})

const getSession = vi.fn()
const submitAttempt = vi.fn()
const streamSessionBody = vi.fn()

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>()
  return {
    ...actual,
    api: {
      getSession: (...args: unknown[]) => getSession(...args),
      submitAttempt: (...args: unknown[]) => submitAttempt(...args),
      streamSessionBody: (...args: unknown[]) => streamSessionBody(...args),
    },
  }
})

function makeSession(overrides: Partial<SessionWithKata> = {}): SessionWithKata {
  return {
    id: 'sess-1',
    body: '## The brief\n\nDesign a rate limiter.',
    status: 'active',
    startedAt: new Date().toISOString(),
    completedAt: null,
    variationId: 'var-1',
    ownerRole: 'staff engineer',
    finalAttempt: null,
    kata: {
      id: 'kata-1',
      title: 'Rate Limiter Design',
      description: 'desc',
      duration: 30,
      difficulty: 'medium',
      type: 'chat',
      language: [],
      tags: [],
      starterCode: null,
    },
    ...overrides,
  }
}

function renderPage(sessionId = 'sess-1') {
  return render(
    <MemoryRouter initialEntries={[`/kata/${sessionId}`]}>
      <Routes>
        <Route path="/kata/:id" element={<KataActivePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  navigate.mockReset()
  getSession.mockReset()
  submitAttempt.mockReset()
  streamSessionBody.mockReset()
})

describe('KataActivePage', () => {
  it('shows the preparing spinner while the session request is pending', () => {
    getSession.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('The sensei is reading your brief...')).toBeInTheDocument()
    // Nothing from the loaded shell should be on screen yet.
    expect(screen.queryByRole('heading', { name: 'Rate Limiter Design' })).not.toBeInTheDocument()
  })

  it('reads the :id param from the URL when fetching the session', async () => {
    getSession.mockReturnValue(new Promise(() => {}))

    renderPage('sess-from-url')

    await waitFor(() => expect(getSession).toHaveBeenCalledWith('sess-from-url'))
  })

  it('renders the active kata shell once the session loads', async () => {
    getSession.mockResolvedValue(makeSession())

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Rate Limiter Design' }),
    ).toBeInTheDocument()
    // ownerRole is surfaced as an uppercased badge.
    expect(screen.getByText('[STAFF ENGINEER]')).toBeInTheDocument()
    // Markdown body renders through KataBody (real child).
    expect(screen.getByRole('heading', { name: 'The brief' })).toBeInTheDocument()
    // The preparing message is gone.
    expect(screen.queryByText('The sensei is reading your brief...')).not.toBeInTheDocument()
  })

  it('shows the error UI when prep failed with a non-retryable API error', async () => {
    getSession.mockRejectedValue(new ApiError(404, 'not_found'))

    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Something went wrong preparing your kata.')).toBeInTheDocument()
    // The kata shell must NOT render in the error state.
    expect(screen.queryByRole('heading', { name: 'Rate Limiter Design' })).not.toBeInTheDocument()
  })

  it('shows the error UI when the server marks the session failed with no attempt', async () => {
    getSession.mockResolvedValue(makeSession({ status: 'failed', finalAttempt: null }))

    renderPage()

    expect(
      await screen.findByText('Something went wrong preparing your kata.'),
    ).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('routes the error CTA back to the katas picker', async () => {
    const user = userEvent.setup()
    getSession.mockRejectedValue(new ApiError(403, 'forbidden'))

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Start a new kata' }))
    expect(navigate).toHaveBeenCalledWith('/katas')
  })

  it('redirects a completed session to its result page', async () => {
    getSession.mockResolvedValue(
      makeSession({ status: 'completed' }),
    )

    renderPage('sess-done')

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/kata/sess-done/result', { replace: true }),
    )
  })

  it('submits the typed response and navigates to the eval screen', async () => {
    const user = userEvent.setup()
    getSession.mockResolvedValue(makeSession())
    submitAttempt.mockResolvedValue({ attemptId: 'att-99' })

    renderPage('sess-1')

    await screen.findByRole('heading', { name: 'Rate Limiter Design' })

    // fireEvent.change sets the controlled value in one shot; userEvent.type
    // is flaky against this textarea's keydown handler + spellCheck=false.
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'My approach: token bucket.' },
    })

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() =>
      expect(submitAttempt).toHaveBeenCalledWith('sess-1', 'My approach: token bucket.'),
    )
    expect(navigate).toHaveBeenCalledWith('/kata/sess-1/eval')
  })

  it('keeps Submit disabled until the user writes a response, then enables it', async () => {
    getSession.mockResolvedValue(makeSession())

    renderPage()

    await screen.findByRole('heading', { name: 'Rate Limiter Design' })

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    expect(submitAttempt).not.toHaveBeenCalled()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'token bucket' } })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled(),
    )
  })
})
