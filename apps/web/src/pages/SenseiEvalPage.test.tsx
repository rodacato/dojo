import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type * as RouterDom from 'react-router-dom'
import type { SessionWithKata } from '../lib/api'
import type * as ApiModule from '../lib/api'
import type {
  EvalStreamState,
  EvaluationResult,
} from '../hooks/useEvaluationStream'
import { SenseiEvalPage } from './SenseiEvalPage'

// scrollTo is called in a layout effect on the conversation column; jsdom
// does not implement Element.prototype.scrollTo.
Element.prototype.scrollTo = vi.fn()

const navigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterDom>()
  return { ...actual, useNavigate: () => navigate }
})

const getSession = vi.fn()
const submitAttempt = vi.fn()
const startDailyKata = vi.fn()
const getFeedback = vi.fn()

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return {
    ...actual,
    api: {
      getSession: (...args: unknown[]) => getSession(...args),
      submitAttempt: (...args: unknown[]) => submitAttempt(...args),
      startDailyKata: (...args: unknown[]) => startDailyKata(...args),
      getFeedback: (...args: unknown[]) => getFeedback(...args),
    },
  }
})

// useEvaluationStream owns a live WebSocket — a genuine boundary. Mock it so
// each test can drive a deterministic stream state and assert the wired
// connect/submit calls.
const connect = vi.fn()
const submit = vi.fn()
const reconnect = vi.fn()
let streamState: EvalStreamState = { status: 'idle' }

vi.mock('../hooks/useEvaluationStream', () => ({
  useEvaluationStream: () => ({ state: streamState, connect, submit, reconnect }),
}))

