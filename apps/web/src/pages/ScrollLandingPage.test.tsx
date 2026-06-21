import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ScrollDetailDTO, StepDTO, UserDTO } from '@dojo/shared'
import { ScrollLandingPage } from './ScrollLandingPage'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { getAnonymousId } from '../lib/anonymousId'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: { getScroll: vi.fn(), getProgress: vi.fn() },
}))

vi.mock('../lib/anonymousId', () => ({
  getAnonymousId: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedGetScroll = vi.mocked(api.getScroll)
const mockedGetProgress = vi.mocked(api.getProgress)
const mockedGetAnonymousId = vi.mocked(getAnonymousId)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function step(id: string, order: number): StepDTO {
  return {
    id,
    order,
    type: 'code',
    title: null,
    instruction: 'do it',
    starterCode: null,
    testCode: null,
    hint: null,
    hints: null,
    data: null,
  }
}

const scroll: ScrollDetailDTO = {
  id: 'scroll-1',
  slug: 'closures',
  title: 'Closures Demystified',
  description: 'Understand how closures capture state.',
  language: 'JavaScript',
  accentColor: '#f5a623',
  isPublic: true,
  estimatedMinutes: 45,
  lessonCount: 2,
  stepCount: 3,
  externalReferences: [],
  lessons: [
    {
      id: 'lesson-1',
      order: 1,
      title: 'What is a closure',
      outcome: 'You can name the captured environment.',
      steps: [step('s1', 1), step('s2', 2)],
    },
    {
      id: 'lesson-2',
      order: 2,
      title: 'Closures in loops',
      outcome: null,
      steps: [step('s3', 3)],
    },
  ],
}

function anon() {
  mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
}

function authed() {
  mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
}

function renderAt(slug = 'closures') {
  return render(
    <MemoryRouter initialEntries={[`/scrolls/${slug}`]}>
      <Routes>
        <Route path="/scrolls/:slug" element={<ScrollLandingPage />} />
        <Route path="/scrolls" element={<div>scrolls catalog</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ScrollLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: fresh anon with no stored session — getProgress is skipped.
    anon()
    mockedGetAnonymousId.mockReturnValue(null)
  })

  it('shows the loading state while the scroll request is pending', () => {
    mockedGetScroll.mockReturnValue(new Promise(() => {}))

    renderAt()

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(screen.queryByText('Closures Demystified')).not.toBeInTheDocument()
  })

  it('reads the slug from the URL and renders the loaded scroll content', async () => {
    mockedGetScroll.mockResolvedValue(scroll)

    renderAt('closures')

    expect(
      await screen.findByRole('heading', { name: 'Closures Demystified' }),
    ).toBeInTheDocument()
    expect(mockedGetScroll).toHaveBeenCalledWith('closures')
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('Understand how closures capture state.')).toBeInTheDocument()
    expect(screen.getByText(/~45 min/)).toBeInTheDocument()
    // Both lessons render their titles; the authored outcome shows, the null one does not.
    expect(screen.getByText('What is a closure')).toBeInTheDocument()
    expect(screen.getByText('Closures in loops')).toBeInTheDocument()
    expect(screen.getByText('You can name the captured environment.')).toBeInTheDocument()
  })

  it('renders an error state and recovers via the retry action', async () => {
    mockedGetScroll.mockRejectedValueOnce(new Error('boom'))

    renderAt()

    expect(
      await screen.findByText("We couldn't load this scroll."),
    ).toBeInTheDocument()
    expect(screen.queryByText('Closures Demystified')).not.toBeInTheDocument()

    // Retry re-runs the fetch; this time it succeeds and the content appears.
    mockedGetScroll.mockResolvedValueOnce(scroll)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'Closures Demystified' }),
    ).toBeInTheDocument()
    expect(screen.queryByText("We couldn't load this scroll.")).not.toBeInTheDocument()
  })

  it('renders the Start CTA pointing at the first step when there is no progress', async () => {
    mockedGetScroll.mockResolvedValue(scroll)

    renderAt()

    const cta = await screen.findByRole('link', { name: /Start · What is a closure/ })
    expect(cta).toHaveAttribute('href', '/scrolls/closures/s1')
    // No progress: 0 / 3 with all three steps still to go.
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('/ 3')).toBeInTheDocument()
    expect(screen.getByText('3 to go.')).toBeInTheDocument()
  })

  it('skips the progress call for a fresh anon and shows zero progress', async () => {
    mockedGetScroll.mockResolvedValue(scroll)

    renderAt()

    await screen.findByRole('heading', { name: 'Closures Demystified' })
    expect(mockedGetProgress).not.toHaveBeenCalled()
  })

  it('loads progress for an authed user and reflects it as Continue + completed counts', async () => {
    authed()
    mockedGetScroll.mockResolvedValue(scroll)
    mockedGetProgress.mockResolvedValue({ completedSteps: ['s1'] })

    renderAt()

    // Progress resolves async → 1 / 3, 2 to go, and the CTA targets the first incomplete step.
    expect(await screen.findByText('2 to go.')).toBeInTheDocument()
    expect(mockedGetProgress).toHaveBeenCalledWith('scroll-1', undefined)

    const cta = screen.getByRole('link', { name: /Continue · What is a closure/ })
    expect(cta).toHaveAttribute('href', '/scrolls/closures/s2')

    // Lesson 1 is partially done (1 of 2) → in-progress; lesson 2 untouched → not started.
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('Not started')).toBeInTheDocument()
  })

  it('passes the stored anonymous id to getProgress for a returning anon', async () => {
    mockedGetAnonymousId.mockReturnValue('anon-xyz')
    mockedGetScroll.mockResolvedValue(scroll)
    mockedGetProgress.mockResolvedValue({ completedSteps: [] })

    renderAt()

    await screen.findByRole('heading', { name: 'Closures Demystified' })
    await waitFor(() =>
      expect(mockedGetProgress).toHaveBeenCalledWith('scroll-1', 'anon-xyz'),
    )
  })

  it('shows the Review CTA and complete state when every step is done', async () => {
    authed()
    mockedGetScroll.mockResolvedValue(scroll)
    mockedGetProgress.mockResolvedValue({ completedSteps: ['s1', 's2', 's3'] })

    renderAt()

    expect(await screen.findByText('Complete.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Review/ })).toBeInTheDocument()
    expect(screen.getAllByText('Done')).toHaveLength(2)
  })

  it('links each lesson row to its first step', async () => {
    mockedGetScroll.mockResolvedValue(scroll)

    renderAt()

    const lesson2 = await screen.findByText('Closures in loops')
    const row = lesson2.closest('a')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText('Closures in loops')).toBeInTheDocument()
    expect(row).toHaveAttribute('href', '/scrolls/closures/s3')
  })
})
