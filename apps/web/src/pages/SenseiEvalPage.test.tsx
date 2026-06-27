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

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return {
    ...actual,
    api: {
      getSession: (...args: unknown[]) => getSession(...args),
      submitAttempt: (...args: unknown[]) => submitAttempt(...args),
    },
  }
})

// useEvaluationStream owns a live WebSocket — a genuine boundary. Mock it so
// each test can drive a deterministic stream state and assert the wired
// connect/submit calls.
const connect = vi.fn()
const submit = vi.fn()
let streamState: EvalStreamState = { status: 'idle' }

vi.mock('../hooks/useEvaluationStream', () => ({
  useEvaluationStream: () => ({ state: streamState, connect, submit, reconnect: vi.fn() }),
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
  streamState = { status: 'idle' }
  getSession.mockResolvedValue(makeSession())
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

    // Bottom band falls back to the evaluating affordance.
    expect(screen.getByText('The sensei is evaluating.')).toBeInTheDocument()
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

  it('renders the verdict block with CTA on a final evaluation', async () => {
    streamState = {
      status: 'complete',
      tokens: 'Nice work.',
      result: makeResult({ verdict: 'passed_with_notes', topicsToReview: ['idempotency'] }),
    }
    renderPage()

    expect(await screen.findByRole('heading', { name: 'PASSED WITH NOTES' })).toBeInTheDocument()
    expect(screen.getByText('idempotency')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE')).toBeInTheDocument()
    expect(screen.getByText('The sensei has spoken.')).toBeInTheDocument()
    // No follow-up answer box on a terminal verdict.
    expect(screen.queryByPlaceholderText('Your answer...')).not.toBeInTheDocument()
  })

  it('navigates to the full result analysis from the verdict CTA', async () => {
    streamState = {
      status: 'complete',
      tokens: 't',
      result: makeResult({ verdict: 'needs_work' }),
    }
    const user = userEvent.setup()
    renderPage('sess-9')

    await user.click(await screen.findByRole('button', { name: /View full analysis/i }))
    expect(navigate).toHaveBeenCalledWith('/katas/sess-9/result')
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
    streamState = { status: 'error', code: 'WS_ERROR', message: 'Connection error' }
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
})
