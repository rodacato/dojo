import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ScrollDetailDTO, StepDTO, UserDTO } from '@dojo/shared'

import { ScrollPlayerPage } from './ScrollPlayerPage'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

vi.mock('../lib/api', () => ({
  api: {
    getScroll: vi.fn(),
    getProgress: vi.fn(),
    trackProgress: vi.fn(),
    mergeAnonymousProgress: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedApi = vi.mocked(api)
const mockedUseAuth = vi.mocked(useAuth)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function readStep(id: string, title: string, instruction: string): StepDTO {
  return {
    id,
    order: 1,
    type: 'read',
    title,
    instruction,
    starterCode: null,
    testCode: null,
    hint: null,
    hints: null,
    data: null,
  }
}

function makeScroll(overrides: Partial<ScrollDetailDTO> = {}): ScrollDetailDTO {
  return {
    id: 'scroll-1',
    slug: 'ruby-basics',
    title: 'Ruby Basics',
    description: 'Learn Ruby',
    language: 'ruby',
    accentColor: '#ff0000',
    isPublic: true,
    estimatedMinutes: 30,
    lessonCount: 1,
    stepCount: 2,
    externalReferences: [],
    lessons: [
      {
        id: 'lesson-1',
        order: 1,
        title: 'Intro',
        outcome: null,
        steps: [
          readStep('step-1', 'First Step', 'Welcome to the first step.'),
          readStep('step-2', 'Second Step', 'Now the second step.'),
        ],
      },
    ],
    ...overrides,
  }
}

function renderPlayer(path = '/scrolls/ruby-basics/step-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/scrolls/:slug" element={<div>scroll landing</div>} />
        <Route path="/scrolls/:slug/:stepId" element={<ScrollPlayerPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

// jsdom omits Element.prototype.scrollTo; the player calls it on step change.
if (!HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = vi.fn()
}

beforeEach(() => {
  vi.resetAllMocks()
  mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
  mockedApi.getScroll.mockResolvedValue(makeScroll())
  mockedApi.getProgress.mockResolvedValue({ completedSteps: [] })
  mockedApi.trackProgress.mockResolvedValue({ ok: true })
  mockedApi.mergeAnonymousProgress.mockResolvedValue({ ok: true })
})

describe('ScrollPlayerPage', () => {
  it('shows the loader while the scroll request is pending', async () => {
    let resolveScroll: (s: ScrollDetailDTO) => void = () => {}
    mockedApi.getScroll.mockReturnValue(
      new Promise<ScrollDetailDTO>((res) => {
        resolveScroll = res
      }),
    )

    renderPlayer()

    expect(await screen.findByText('loading')).toBeInTheDocument()
    expect(screen.queryByText('Welcome to the first step.')).not.toBeInTheDocument()

    // Settle the pending request so it doesn't leak into the next test.
    resolveScroll(makeScroll())
    await screen.findByText('Welcome to the first step.', { selector: 'p' })
  })

  it('reads the slug from the URL and renders the active step once loaded', async () => {
    mockedApi.getScroll.mockResolvedValue(makeScroll())

    renderPlayer()

    // Header surfaces the scroll identity and progress counter.
    expect(await screen.findByText('Ruby Basics')).toBeInTheDocument()
    expect(mockedApi.getScroll).toHaveBeenCalledWith('ruby-basics')
    expect(screen.getByText('ruby')).toBeInTheDocument()
    expect(screen.getByText('0 / 2 steps')).toBeInTheDocument()
    // The active step's body renders in the same commit as the header above,
    // so it's already present once "Ruby Basics" resolved — a synchronous
    // getByText, not findByText (whose async polling flaked under thread pools).
    expect(
      screen.getByText('Welcome to the first step.', { selector: 'p' }),
    ).toBeInTheDocument()
  })

  it('renders the error state and refetches when "Try again" is clicked', async () => {
    mockedApi.getScroll.mockRejectedValue(new Error('boom'))
    const u = userEvent.setup()

    renderPlayer()

    expect(await screen.findByText("We couldn't load this scroll.")).toBeInTheDocument()
    expect(screen.queryByText('Ruby Basics')).not.toBeInTheDocument()
    expect(mockedApi.getScroll).toHaveBeenCalledTimes(1)

    // "Try again" bumps the retry tick → the fetch effect runs again.
    await u.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => {
      expect(mockedApi.getScroll).toHaveBeenCalledTimes(2)
    })
  })

  it('redirects to the scroll landing when the URL names an unknown step', async () => {
    mockedApi.getScroll.mockResolvedValue(makeScroll())

    renderPlayer('/scrolls/ruby-basics/does-not-exist')

    expect(await screen.findByText('scroll landing')).toBeInTheDocument()
    expect(screen.queryByText('Welcome to the first step.')).not.toBeInTheDocument()
  })

  it('marks the step complete and advances to the next step on Continue', async () => {
    mockedApi.getScroll.mockResolvedValue(makeScroll())
    const u = userEvent.setup()

    renderPlayer()

    const continueBtn = await screen.findByRole('button', { name: 'Continue →' })
    await u.click(continueBtn)

    expect(mockedApi.trackProgress).toHaveBeenCalledWith('scroll-1', 'step-1', undefined)
    // Advancing navigates to step-2, whose body replaces step-1's.
    expect(await screen.findByText('Now the second step.')).toBeInTheDocument()
    expect(screen.queryByText('Welcome to the first step.')).not.toBeInTheDocument()
  })

  it('toggles the sidebar nav label when the toggle button is pressed', async () => {
    mockedApi.getScroll.mockResolvedValue(makeScroll())
    const u = userEvent.setup()

    renderPlayer()

    // matchMedia stub reports no match → sidebar starts collapsed.
    const toggle = await screen.findByRole('button', { name: 'Toggle sidebar' })
    expect(toggle).toHaveTextContent('Show nav')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await u.click(toggle)

    expect(toggle).toHaveTextContent('Hide nav')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows the completion banner with the share affordance when every step is done', async () => {
    mockedApi.getScroll.mockResolvedValue(makeScroll())
    mockedApi.getProgress.mockResolvedValue({ completedSteps: ['step-1', 'step-2'] })

    renderPlayer()

    expect(await screen.findByText('Scroll · Complete')).toBeInTheDocument()
    expect(screen.queryByText('0 / 2 steps')).not.toBeInTheDocument()
    expect(screen.getByText('2 / 2 steps')).toBeInTheDocument()
    // Authenticated finishers get the share button, not the sign-in CTA.
    expect(screen.getByRole('button', { name: 'Share completion' })).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Sign in to save/ }),
    ).not.toBeInTheDocument()
  })

  it('loads anonymous progress and offers sign-in on completion for guests', async () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
    mockedApi.getScroll.mockResolvedValue(makeScroll())
    mockedApi.getProgress.mockResolvedValue({ completedSteps: ['step-1', 'step-2'] })

    renderPlayer()

    expect(await screen.findByText('Scroll · Complete')).toBeInTheDocument()
    // Anonymous public scroll → progress fetched with a generated session id.
    await waitFor(() => {
      expect(mockedApi.getProgress).toHaveBeenCalledWith('scroll-1', expect.any(String))
    })
    expect(
      screen.getByRole('link', { name: /Sign in to save/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Share completion' }),
    ).not.toBeInTheDocument()
  })
})
