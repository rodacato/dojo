import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { SharePage } from './SharePage'

vi.mock('../lib/config', () => ({
  API_URL: 'https://api.test',
}))

interface ShareData {
  sessionId: string
  kataTitle: string
  kataType: string
  difficulty: string
  verdict: string
  pullQuote: string | null
  completionMinutes: number | null
  username: string
  avatarUrl: string
  ownerRole: string | null
}

const fullData: ShareData = {
  sessionId: 'abc123def456',
  kataTitle: 'Two Sum',
  kataType: 'algorithms',
  difficulty: 'white-belt',
  verdict: 'passed',
  pullQuote: 'Clean and direct — the hash map carries it.',
  completionMinutes: 12,
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  ownerRole: 'staff engineer',
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/s/:id" element={<SharePage />} />
        <Route path="/" element={<div>landing page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('SharePage', () => {
  it('shows the loading state while the share fetch is pending', () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))

    renderAt('/s/abc123def456')

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(screen.queryByText('Two Sum')).not.toBeInTheDocument()
  })

  it('requests the share endpoint with the slug from the URL param', () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))

    renderAt('/s/abc123def456')

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/share/abc123def456')
  })

  it('renders the verdict, kata details and quote once the data resolves', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, fullData))

    renderAt('/s/abc123def456')

    expect(
      await screen.findByRole('heading', { name: 'PASSED', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Two Sum', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('algorithms')).toBeInTheDocument()
    expect(screen.getByText('white-belt')).toBeInTheDocument()
    expect(screen.getByText('12 min')).toBeInTheDocument()
    expect(
      screen.getByText('Clean and direct — the hash map carries it.'),
    ).toBeInTheDocument()
    expect(screen.getByText('@sensei')).toBeInTheDocument()
    expect(screen.getByText('[staff engineer]')).toBeInTheDocument()
  })

  it('links the CTA back to the dojo landing', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, fullData))

    renderAt('/s/abc123def456')

    const cta = await screen.findByRole('link', { name: /Find yours\. Enter the dojo/ })
    expect(cta).toHaveAttribute('href', '/')
  })

  it('maps a known verdict code to its human label and colour', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ...fullData, verdict: 'needs_work' }),
    )

    renderAt('/s/abc123def456')

    const heading = await screen.findByRole('heading', { name: 'NEEDS WORK', level: 1 })
    expect(heading).toHaveClass('text-danger')
  })

  it('omits the optional completion time and quote when absent', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        ...fullData,
        completionMinutes: null,
        pullQuote: null,
        ownerRole: null,
      }),
    )

    renderAt('/s/abc123def456')

    await screen.findByRole('heading', { name: 'PASSED', level: 1 })
    expect(screen.queryByText(/min$/)).not.toBeInTheDocument()
    expect(
      screen.queryByText('Clean and direct — the hash map carries it.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('[staff engineer]')).not.toBeInTheDocument()
  })

  it('shows the not-found error UI for a 404 response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, null))

    renderAt('/s/missing')

    expect(
      await screen.findByText("This kata result doesn't exist or isn't public yet."),
    ).toBeInTheDocument()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enter the dojo' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('shows the network error UI when the fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    renderAt('/s/abc123def456')

    expect(
      await screen.findByText("We couldn't load this share card."),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('re-fetches the share when the user clicks Try again after a failure', async () => {
    const user = userEvent.setup()
    fetchMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(jsonResponse(200, fullData))

    renderAt('/s/abc123def456')

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'PASSED', level: 1 })).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})
