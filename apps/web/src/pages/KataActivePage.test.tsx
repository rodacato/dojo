import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type * as RouterDom from 'react-router-dom'
import type { SessionWithKata } from '../lib/api'
import type * as ApiModule from '../lib/api'
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
  const actual = await importOriginal<typeof RouterDom>()
  return { ...actual, useNavigate: () => navigate }
})

const getSession = vi.fn()
const submitAttempt = vi.fn()
const submitPointAttempt = vi.fn()
const streamSessionBody = vi.fn()

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return {
    ...actual,
    api: {
      getSession: (...args: unknown[]) => getSession(...args),
      submitAttempt: (...args: unknown[]) => submitAttempt(...args),
      submitPointAttempt: (...args: unknown[]) => submitPointAttempt(...args),
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
    answer: null,
    earnedPieces: [],
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
    <MemoryRouter initialEntries={[`/katas/${sessionId}`]}>
      <Routes>
        <Route path="/katas/:id" element={<KataActivePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  sessionStorage.clear()
  navigate.mockReset()
  getSession.mockReset()
  submitAttempt.mockReset()
  submitPointAttempt.mockReset()
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
      await screen.findByRole('heading', { name: 'Something went wrong preparing your kata.' }),
    ).toBeInTheDocument()
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

  it('offers the dashboard and the chooser when preparation fails', async () => {
    const user = userEvent.setup()
    getSession.mockRejectedValue(new ApiError(403, 'forbidden'))

    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Back to dashboard' }))
    expect(navigate).toHaveBeenCalledWith('/dashboard')
    expect(screen.getByRole('link', { name: 'Choose a kata →' })).toHaveAttribute('href', '/katas')
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  })

  it('shows no clock and no answer controls while the kata is preparing', () => {
    getSession.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Preparing your kata' })).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Leave' })).not.toBeInTheDocument()
  })

  it('redirects a completed session to its result page', async () => {
    getSession.mockResolvedValue(
      makeSession({ status: 'completed' }),
    )

    renderPage('sess-done')

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/katas/sess-done/result', { replace: true }),
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
    expect(navigate).toHaveBeenCalledWith('/katas/sess-1/eval')
  })

  it('says so when a submit fails, keeps the answer and lets the learner retry', async () => {
    const user = userEvent.setup()
    getSession.mockResolvedValue(makeSession())
    submitAttempt.mockRejectedValueOnce(new ApiError(500, 'internal'))
    submitAttempt.mockResolvedValueOnce({ attemptId: 'att-99' })

    renderPage('sess-1')
    await screen.findByRole('heading', { name: 'Rate Limiter Design' })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Token bucket.' } })

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Your answer didn't go through.")
    expect(screen.getByRole('textbox')).toHaveValue('Token bucket.')
    expect(navigate).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/katas/sess-1/eval'))
  })

  it.each([408, 409])('routes to the result when the server answers %i', async (status) => {
    const user = userEvent.setup()
    getSession.mockResolvedValue(makeSession())
    submitAttempt.mockRejectedValue(new ApiError(status, 'closed'))

    renderPage('sess-1')
    await screen.findByRole('heading', { name: 'Rate Limiter Design' })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Too late.' } })

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/katas/sess-1/result'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('offers a way out when time runs out with no answer', async () => {
    const user = userEvent.setup()
    const startedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    getSession.mockResolvedValue(makeSession({ startedAt }))

    renderPage('sess-1')

    const viewResult = await screen.findByRole('button', { name: 'View result' }, { timeout: 2000 })
    await user.click(viewResult)

    expect(navigate).toHaveBeenCalledWith('/katas/sess-1/result')
    expect(submitAttempt).not.toHaveBeenCalled()
  })

  it('stops asking to leave once time has run out', async () => {
    const user = userEvent.setup()
    const startedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    getSession.mockResolvedValue(makeSession({ startedAt }))

    renderPage('sess-1')
    await screen.findByRole('button', { name: 'View result' }, { timeout: 2000 })
    expect(screen.getByText('Time expired. No answer was sent.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(navigate).toHaveBeenCalledWith('/dashboard')
    expect(screen.queryByText(/The timer keeps running/)).not.toBeInTheDocument()
  })

  it('submits the answer by itself when time runs out', async () => {
    const startedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    sessionStorage.setItem('dojo-draft-sess-1', 'nearly done')
    getSession.mockResolvedValue(makeSession({ startedAt }))
    submitAttempt.mockResolvedValue({ attemptId: 'att-1' })

    renderPage('sess-1')

    await waitFor(() => expect(submitAttempt).toHaveBeenCalledWith('sess-1', 'nearly done'), { timeout: 2000 })
  })

  it('clears the failure once the learner changes the answer', async () => {
    const user = userEvent.setup()
    getSession.mockResolvedValue(makeSession())
    submitAttempt.mockRejectedValue(new ApiError(500, 'internal'))

    renderPage('sess-1')
    await screen.findByRole('heading', { name: 'Rate Limiter Design' })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Token bucket.' } })
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    await screen.findByRole('alert')

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Leaky bucket.' } })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('announces the last thirty seconds without promising more time', async () => {
    const startedAt = new Date(Date.now() - (30 * 60 - 20) * 1000).toISOString()
    getSession.mockResolvedValue(makeSession({ startedAt }))

    renderPage('sess-1')

    expect(await screen.findByText('Less than thirty seconds remain.')).toBeInTheDocument()
    expect(screen.queryByText(/pause|extend|extra time/i)).not.toBeInTheDocument()
  })

  it('warns that the draft is not kept when this browser cannot store it', async () => {
    const user = userEvent.setup()
    getSession.mockResolvedValue(makeSession())
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    renderPage('sess-1')
    await screen.findByText('Keep this tab open · local storage unavailable')
    await user.click(screen.getByRole('button', { name: 'Leave' }))

    expect(screen.getByText(/could not keep the draft/)).toBeInTheDocument()
    expect(screen.queryByText(/is kept in this browser tab/)).not.toBeInTheDocument()
    setItem.mockRestore()
  })

  describe('offline', () => {
    beforeEach(() => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    })
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('keeps writing, disables sending and says the timer keeps running', async () => {
      getSession.mockResolvedValue(makeSession())
      sessionStorage.setItem('dojo-draft-sess-1', 'my draft')

      renderPage('sess-1')

      expect(await screen.findByText('Offline. Keep writing. The timer keeps running.')).toBeInTheDocument()
      expect(screen.getByText('Reconnect to submit. Your answer is still here.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
      expect(screen.getByRole('textbox')).toBeEnabled()
    })

    it('does not send at the deadline, and lets the learner send on reconnect', async () => {
      const user = userEvent.setup()
      const startedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      sessionStorage.setItem('dojo-draft-sess-1', 'finished offline')
      getSession.mockResolvedValue(makeSession({ startedAt }))
      submitAttempt.mockResolvedValue({ attemptId: 'att-1' })

      renderPage('sess-1')
      const submitNow = await screen.findByRole('button', { name: 'Submit now' }, { timeout: 2000 })
      expect(submitNow).toBeDisabled()
      expect(submitAttempt).not.toHaveBeenCalled()

      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
      fireEvent(globalThis as unknown as Window, new Event('online'))

      await waitFor(() => expect(submitNow).toBeEnabled())
      await user.click(submitNow)
      expect(submitAttempt).toHaveBeenCalledWith('sess-1', 'finished offline')
    })
  })

  it('restores the unsent answer when the learner comes back to the kata', async () => {
    sessionStorage.setItem('dojo-draft-sess-1', 'half-written token bucket')
    getSession.mockResolvedValue(makeSession())

    renderPage('sess-1')

    await screen.findByRole('heading', { name: 'Rate Limiter Design' })
    expect(screen.getByRole('textbox')).toHaveValue('half-written token bucket')
  })

  it('keeps what the learner types so a failed evaluation does not lose it', async () => {
    getSession.mockResolvedValue(makeSession())

    renderPage('sess-1')

    await screen.findByRole('heading', { name: 'Rate Limiter Design' })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'my approach' } })

    await waitFor(() => expect(sessionStorage.getItem('dojo-draft-sess-1')).toBe('my approach'))
  })

  it('does not leak one session\'s draft into another', async () => {
    sessionStorage.setItem('dojo-draft-other', 'someone else')
    getSession.mockResolvedValue(makeSession())

    renderPage('sess-1')

    await screen.findByRole('heading', { name: 'Rate Limiter Design' })
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('asks before leaving and tells the learner the timer keeps running', async () => {
    const user = userEvent.setup()
    getSession.mockResolvedValue(makeSession())

    renderPage('sess-1')
    await screen.findByRole('heading', { name: 'Rate Limiter Design' })

    await user.click(screen.getByRole('button', { name: 'Leave' }))

    expect(screen.getByText(/The timer keeps running/)).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('goes to the dashboard once the learner confirms leaving', async () => {
    const user = userEvent.setup()
    getSession.mockResolvedValue(makeSession())

    renderPage('sess-1')
    await screen.findByRole('heading', { name: 'Rate Limiter Design' })

    await user.click(screen.getByRole('button', { name: 'Leave' }))
    const buttons = screen.getAllByRole('button', { name: 'Leave' })
    await user.click(buttons[buttons.length - 1]!)

    expect(navigate).toHaveBeenCalledWith('/dashboard')
  })

  it('stays on the kata when the learner picks Stay', async () => {
    const user = userEvent.setup()
    getSession.mockResolvedValue(makeSession())

    renderPage('sess-1')
    await screen.findByRole('heading', { name: 'Rate Limiter Design' })

    await user.click(screen.getByRole('button', { name: 'Leave' }))
    await user.click(screen.getByRole('button', { name: 'Stay' }))

    expect(navigate).not.toHaveBeenCalled()
    expect(screen.queryByText(/The timer keeps running/)).not.toBeInTheDocument()
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

  it.each([
    [['ruby'], 'solution.rb', 'Ruby'],
    [['go'], 'solution.go', 'Go'],
    [['ruby', 'python', 'typescript'], 'solution.rb', 'Ruby'],
    [['typescript', 'python'], 'solution.ts', 'TypeScript'],
    [['cobol'], 'solution.js', 'JavaScript'],
    [['constructor'], 'solution.js', 'JavaScript'],
  ])('labels a %j code kata as %s', async (language, filename, label) => {
    const session = makeSession()
    getSession.mockResolvedValue({
      ...session,
      kata: { ...session.kata, type: 'code', language },
    })

    renderPage()

    expect(await screen.findByText(filename)).toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  describe('point kata', () => {
    function pointSession(): SessionWithKata {
      const base = makeSession()
      return makeSession({
        body: 'Pages are 1-based.',
        kata: {
          ...base.kata,
          title: 'Off-by-one in pagination',
          type: 'review',
          language: ['typescript'],
          starterCode: 'function paginate() {\n  const start = page * limit\n}\n',
          answerShape: 'point',
        },
      })
    }

    it('submits the tapped line and the why once both are given', async () => {
      const user = userEvent.setup()
      getSession.mockResolvedValue(pointSession())
      submitPointAttempt.mockResolvedValue({ attemptId: 'att-7' })

      renderPage('sess-1')

      await screen.findByText('Tap the line with the bug.')
      expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(3)
      const submitButton = screen.getByRole('button', { name: 'Submit' })

      await user.click(screen.getByRole('button', { name: /const start = page \* limit/ }))
      expect(screen.getByText("Line 2 selected. Now say why it's wrong.")).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      fireEvent.change(screen.getByLabelText('Why is it wrong?'), { target: { value: 'page 1 skips a page.' } })
      await waitFor(() => expect(submitButton).toBeEnabled())
      await user.click(submitButton)

      await waitFor(() => expect(submitPointAttempt).toHaveBeenCalledWith('sess-1', 2, 'page 1 skips a page.'))
      expect(submitAttempt).not.toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith('/katas/sess-1/eval')
    })

    it('keeps Submit disabled with a why but no tapped line', async () => {
      getSession.mockResolvedValue(pointSession())

      renderPage('sess-1')

      fireEvent.change(await screen.findByLabelText('Why is it wrong?'), { target: { value: 'something is off' } })
      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    })

    it('asks for the line when only the why is written', async () => {
      getSession.mockResolvedValue(pointSession())

      renderPage('sess-1')

      fireEvent.change(await screen.findByLabelText('Why is it wrong?'), { target: { value: 'page 1 skips' } })
      expect(screen.getByText('Choose a line to continue.')).toBeInTheDocument()
      expect(screen.getByText('No line selected')).toBeInTheDocument()
    })

    it('locks the line and the why while submitting', async () => {
      const user = userEvent.setup()
      sessionStorage.setItem('dojo-point-sess-1', '2')
      sessionStorage.setItem('dojo-draft-sess-1', 'page 1 skips a page.')
      getSession.mockResolvedValue(pointSession())
      submitPointAttempt.mockReturnValue(new Promise(() => {}))

      renderPage('sess-1')
      await user.click(await screen.findByRole('button', { name: 'Submit' }))

      expect(screen.getByRole('button', { name: /const start/ })).toBeDisabled()
      expect(screen.getByLabelText('Why is it wrong?')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Leave' })).toBeDisabled()
    })

    it('keeps an unfinished draft readable and locked after the deadline', async () => {
      const session = pointSession()
      sessionStorage.setItem('dojo-draft-sess-1', 'half a thought')
      getSession.mockResolvedValue({ ...session, startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() })

      renderPage('sess-1')

      expect(await screen.findByRole('button', { name: 'View result' }, { timeout: 2000 })).toBeEnabled()
      expect(screen.getByText('Time expired. Your draft is here.')).toBeInTheDocument()
      expect(screen.getByText('Draft kept in this tab')).toBeInTheDocument()
      expect(screen.getByLabelText('Why is it wrong?')).toHaveValue('half a thought')
      expect(screen.getByLabelText('Why is it wrong?')).toHaveAttribute('readonly')
      expect(screen.getByRole('button', { name: /const start/ })).toBeDisabled()
      expect(submitPointAttempt).not.toHaveBeenCalled()
    })

    it('starts the why empty instead of copying the code into it', async () => {
      getSession.mockResolvedValue(pointSession())

      renderPage('sess-1')

      expect(await screen.findByLabelText('Why is it wrong?')).toHaveValue('')
    })

    it('restores the tapped line when the learner comes back', async () => {
      sessionStorage.setItem('dojo-point-sess-1', '2')
      getSession.mockResolvedValue(pointSession())

      renderPage('sess-1')

      expect(await screen.findByRole('button', { name: /const start/ })).toHaveAttribute('aria-pressed', 'true')
    })
  })
})
