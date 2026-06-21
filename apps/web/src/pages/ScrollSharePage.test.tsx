import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { API_URL } from '../lib/config'
import { ScrollSharePage } from './ScrollSharePage'

interface ScrollShareData {
  scrollSlug: string
  scrollTitle: string
  scrollLanguage: string
  scrollAccentColor: string
  totalSteps: number
  completedAt: string
  username: string
  avatarUrl: string
}

function makeData(overrides: Partial<ScrollShareData> = {}): ScrollShareData {
  return {
    scrollSlug: 'binary-search',
    scrollTitle: 'Binary Search From Scratch',
    scrollLanguage: 'TypeScript',
    scrollAccentColor: '#3178c6',
    totalSteps: 7,
    completedAt: '2026-06-19T10:08:00.000Z',
    username: 'kenobi',
    avatarUrl: 'https://example.test/avatar.png',
    ...overrides,
  }
}

function okResponse(data: ScrollShareData): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  } as unknown as Response
}

function statusResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: () => Promise.resolve(null),
  } as unknown as Response
}

const fetchMock = vi.fn<typeof fetch>()

function renderShare(slug = 'binary-search', userId = 'u1') {
  return render(
    <MemoryRouter initialEntries={[`/share/scroll/${slug}/${userId}`]}>
      <Routes>
        <Route path="/share/scroll/:slug/:userId" element={<ScrollSharePage />} />
        <Route path="/scrolls" element={<div>scrolls index</div>} />
        <Route path="/scrolls/:slug" element={<div>scroll detail page</div>} />
        <Route path="/" element={<div>landing page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ScrollSharePage', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the page loader while the request is pending', () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))

    renderShare()

    expect(screen.getByText('loading')).toBeInTheDocument()
    // Neither loaded content nor error UI while pending.
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByText(/couldn't load this completion card/i)).not.toBeInTheDocument()
  })

  it('requests the share endpoint with the slug and userId from the route', async () => {
    fetchMock.mockResolvedValue(okResponse(makeData()))

    renderShare('quicksort', 'user-42')

    await screen.findByRole('heading', { name: 'Binary Search From Scratch' })
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/share/scroll/quicksort/user-42`)
  })

  it('renders the completion card once the data resolves', async () => {
    fetchMock.mockResolvedValue(okResponse(makeData()))

    renderShare()

    expect(
      await screen.findByRole('heading', { name: 'Binary Search From Scratch' }),
    ).toBeInTheDocument()

    expect(screen.getByText('Scroll complete')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('7 steps')).toBeInTheDocument()
    expect(screen.getByText('@kenobi')).toBeInTheDocument()
    // completedAt formatted as YYYY-MM-DD.
    expect(screen.getByText('Completed 2026-06-19')).toBeInTheDocument()
    // langGlyph is the first four chars uppercased.
    expect(screen.getByText('TYPE')).toBeInTheDocument()

    // The loader is gone.
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  it('points the CTA at the scroll detail route for the completed scroll', async () => {
    fetchMock.mockResolvedValue(okResponse(makeData({ scrollSlug: 'merge-sort' })))

    renderShare()

    const cta = await screen.findByRole('link', { name: /Start the scroll/ })
    expect(cta).toHaveAttribute('href', '/scrolls/merge-sort')
  })

  it('renders the not-found error (with a browse-scrolls link) on a 404', async () => {
    fetchMock.mockResolvedValue(statusResponse(404))

    renderShare()

    expect(
      await screen.findByText(/This completion doesn't exist yet/i),
    ).toBeInTheDocument()
    // Distinct from the network-failure branch.
    expect(screen.queryByText(/couldn't load this completion card/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse scrolls' })).toHaveAttribute(
      'href',
      '/scrolls',
    )
  })

  it('renders the network error for a non-404 failed response', async () => {
    fetchMock.mockResolvedValue(statusResponse(500))

    renderShare()

    expect(
      await screen.findByText(/couldn't load this completion card/i),
    ).toBeInTheDocument()
    // Not the 404 branch.
    expect(screen.queryByText(/This completion doesn't exist yet/i)).not.toBeInTheDocument()
  })

  it('treats a rejected fetch as a network error', async () => {
    fetchMock.mockRejectedValue(new Error('connection reset'))

    renderShare()

    expect(
      await screen.findByText(/couldn't load this completion card/i),
    ).toBeInTheDocument()
  })

  it('retries the fetch and shows the card when the second attempt succeeds', async () => {
    const user = userEvent.setup()
    fetchMock
      .mockResolvedValueOnce(statusResponse(500))
      .mockResolvedValueOnce(okResponse(makeData()))

    renderShare()

    await screen.findByText(/couldn't load this completion card/i)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'Binary Search From Scratch' }),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await waitFor(() =>
      expect(
        screen.queryByText(/couldn't load this completion card/i),
      ).not.toBeInTheDocument(),
    )
  })
})
