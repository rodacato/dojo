import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ScrollEntryDTO } from '@dojo/shared'
import { ScrollsPage } from './ScrollsPage'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({ api: { getScrolls: vi.fn() } }))

const mockedApi = vi.mocked(api)

function scroll(slug: string, overrides: Partial<ScrollEntryDTO['manifest']> = {}): ScrollEntryDTO {
  return {
    id: `3f0c6d0e-0d0e-4a1b-9c1e-0a5a1d2b3c${slug.length.toString().padStart(2, '0')}`,
    slug,
    status: 'published',
    visibility: 'public',
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

  it('shows an empty state when nothing is published', async () => {
    mockedApi.getScrolls.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No scrolls are published yet.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows a loader while the request is pending', () => {
    mockedApi.getScrolls.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading/)).toBeInTheDocument()
  })

  it('shows an error with a retry that reloads the list', async () => {
    mockedApi.getScrolls.mockRejectedValueOnce(new Error('boom'))
    renderPage()
    expect(await screen.findByText('The scrolls could not be loaded.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('list', { name: 'Scrolls' })).toBeInTheDocument()
    expect(mockedApi.getScrolls).toHaveBeenCalledTimes(2)
  })
})
