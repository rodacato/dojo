import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

function renderAt(path = '/results/s1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/results/:id" element={<ResultsPage />} />
        <Route path="/dashboard" element={<div>dashboard screen</div>} />
        <Route path="/katas" element={<div>katas screen</div>} />
        <Route path="/katas/:id/eval" element={<div>eval screen</div>} />
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

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
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
    expect(mockedApi.getFeedback).toHaveBeenCalledWith('abc-123')

    // Distinct loaded-state content: insights parsed from the analysis.
    expect(screen.getByText('Solid base case handling')).toBeInTheDocument()
    expect(screen.getByText('Watch the off-by-one on the upper bound')).toBeInTheDocument()
    expect(
      screen.getByText('Consider a half-open interval next time.'),
    ).toBeInTheDocument()
    // Completed-in timer derived from start/complete timestamps.
    expect(screen.getByText('5:30')).toBeInTheDocument()
  })

  it('renders the error state and retries the load when "Try again" is clicked', async () => {
    const user = userEvent.setup()
    mockedApi.getSession.mockRejectedValueOnce(new Error('boom'))

    renderAt()

    expect(
      await screen.findByText("We couldn't load this kata result."),
    ).toBeInTheDocument()
    // Error UI is distinct from loaded/loading: no kata heading, no loader.
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
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

  it('navigates to katas from the expired layout "Keep Practicing" button', async () => {
    const user = userEvent.setup()
    mockedApi.getSession.mockResolvedValue(
      makeSession({ status: 'failed', finalAttempt: null }),
    )

    renderAt()
    await screen.findByText('This kata expired without a submission.')

    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }))

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
    expect(await screen.findByText('eval screen')).toBeInTheDocument()
  })

  it('copies a share link built from the verdict and kata title', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    mockedApi.getSession.mockResolvedValue(
      makeSession({ finalAttempt: makeAttempt({ verdict: 'passed' }) }),
    )

    renderAt('/results/s1')

    const copyBtn = await screen.findByRole('button', { name: 'Copy share link' })
    await user.click(copyBtn)

    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = writeText.mock.calls[0]?.[0] as string
    expect(copied).toContain('PASSED — Binary Search Boundaries | dojo_')
    expect(copied).toContain('/share/s1')
    expect(await screen.findByText('Link copied!')).toBeInTheDocument()
  })
})