function makeSession(overrides: Partial<SessionWithKata> = {}): SessionWithKata {
  return {
    id: 'sess-1',
    body: 'brief',
    status: 'active',
    startedAt: new Date().toISOString(),
    completedAt: null,
    variationId: 'var-1',
    ownerRole: 'Staff Engineer',
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

function makeResult(overrides: Partial<EvaluationResult> = {}): EvaluationResult {
  return {
    verdict: 'passed',
    analysis: 'Solid reasoning about token buckets.',
    topicsToReview: [],
    followUpQuestion: null,
    isFinalEvaluation: true,
    ...overrides,
  }
}

function renderPage(sessionId = 'sess-1') {
  return render(
    <MemoryRouter initialEntries={[`/katas/${sessionId}/eval`]}>
      <Routes>
        <Route path="/katas/:id/eval" element={<SenseiEvalPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  streamState = { status: 'idle' }
  getSession.mockResolvedValue(makeSession())
  getFeedback.mockResolvedValue({ submitted: false })
})

describe('SenseiEvalPage', () => {
  it('reads the session id from the route and opens the stream', async () => {
    streamState = { status: 'connecting' }
    renderPage('sess-42')

    await waitFor(() => expect(getSession).toHaveBeenCalledWith('sess-42'))
    expect(connect).toHaveBeenCalled()
  })

  it('shows the evaluating waiting state with no verdict while connecting', async () => {
    streamState = { status: 'connecting' }
    renderPage()

    expect(screen.getByText('The sensei is reviewing your work...')).toBeInTheDocument()
    expect(screen.getByText('CONNECTING')).toBeInTheDocument()
    // No verdict and no answer box until the stream resolves.
    expect(screen.queryByRole('heading', { name: 'PASSED' })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Your answer...')).not.toBeInTheDocument()
  })

  it('renders the kata header once the session loads', async () => {
    streamState = { status: 'connecting' }
    renderPage()

    expect(await screen.findByText('Rate Limiter Design')).toBeInTheDocument()
    expect(screen.getByText('CHAT')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
  })

  it('renders streamed sensei tokens and flags STREAMING status', async () => {
    streamState = { status: 'streaming', tokens: 'Walking through your approach' }
    renderPage()

    expect(await screen.findByText('Walking through your approach')).toBeInTheDocument()
    expect(screen.getByText('STREAMING')).toBeInTheDocument()
  })

  it('turns into the result in place on a final evaluation, without leaving the screen (D60)', async () => {
    streamState = {
      status: 'complete',
      tokens: 'Nice work.\n\n<strengths>\n- named the bucket refill\n</strengths>',
      result: makeResult({ verdict: 'passed_with_notes', topicsToReview: ['idempotency'] }),
    }
    renderPage()

    expect(await screen.findByRole('heading', { name: 'PASSED WITH NOTES' })).toBeInTheDocument()
    expect(screen.getByText('idempotency')).toBeInTheDocument()
    expect(screen.getByText('named the bucket refill')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Your answer...')).not.toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('never shows the insight tags while the sensei is still writing them', async () => {
    streamState = { status: 'streaming', tokens: 'Walking through your approach.\n\n<strengths>\n- trac' }
    renderPage()

    expect(await screen.findByText('Walking through your approach.')).toBeInTheDocument()
    expect(screen.queryByText(/strengths/)).not.toBeInTheDocument()
  })

  it('ends on Done, with one more kata and share beside it', async () => {
    streamState = { status: 'complete', tokens: 't', result: makeResult({ verdict: 'needs_work' }) }
    startDailyKata.mockResolvedValue({ sessionId: 'next-1' })
    const user = userEvent.setup()
    renderPage('sess-9')

    await user.click(await screen.findByRole('button', { name: 'Done' }))
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true })

    await user.click(screen.getByRole('button', { name: 'One more kata' }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/katas/next-1'))
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
  })

  it('asks the trial questions above Done, where the kata now ends (D62)', async () => {
    streamState = { status: 'complete', tokens: 't', result: makeResult() }
    renderPage('sess-4')

    const timing = await screen.findByRole('group', { name: 'Was the time limit right?' })
    const done = screen.getByRole('button', { name: 'Done' })
    expect(timing.compareDocumentPosition(done) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(getFeedback).toHaveBeenCalledWith('sess-4')
  })

  it('keeps the feedback out while the sensei is still writing', async () => {
    streamState = { status: 'streaming', tokens: 'Looking' }
    renderPage()

    await screen.findByText('Looking')
    expect(screen.queryByRole('group', { name: 'Was the time limit right?' })).not.toBeInTheDocument()
    expect(getFeedback).not.toHaveBeenCalled()
  })

  describe('point kata', () => {
    const code = 'function f(page) {\n  const start = page * limit\n  return start\n}\n'
    const pointSession = (answer: SessionWithKata['answer']) =>
      makeSession({
        kata: { ...makeSession().kata, type: 'review', starterCode: code },
        finalAttempt: {
          id: 'a1',
          userResponse: 'Line 3: return start\n\nIt returns the wrong page.',
          verdict: null,
          analysis: '',
          topicsToReview: [],
          isFinalEvaluation: false,
          submittedAt: '2026-10-19T10:00:00.000Z',
        },
        answer,
      })

    it('shows the line and why the learner gave while the sensei writes, and no answer yet', async () => {
      getSession.mockResolvedValue(pointSession(null))
      streamState = { status: 'streaming', tokens: 'Looking at it' }
      renderPage()

      expect(await screen.findByRole('heading', { name: /You pointed at line 3/i })).toBeInTheDocument()
      expect(screen.getByText('It returns the wrong page.')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /The answer/i })).not.toBeInTheDocument()
    })

    it('reveals the answer once the verdict is final', async () => {
      getSession.mockResolvedValue(pointSession({ line: 2, title: 'start is a page late', why: 'page is 1-based.' }))
      streamState = { status: 'complete', tokens: 'Close.', result: makeResult({ verdict: 'needs_work' }) }
      renderPage()

      expect(await screen.findByRole('heading', { name: /The answer · line 2/i })).toBeInTheDocument()
      expect(screen.getByText('start is a page late')).toBeInTheDocument()
      expect(screen.getByText('page is 1-based.')).toBeInTheDocument()
    })
  })

  it('shows the follow-up question with an answer box and submits it', async () => {
    streamState = {
      status: 'evaluation',
      tokens: 'Good start.',
      result: makeResult({
        isFinalEvaluation: false,
        followUpQuestion: 'How would you handle a clock skew?',
      }),
    }
    submitAttempt.mockResolvedValue({ attemptId: 'att-7' })
    const user = userEvent.setup()
    renderPage('sess-3')

    expect(
      await screen.findByText('How would you handle a clock skew?'),
    ).toBeInTheDocument()

    const box = screen.getByPlaceholderText('Your answer...')
    const send = screen.getByRole('button', { name: /Send/i })
    expect(send).toBeDisabled()

    await user.type(box, 'Use a logical clock.')
    expect(send).toBeEnabled()

    await user.click(send)

    await waitFor(() =>
      expect(submitAttempt).toHaveBeenCalledWith('sess-3', 'Use a logical clock.'),
    )
    await waitFor(() => expect(submit).toHaveBeenCalledWith('att-7'))
  })

  it('shows the error state and reconnects via Try again', async () => {
    streamState = { status: 'error', code: 'WS_ERROR', message: 'Connection error', tokens: '' }
    const user = userEvent.setup()
    renderPage('sess-5')

    expect(
      await screen.findByText("The sensei couldn't evaluate your response."),
    ).toBeInTheDocument()
    expect(screen.getByText('Connection error')).toBeInTheDocument()
    expect(screen.getByText('ERROR')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'PASSED' })).not.toBeInTheDocument()

    // connect ran once on mount; Try again fires it again.
    const connectCallsBefore = connect.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(connect.mock.calls).toHaveLength(connectCallsBefore + 1)

    await user.click(screen.getByRole('button', { name: 'Back to kata' }))
    expect(navigate).toHaveBeenCalledWith('/katas/sess-5')
  })

  it('offers a way out of the failed evaluation that does not depend on the kata', async () => {
    streamState = { status: 'error', code: 'WS_ERROR', message: 'Connection error', tokens: '' }
    const user = userEvent.setup()
    renderPage('sess-6')

    await user.click(await screen.findByRole('button', { name: 'Dashboard' }))

    expect(navigate).toHaveBeenCalledWith('/dashboard')
  })

  it('keeps the answer and adds no exchange when a follow-up fails to send', async () => {
    streamState = {
      status: 'evaluation',
      tokens: 'Good start.',
      result: makeResult({ isFinalEvaluation: false, followUpQuestion: 'And clock skew?' }),
    }
    submitAttempt.mockRejectedValueOnce(new Error('boom'))
    submitAttempt.mockResolvedValueOnce({ attemptId: 'att-8' })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByPlaceholderText('Your answer...'), 'A logical clock.')
    await user.click(screen.getByRole('button', { name: /Send/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Your answer didn't go through.")
    expect(screen.getByPlaceholderText('Your answer...')).toHaveValue('A logical clock.')
    expect(screen.queryByText('You')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => expect(submit).toHaveBeenCalledWith('att-8'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getAllByText('You')).toHaveLength(1)
  })

  it('keeps the partial review on screen when the stream fails', async () => {
    streamState = { status: 'error', code: 'LLM_STREAM_ERROR', message: 'x', tokens: 'Half a thought.' }

    renderPage()

    expect(await screen.findByText('Half a thought.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  describe('recovering across a reload', () => {
    it('reconnects to the attempt still in flight', async () => {
      sessionStorage.setItem('dojo-attempt-in-flight-sess-1', 'att-1')
      streamState = { status: 'ready' }

      renderPage()

      await waitFor(() => expect(reconnect).toHaveBeenCalledWith('att-1'))
      expect(submit).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    it('submits a new attempt rather than reconnecting to a stale one', async () => {
      sessionStorage.setItem('dojo-attempt-in-flight-sess-1', 'att-old')
      sessionStorage.setItem('dojo-attempt-sess-1', 'att-new')
      streamState = { status: 'ready' }

      renderPage()

      await waitFor(() => expect(submit).toHaveBeenCalledWith('att-new'))
      expect(reconnect).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('dojo-attempt-in-flight-sess-1')).toBe('att-new')
    })

    it('goes to the result when there is no attempt to wait for', async () => {
      streamState = { status: 'ready' }

      renderPage()

      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith('/katas/sess-1/result', { replace: true }),
      )
    })

    it('goes to the result when the server no longer holds the attempt', async () => {
      sessionStorage.setItem('dojo-attempt-in-flight-sess-1', 'att-1')
      streamState = { status: 'error', code: 'ATTEMPT_NOT_FOUND', message: 'ATTEMPT_NOT_FOUND', tokens: '' }

      renderPage()

      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith('/katas/sess-1/result', { replace: true }),
      )
      expect(sessionStorage.getItem('dojo-attempt-in-flight-sess-1')).toBeNull()
    })

    it('forgets the attempt once the verdict is final', async () => {
      sessionStorage.setItem('dojo-attempt-in-flight-sess-1', 'att-1')
      streamState = { status: 'complete', result: makeResult(), tokens: 'Done.' }

      renderPage()

      await waitFor(() =>
        expect(sessionStorage.getItem('dojo-attempt-in-flight-sess-1')).toBeNull(),
      )
    })
  })

  it('does not offer the dashboard exit while the evaluation is healthy', async () => {
    streamState = { status: 'connecting' }
    renderPage('sess-7')

    await screen.findByText('The sensei is reviewing your work...')
    expect(screen.queryByRole('button', { name: 'Dashboard' })).not.toBeInTheDocument()
  })
})
