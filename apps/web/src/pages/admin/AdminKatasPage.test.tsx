import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AdminKatasPage } from './AdminKatasPage'
import { api, type AdminKataDTO } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    getAdminKatas: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

function makeKata(over: Partial<AdminKataDTO> & { id: string; title: string }): AdminKataDTO {
  return {
    type: 'code',
    difficulty: 'medium',
    duration: 20,
    status: 'published',
    sessionCount: 0,
    avgScore: null,
    variationCount: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

const katas: AdminKataDTO[] = [
  makeKata({ id: 'k1', title: 'Rate limiter', type: 'code', difficulty: 'hard', status: 'published', sessionCount: 50, avgScore: 0.9, createdAt: '2026-03-01T00:00:00.000Z' }),
  makeKata({ id: 'k2', title: 'Idempotency keys', type: 'chat', difficulty: 'medium', status: 'draft', sessionCount: 10, avgScore: 0.3, createdAt: '2026-02-01T00:00:00.000Z' }),
  makeKata({ id: 'k3', title: 'Backpressure review', type: 'review', difficulty: 'easy', status: 'archived', sessionCount: 200, avgScore: null, createdAt: '2026-01-15T00:00:00.000Z' }),
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/katas']}>
      <Routes>
        <Route path="/admin/katas" element={<AdminKatasPage />} />
        <Route path="/admin/katas/new" element={<div>new kata form</div>} />
        <Route path="/admin/katas/:id/edit" element={<div>edit kata form</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedApi.getAdminKatas.mockResolvedValue(katas)
})

describe('AdminKatasPage', () => {
  it('renders one row per fetched kata with its title and session count', async () => {
    renderPage()

    expect(await screen.findByText('Rate limiter')).toBeInTheDocument()
    expect(screen.getByText('Idempotency keys')).toBeInTheDocument()
    expect(screen.getByText('Backpressure review')).toBeInTheDocument()
    // sessionCount is rendered with toLocaleString — 200 stays "200" but proves the value flows through.
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('shows the status counts derived from the catalog', async () => {
    renderPage()
    await screen.findByText('Rate limiter')

    expect(screen.getByText('1 published')).toBeInTheDocument()
    expect(screen.getByText('1 draft')).toBeInTheDocument()
    expect(screen.getByText('1 archived')).toBeInTheDocument()
  })

  it('renders avg score as a percentage and a dash when null', async () => {
    renderPage()
    const row = (await screen.findByText('Rate limiter')).closest('tr') as HTMLElement
    expect(within(row).getByText('90%')).toBeInTheDocument()

    const nullRow = screen.getByText('Backpressure review').closest('tr') as HTMLElement
    expect(within(nullRow).getByText('—')).toBeInTheDocument()
  })

  it('filters rows by the search box (title substring)', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Rate limiter')

    await user.type(screen.getByPlaceholderText('Search title...'), 'idempo')

    expect(screen.getByText('Idempotency keys')).toBeInTheDocument()
    expect(screen.queryByText('Rate limiter')).not.toBeInTheDocument()
    expect(screen.queryByText('Backpressure review')).not.toBeInTheDocument()
  })

  it('filters by status via the Status select', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Rate limiter')

    await user.selectOptions(screen.getByLabelText('Status'), 'draft')

    expect(screen.getByText('Idempotency keys')).toBeInTheDocument()
    expect(screen.queryByText('Rate limiter')).not.toBeInTheDocument()
    expect(screen.queryByText('Backpressure review')).not.toBeInTheDocument()
  })

  it('filters by type via the Type select', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Rate limiter')

    await user.selectOptions(screen.getByLabelText('Type'), 'review')

    expect(screen.getByText('Backpressure review')).toBeInTheDocument()
    expect(screen.queryByText('Rate limiter')).not.toBeInTheDocument()
  })

  it('sorts by most sessions, moving the highest-count kata to the top', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Rate limiter')

    await user.selectOptions(screen.getByLabelText('Sort'), 'most_sessions')

    const titles = screen.getAllByText(/Rate limiter|Idempotency keys|Backpressure review/)
    // k3 has 200 sessions — it must be first.
    expect(titles[0]).toHaveTextContent('Backpressure review')
  })

  it('navigates to the edit route when a row is clicked', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByText('Idempotency keys'))

    expect(await screen.findByText('edit kata form')).toBeInTheDocument()
  })

  it('navigates to the new-kata route from the header button', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Rate limiter')

    await user.click(screen.getByRole('button', { name: '+ New kata' }))
    expect(await screen.findByText('new kata form')).toBeInTheDocument()
  })

  it('shows the no-matches empty state and clears filters back to the full list', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Rate limiter')

    await user.type(screen.getByPlaceholderText('Search title...'), 'zzz-nothing')
    expect(
      await screen.findByText(/No katas match\./),
    ).toBeInTheDocument()
    expect(screen.queryByText('Rate limiter')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(await screen.findByText('Rate limiter')).toBeInTheDocument()
  })

  it('shows the empty-catalog state when the API returns no katas', async () => {
    mockedApi.getAdminKatas.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('No katas in the catalog yet.')).toBeInTheDocument()
  })
})
