import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ScrollDTO, ScrollProgressSummary, UserDTO } from '@dojo/shared'

import { ScrollsPage } from './ScrollsPage'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { getAnonymousId } from '../lib/anonymousId'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: {
    getScrolls: vi.fn(),
    getAllProgress: vi.fn(),
  },
}))

vi.mock('../lib/anonymousId', () => ({
  getAnonymousId: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedApi = vi.mocked(api)
const mockedGetAnonymousId = vi.mocked(getAnonymousId)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function makeScroll(overrides: Partial<ScrollDTO> = {}): ScrollDTO {
  return {
    id: 'id-default',
    slug: 'slug-default',
    title: 'Default Scroll',
    description: 'A default description.',
    language: 'ruby',
    accentColor: '#ff0000',
    isPublic: true,
    estimatedMinutes: 30,
    lessonCount: 3,
    stepCount: 10,
    externalReferences: [],
    ...overrides,
  }
}

// A language scroll (ruby) and a topic scroll (sql, outside the closed set).
const rubyScroll = makeScroll({
  id: 'ruby-1',
  slug: 'ruby-metaprogramming',
  title: 'Ruby Metaprogramming',
  language: 'ruby',
  stepCount: 8,
})
const sqlScroll = makeScroll({
  id: 'sql-1',
  slug: 'sql-indexes',
  title: 'SQL Indexes',
  language: 'sql',
  stepCount: 5,
})

function authAsAnon() {
  mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
}

function authAsUser() {
  mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/scrolls']}>
      <ScrollsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authAsAnon()
  mockedGetAnonymousId.mockReturnValue(null)
})

describe('ScrollsPage', () => {
  it('shows the loader while the catalog request is pending', () => {
    mockedApi.getScrolls.mockReturnValue(new Promise(() => {}))
    mockedApi.getAllProgress.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('loading')).toBeInTheDocument()
    // The catalog hero must not be on screen while loading.
    expect(
      screen.queryByRole('heading', { name: /learn deliberately/i }),
    ).not.toBeInTheDocument()
  })

  it('renders the catalog grouped into Languages and Topics once loaded', async () => {
    mockedApi.getScrolls.mockResolvedValue([rubyScroll, sqlScroll])
    mockedApi.getAllProgress.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Ruby Metaprogramming')).toBeInTheDocument()
    expect(screen.getByText('SQL Indexes')).toBeInTheDocument()

    // Section split keys off the closed language set: ruby → Languages, sql → Topics.
    expect(screen.getByRole('heading', { name: 'Languages' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Topics' })).toBeInTheDocument()

    // Hero summary line: 2 scrolls, 8 + 5 steps.
    expect(screen.getByText('2 scrolls · 13 steps')).toBeInTheDocument()

    // Loader is gone.
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('links each card to its scroll slug', async () => {
    mockedApi.getScrolls.mockResolvedValue([rubyScroll])
    mockedApi.getAllProgress.mockResolvedValue([])

    renderPage()

    const card = await screen.findByRole('link', { name: /Ruby Metaprogramming/i })
    expect(card).toHaveAttribute('href', '/scrolls/ruby-metaprogramming')
  })

  it('renders the empty state when no scrolls exist', async () => {
    mockedApi.getScrolls.mockResolvedValue([])
    mockedApi.getAllProgress.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText('No scrolls available yet. Check back soon.'),
    ).toBeInTheDocument()
    // No filters / summary when the catalog is empty.
    expect(screen.queryByText(/scrolls ·/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: /filter scrolls/i }),
    ).not.toBeInTheDocument()
  })

  it('falls back to the empty state when the catalog request fails', async () => {
    mockedApi.getScrolls.mockRejectedValue(new Error('network down'))
    mockedApi.getAllProgress.mockResolvedValue([])

    renderPage()

    expect(
      await screen.findByText('No scrolls available yet. Check back soon.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('derives per-scroll state from progress and reflects it on the card', async () => {
    // ruby: 8/8 completed → "Completed". sql: 2/5 → "In progress".
    const progress: ScrollProgressSummary[] = [
      { scrollId: 'ruby-1', completedStepCount: 8 },
      { scrollId: 'sql-1', completedStepCount: 2 },
    ]
    mockedApi.getScrolls.mockResolvedValue([rubyScroll, sqlScroll])
    mockedApi.getAllProgress.mockResolvedValue(progress)

    renderPage()

    const rubyCard = await screen.findByRole('link', { name: /Ruby Metaprogramming/i })
    expect(within(rubyCard).getByText('Completed')).toBeInTheDocument()
    expect(within(rubyCard).getByText('Review →')).toBeInTheDocument()

    const sqlCard = screen.getByRole('link', { name: /SQL Indexes/i })
    expect(within(sqlCard).getByText('In progress')).toBeInTheDocument()
    expect(within(sqlCard).getByText('Continue →')).toBeInTheDocument()
  })

  it('filters the catalog by progress state when a filter is clicked', async () => {
    const u = userEvent.setup()
    mockedApi.getScrolls.mockResolvedValue([rubyScroll, sqlScroll])
    mockedApi.getAllProgress.mockResolvedValue([
      { scrollId: 'ruby-1', completedStepCount: 8 },
    ])

    renderPage()

    // Both visible under the default "All" filter.
    expect(await screen.findByText('Ruby Metaprogramming')).toBeInTheDocument()
    expect(screen.getByText('SQL Indexes')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: /^Completed/ }))

    // Only the completed ruby scroll survives the filter.
    expect(screen.getByText('Ruby Metaprogramming')).toBeInTheDocument()
    expect(screen.queryByText('SQL Indexes')).not.toBeInTheDocument()

    const completedFilter = screen.getByRole('button', { name: /^Completed/ })
    expect(completedFilter).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the no-match empty state when a filter excludes everything', async () => {
    const u = userEvent.setup()
    mockedApi.getScrolls.mockResolvedValue([rubyScroll])
    mockedApi.getAllProgress.mockResolvedValue([]) // not-started

    renderPage()

    await screen.findByText('Ruby Metaprogramming')
    await u.click(screen.getByRole('button', { name: /^Completed/ }))

    expect(screen.getByText('No scrolls match this filter.')).toBeInTheDocument()
    expect(screen.queryByText('Ruby Metaprogramming')).not.toBeInTheDocument()
  })

  it('offers the sign-in-to-save banner to anonymous visitors and fetches anon progress', async () => {
    mockedGetAnonymousId.mockReturnValue('anon-xyz')
    mockedApi.getScrolls.mockResolvedValue([rubyScroll])
    mockedApi.getAllProgress.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Ruby Metaprogramming')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in to save' })).toBeInTheDocument()

    // Anon callers pass their stored session id to the batch progress call.
    expect(mockedApi.getAllProgress).toHaveBeenCalledWith('anon-xyz')
  })

  it('hides the sign-in banner and omits the anon id for authenticated users', async () => {
    authAsUser()
    mockedApi.getScrolls.mockResolvedValue([rubyScroll])
    mockedApi.getAllProgress.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Ruby Metaprogramming')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Sign in to save' })).not.toBeInTheDocument()

    // Authed users resolve via bearer — no anon id passed.
    expect(mockedApi.getAllProgress).toHaveBeenCalledWith(undefined)
    expect(mockedGetAnonymousId).not.toHaveBeenCalled()
  })
})
