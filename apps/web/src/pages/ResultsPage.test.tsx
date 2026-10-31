import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import type { KataDTO } from '@dojo/shared'
import { ResultsPage } from './ResultsPage'
import { api, type SessionWithKata, type SessionAttempt } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: {
    getSession: vi.fn(),
    getFeedback: vi.fn(),
    retryEvaluation: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

// jsdom lacks IntersectionObserver; BrushstrokeUnderline constructs one on mount.
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
vi.stubGlobal('IntersectionObserver', NoopIntersectionObserver)

const kata: KataDTO = {
  id: 'k1',
  title: 'Binary Search Boundaries',
  description: 'desc',
  duration: 30,
  difficulty: 'medium',
  type: 'code',
  language: ['ts'],
  tags: [],
}

const ANALYSIS = [
  'You reasoned cleanly about the invariant.',
  '<strengths>',
  '- Solid base case handling',
  '</strengths>',
  '<improvements>',
  '- Watch the off-by-one on the upper bound',
  '</improvements>',
  '<approach_note>',
  'Consider a half-open interval next time.',
  '</approach_note>',
].join('\n')

function makeSession(overrides: Partial<SessionWithKata> = {}): SessionWithKata {
  return {
    id: 's1',
    body: 'Original kata body text.',
    status: 'completed',
    startedAt: '2026-06-20T10:00:00.000Z',
    completedAt: '2026-06-20T10:05:30.000Z',
    kata,
    variationId: 'v1',
    ownerRole: 'staff_engineer',
    finalAttempt: null,
    answer: null,
    earnedPieces: [],
    ...overrides,
  }
}

function makeAttempt(overrides: Partial<SessionAttempt> = {}): SessionAttempt {
  return {
    id: 'a1',
    userResponse: 'function search() { /* my answer */ }',
    verdict: 'passed',
    analysis: ANALYSIS,
    topicsToReview: ['invariants'],
    isFinalEvaluation: true,
    submittedAt: '2026-06-20T10:05:00.000Z',
    ...overrides,
  }
}

function EvalStub() {
  const { state } = useLocation()
  return <div>eval screen from {String((state as { from?: string } | null)?.from)}</div>
}

function renderAt(path = '/results/s1', state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/results/:id" element={<ResultsPage />} />
        <Route path="/dashboard" element={<div>dashboard screen</div>} />
        <Route path="/katas" element={<div>katas screen</div>} />
        <Route path="/katas/:id" element={<div>kata screen</div>} />
        <Route path="/katas/:id/eval" element={<EvalStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedApi.getFeedback.mockResolvedValue({ submitted: false })
})

describe('ResultsPage', () => {
  it('shows the loader while the session request is pending', () => {
    mockedApi.getSession.mockReturnValue(new Promise(() => {}))

    renderAt()

    expect(screen.getByRole('status')).toHaveTextContent('Loading kata result')
    expect(screen.getByRole('heading', { name: 'Kata result' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /PASSED|NEEDS WORK/ })).not.toBeInTheDocument()
  })

  it('reads the session id from the route and renders the verdict result once loaded', async () => {
    mockedApi.getSession.mockResolvedValue(
      makeSession({ finalAttempt: makeAttempt() }),
    )

    renderAt('/results/abc-123')

    expect(
      await screen.findByRole('heading', { name: 'Binary Search Boundaries' }),
    ).toBeInTheDocument()
    expect(mockedApi.getSession).toHaveBeenCalledWith('abc-123')
    await waitFor(() => expect(mockedApi.getFeedback).toHaveBeenCalledWith('abc-123'))

    // Distinct loaded-state content: insights parsed from the analysis.
    expect(screen.getByText('Solid base case handling')).toBeInTheDocument()
    expect(screen.getByText('Watch the off-by-one on the upper bound')).toBeInTheDocument()
    expect(
      screen.getByText('Consider a half-open interval next time.'),
    ).toBeInTheDocument()
    // Completed-in timer derived from start/complete timestamps.
    expect(screen.getByText(/completed in 5:30/)).toBeInTheDocument()
  })

  it('renders the error state and retries the load when "Try again" is clicked', async () => {
    const user = userEvent.setup()
    mockedApi.getSession.mockRejectedValueOnce(new Error('boom'))

    renderAt()

    expect(
      await screen.findByText("We couldn't load this kata result."),
    ).toBeInTheDocument()
    // Error UI is distinct from loaded/loading: no kata heading, no loader.
    expect(screen.queryByText('Loading kata result')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Binary Search Boundaries' }),
    ).not.toBeInTheDocument()

    mockedApi.getSession.mockResolvedValueOnce(
      makeSession({ finalAttempt: makeAttempt() }),
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'Binary Search Boundaries' }),
    ).toBeInTheDocument()
    expect(mockedApi.getSession).toHaveBeenCalledTimes(2)
  })

  it('renders the compact expired layout when a kata ended with no attempt', async () => {
    mockedApi.getSession.mockResolvedValue(
      makeSession({ status: 'failed', finalAttempt: null }),
    )

    renderAt()

    expect(
      await screen.findByText('This kata expired without a submission.'),
    ).toBeInTheDocument()
    // The verdict/share rail must NOT render in this branch.
    expect(screen.queryByText('Share this')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Copy share link' }),
    ).not.toBeInTheDocument()
  })

  it('shows the expired layout for a session the server still calls active', async () => {
    mockedApi.getSession.mockResolvedValue(
      makeSession({ status: 'active', completedAt: null, finalAttempt: null }),
    )

    renderAt()

    expect(
      await screen.findByText('This kata expired without a submission.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose a kata →' })).toBeInTheDocument()
  })

  it('sends an unanswered session with time left back to the kata', async () => {
    mockedApi.getSession.mockResolvedValue(
      makeSession({
        status: 'active',
        startedAt: new Date().toISOString(),
        completedAt: null,
        finalAttempt: null,
      }),
    )

    renderAt()

    expect(await screen.findByText('kata screen')).toBeInTheDocument()
  })

  it('navigates to katas from the expired layout', async () => {
    const user = userEvent.setup()
    mockedApi.getSession.mockResolvedValue(
      makeSession({ status: 'failed', finalAttempt: null }),
    )

    renderAt()
    await screen.findByText('This kata expired without a submission.')

    await user.click(screen.getByRole('button', { name: 'Choose a kata →' }))

    expect(await screen.findByText('katas screen')).toBeInTheDocument()
  })

  it('surfaces the re-evaluation card when an attempt exists without a verdict or analysis', async () => {
    const user = userEvent.setup()
    mockedApi.getSession.mockResolvedValue(
      makeSession({
        finalAttempt: makeAttempt({ verdict: null, analysis: '' }),
      }),
    )
    mockedApi.retryEvaluation.mockResolvedValue({ attemptId: 'a-new' })

    renderAt('/results/s1')

    const retryBtn = await screen.findByRole('button', {
      name: 'Request re-evaluation',
    })
    expect(
      screen.getByText("The sensei couldn't finish evaluating this kata."),
    ).toBeInTheDocument()

    await user.click(retryBtn)

    await waitFor(() =>
      expect(mockedApi.retryEvaluation).toHaveBeenCalledWith('s1'),
    )
    expect(await screen.findByText(/eval screen/)).toBeInTheDocument()
  })

  it('never shows a grade, a revealed answer or the review question for an unfinished evaluation', async () => {
    mockedApi.getSession.mockResolvedValue(
      makeSession({
        finalAttempt: makeAttempt({ verdict: null, analysis: '' }),
        kata: { ...kata, starterCode: 'a\nb\n' },
        answer: { line: 1, title: 'The cause', why: 'because' },
      }),
    )

    renderAt()

    await screen.findByRole('button', { name: 'Request re-evaluation' })
    expect(screen.getByText('UNAVAILABLE')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /PASSED|NEEDS WORK/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: "How was the sensei's review?" })).not.toBeInTheDocument()
    expect(mockedApi.getFeedback).not.toHaveBeenCalled()
  })

  it('offers no encouragement on a verdict or an expired kata', async () => {
    mockedApi.getSession.mockResolvedValue(makeSession({ finalAttempt: makeAttempt({ verdict: 'needs_work' }) }))
    const { unmount } = renderAt()
    await screen.findByRole('heading', { name: 'NEEDS WORK' })
    expect(screen.queryByText(/Consistency compounds/)).not.toBeInTheDocument()
    unmount()

    mockedApi.getSession.mockResolvedValue(makeSession({ status: 'failed', finalAttempt: null }))
    renderAt()
    await screen.findByText('This kata expired without a submission.')
    expect(screen.queryByText(/Consistency compounds/)).not.toBeInTheDocument()
  })

  describe('return link', () => {
    beforeEach(() => {
      mockedApi.getSession.mockResolvedValue(makeSession({ finalAttempt: makeAttempt() }))
    })

    it('goes to the Dashboard without a from', async () => {
      renderAt()

      expect(await screen.findByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    })

    it('goes back to the history page the learner came from, filters included', async () => {
      renderAt('/results/s1', { from: '/history?q=sql&outcome=needs_work&page=2' })

      expect(await screen.findByRole('link', { name: 'Kata history' })).toHaveAttribute(
        'href',
        '/history?q=sql&outcome=needs_work&page=2',
      )
    })

    it.each(['https://evil.example', '//evil.example', '/historical', 42])('ignores a from of %s', async (from) => {
      renderAt('/results/s1', { from })

      expect(await screen.findByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    })

    it('is there while the result loads and when it fails', async () => {
      mockedApi.getSession.mockReturnValue(new Promise(() => {}))
      const { unmount } = renderAt('/results/s1', { from: '/history' })
      expect(screen.getByRole('link', { name: 'Kata history' })).toBeInTheDocument()
      unmount()

      mockedApi.getSession.mockRejectedValue(new Error('boom'))
      renderAt('/results/s1', { from: '/history' })
      await screen.findByText("We couldn't load this kata result.")
      expect(screen.getByRole('link', { name: 'Kata history' })).toBeInTheDocument()
    })

    it('carries the from through a re-evaluation', async () => {
      const user = userEvent.setup()
      mockedApi.getSession.mockResolvedValue(makeSession({ finalAttempt: makeAttempt({ verdict: null, analysis: '' }) }))
      mockedApi.retryEvaluation.mockResolvedValue({ attemptId: 'a-new' })
      renderAt('/results/s1', { from: '/history?page=3' })

      await user.click(await screen.findByRole('button', { name: 'Request re-evaluation' }))

      expect(await screen.findByText('eval screen from /history?page=3')).toBeInTheDocument()
    })
  })

  describe('point kata', () => {
    const pointSession = makeSession({
      kata: { ...kata, type: 'review', starterCode: 'one\ntwo\nthree\nfour\n' },
      finalAttempt: makeAttempt({ userResponse: 'Line 3: three\n\nIt is off by one.', verdict: 'needs_work' }),
      answer: { line: 2, title: 'two is wrong', why: 'Because of two.' },
    })

    it('orders verdict, answer, notes, receipt space and exits, and keeps the why beside them', async () => {
      mockedApi.getSession.mockResolvedValue(pointSession)
      renderAt()

      const verdict = await screen.findByRole('heading', { name: 'NEEDS WORK' })
      const answer = screen.getByRole('heading', { name: 'The answer · line 2' })
      const notes = screen.getByRole('heading', { name: 'Strengths' })
      const timing = await screen.findByRole('group', { name: 'Was the time limit right?' })
      const done = screen.getByRole('button', { name: 'Done' })
      const inOrder = [verdict, answer, notes, timing, done]
      inOrder.slice(1).forEach((el, i) => {
        expect(inOrder[i]!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      })
      expect(screen.getByRole('heading', { name: /You pointed at line 3/ })).toBeInTheDocument()
      expect(screen.getByText('It is off by one.')).toBeInTheDocument()
    })

    it('holds the original kata in a closed disclosure with the whole snippet', async () => {
      mockedApi.getSession.mockResolvedValue(pointSession)
      renderAt()

      const summary = await screen.findByText('Original kata')
      const original = summary.closest('details')!
      expect(original).not.toHaveAttribute('open')
      expect(original).toHaveTextContent('four')
      expect(original).toHaveTextContent('Original kata body text.')
    })
  })

  it('shares the result page through the system sheet when there is one (D61)', async () => {
    const user = userEvent.setup()
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    mockedApi.getSession.mockResolvedValue(makeSession({ finalAttempt: makeAttempt({ verdict: 'passed' }) }))

    renderAt('/results/s1')
    await user.click(await screen.findByRole('button', { name: 'Share' }))

    expect(share).toHaveBeenCalledWith({ url: expect.stringContaining('/share/s1') })
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
  })

  it('copies the share link where there is no system sheet', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    mockedApi.getSession.mockResolvedValue(makeSession({ finalAttempt: makeAttempt({ verdict: 'passed' }) }))

    renderAt('/results/s1')
    await user.click(await screen.findByRole('button', { name: 'Share' }))

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/share/s1'))
    expect(await screen.findByText('Link copied!')).toBeInTheDocument()
  })

  it('shows the verdict once, with no share preview repeating it', async () => {
    mockedApi.getSession.mockResolvedValue(makeSession({ finalAttempt: makeAttempt({ verdict: 'passed' }) }))

    renderAt('/results/s1')

    expect(await screen.findAllByText('PASSED')).toHaveLength(1)
    expect(screen.getAllByText('Binary Search Boundaries')).toHaveLength(1)
  })
})
