import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ScrollEntryDTO } from '@dojo/shared'
import { ScrollsPage } from './ScrollsPage'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

vi.mock('../lib/api', () => ({ api: { getScrolls: vi.fn() } }))
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

const mockedApi = vi.mocked(api)
const mockedUseAuth = vi.mocked(useAuth)
const member = { id: 'u1', username: 'morgan', avatarUrl: '', createdAt: '2026-01-01T00:00:00.000Z' }

function signIn() {
  mockedUseAuth.mockReturnValue({ user: member, loading: false, logout: vi.fn() })
}

function signOut() {
  mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
}

function scroll(
  slug: string,
  overrides: Partial<ScrollEntryDTO['manifest']> = {},
  visibility: ScrollEntryDTO['visibility'] = 'public',
): ScrollEntryDTO {
  return {
    id: `3f0c6d0e-0d0e-4a1b-9c1e-0a5a1d2b3c${slug.length.toString().padStart(2, '0')}`,
    slug,
    status: 'published',
    visibility,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    manifest: {
      id: slug,
      version: '0.1.0',
      protocol: 0,
      entry: `https://scrolls.example.com/${slug}/`,
      locales: ['en', 'es'],
      title: { en: `${slug} title`, es: `${slug} titulo` },
      description: { en: `${slug} description`, es: `${slug} descripcion` },
      programmingLanguages: ['ruby', 'go'],
      units: [{ id: 'u1' }],
      capabilities: [],
      ...overrides,
    },
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ScrollsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.spyOn(globalThis.navigator, 'language', 'get').mockReturnValue('es-MX')
  mockedApi.getScrolls.mockResolvedValue([scroll('pattern-circuit'), scroll('domain-wall')])
  signIn()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('ScrollsPage', () => {
  it('lists each published scroll as a link to its page', async () => {
    renderPage()
    const list = await screen.findByRole('list', { name: 'Scrolls' })
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/scrolls/pattern-circuit',
      '/scrolls/domain-wall',
    ])
  })

  it('shows title, description and languages in the user locale', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'pattern-circuit titulo' })).toBeInTheDocument()
    expect(screen.getByText('pattern-circuit descripcion')).toBeInTheDocument()
    expect(screen.getAllByText('ruby · go')).toHaveLength(2)
  })

  it('falls back to the first manifest locale', async () => {
    vi.spyOn(globalThis.navigator, 'language', 'get').mockReturnValue('ja')
    renderPage()
    expect(await screen.findByRole('heading', { name: 'pattern-circuit title' })).toBeInTheDocument()
    expect(screen.getByText('domain-wall description')).toBeInTheDocument()
  })

  it('omits the languages line when a scroll has none', async () => {
    mockedApi.getScrolls.mockResolvedValue([scroll('plain', { programmingLanguages: [] })])
    renderPage()
    await screen.findByRole('heading', { name: 'plain titulo' })
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('counts the scrolls it lists', async () => {
    renderPage()
    expect(await screen.findByText('2 scrolls')).toBeInTheDocument()
  })

  it('counts a single scroll in the singular', async () => {
    mockedApi.getScrolls.mockResolvedValue([scroll('solo')])
    renderPage()
    expect(await screen.findByText('1 scroll')).toBeInTheDocument()
  })

  it('marks a private scroll as instance access and leaves public ones unmarked', async () => {
    mockedApi.getScrolls.mockResolvedValue([
      scroll('open'),
      scroll('closed', { programmingLanguages: [] }, 'private'),
    ])
    renderPage()
    const [open, closed] = within(await screen.findByRole('list', { name: 'Scrolls' })).getAllByRole('link')
    expect(open).not.toHaveTextContent('Instance access')
    expect(closed).toHaveTextContent('Instance access')
  })

  it('says nothing is published to a signed-in learner with an empty list', async () => {
    mockedApi.getScrolls.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No scrolls are published yet.')).toBeInTheDocument()
    expect(screen.getByText(/small apps the operator of this instance adds/)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('does not tell an anonymous visitor that nothing is published', async () => {
    signOut()
    mockedApi.getScrolls.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No public scrolls are available here.')).toBeInTheDocument()
    expect(screen.queryByText('No scrolls are published yet.')).not.toBeInTheDocument()
  })

  it('tells only anonymous visitors that public scrolls need no account', async () => {
    signOut()
    const { unmount } = renderPage()
    expect(await screen.findByText('Public scrolls are open without an account.')).toBeInTheDocument()
    unmount()

    signIn()
    renderPage()
    await screen.findByRole('list', { name: 'Scrolls' })
    expect(screen.queryByText('Public scrolls are open without an account.')).not.toBeInTheDocument()
  })

  it('keeps the page title and invents no content while loading', () => {
    mockedApi.getScrolls.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Small apps that teach one thing well.')
    expect(screen.getByRole('status')).toHaveTextContent('Loading scrolls')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+ scrolls?/)).not.toBeInTheDocument()
  })

  it('waits for the visitor to be known before calling the catalog empty', async () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: true, logout: vi.fn() })
    mockedApi.getScrolls.mockResolvedValue([])
    renderPage()
    await act(async () => {})
    expect(screen.getByRole('status')).toHaveTextContent('Loading scrolls')
    expect(screen.queryByText(/No (public )?scrolls/)).not.toBeInTheDocument()
    expect(screen.queryByText('Public scrolls are open without an account.')).not.toBeInTheDocument()
  })

  it('shows an error in place, with a filled retry that reloads the list', async () => {
    mockedApi.getScrolls.mockRejectedValueOnce(new Error('boom'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('The scrolls could not be loaded.')
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()

    const retry = screen.getByRole('button', { name: /try again/i })
    expect(retry).toHaveClass('bg-accent')
    await userEvent.click(retry)
    expect(await screen.findByRole('list', { name: 'Scrolls' })).toBeInTheDocument()
    expect(mockedApi.getScrolls).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
  })

  it('leaves the filled action to the public nav when a visitor retries', async () => {
    signOut()
    mockedApi.getScrolls.mockRejectedValueOnce(new Error('boom'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('The scrolls could not be loaded.')

    const retry = screen.getByRole('button', { name: /try again/i })
    expect(retry).not.toHaveClass('bg-accent')
    await userEvent.click(retry)
    expect(await screen.findByRole('list', { name: 'Scrolls' })).toBeInTheDocument()
  })
})
