import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { HistoryPage } from './HistoryPage'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: {
    getHistory: vi.fn(),
  },
}))

const mockedGetHistory = vi.mocked(api.getHistory)

type HistoryResponse = Awaited<ReturnType<typeof api.getHistory>>

function makeResponse(overrides: Partial<HistoryResponse> = {}): HistoryResponse {
  return {
    sessions: [
      {
        id: 's1',
        status: 'completed',
        kataTitle: 'Reverse a Linked List',
        kataType: 'algorithm',
        difficulty: 'easy',
        verdict: 'passed',
        startedAt: '2026-06-01T10:00:00.000Z',
        completedAt: '2026-06-01T10:08:00.000Z',
      },
      {
        id: 's2',
        status: 'completed',
        kataTitle: 'Design a Rate Limiter',
        kataType: 'system_design',
        difficulty: 'hard',
        verdict: 'needs_work',
        startedAt: '2026-06-02T10:00:00.000Z',
        completedAt: '2026-06-02T10:30:00.000Z',
      },
    ],
    total: 2,
    page: 1,
    totalPages: 1,
    ...overrides,
  }
}

function renderHistory(initialEntry = '/history') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/katas" element={<div>katas browser</div>} />
        <Route path="/katas/:id/result" element={<div>kata result page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HistoryPage', () => {
  it('shows the skeleton while the history request is pending, before any data renders', () => {
    // Never-resolving promise keeps the page in its loading branch.
    mockedGetHistory.mockReturnValue(new Promise(() => {}))

    renderHistory()

    // The static header is always present...
    expect(screen.getByRole('heading', { name: 'Kata history' })).toBeInTheDocument()
    // ...but neither real rows nor the empty state nor the total count exist yet.
    expect(screen.queryByText('Reverse a Linked List')).not.toBeInTheDocument()
    expect(
      screen.queryByText('No sessions yet. The dojo is patient.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('completed kata')).not.toBeInTheDocument()
  })

  it('requests the first page on mount and renders a row per session plus the total', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse())

    renderHistory()

    expect(await screen.findByText('Reverse a Linked List')).toBeInTheDocument()
    expect(screen.getByText('Design a Rate Limiter')).toBeInTheDocument()
    // Verdict badge from a real DenseSessionRow child (not mocked).
    expect(screen.getByText('PASSED')).toBeInTheDocument()
    expect(screen.getByText('NEEDS WORK')).toBeInTheDocument()
    // Total summary appears once there is data.
    expect(screen.getByText('completed kata')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    expect(mockedGetHistory).toHaveBeenCalledWith(1)
    // The empty state must not leak into the populated view.
    expect(
      screen.queryByText('No sessions yet. The dojo is patient.'),
    ).not.toBeInTheDocument()
  })

  it('renders the empty state with a CTA into the dojo when there are no sessions', async () => {
    mockedGetHistory.mockResolvedValue(
      makeResponse({ sessions: [], total: 0, totalPages: 1 }),
    )

    renderHistory()

    expect(
      await screen.findByText('No sessions yet. The dojo is patient.'),
    ).toBeInTheDocument()
    // No total count when nothing is completed.
    expect(screen.queryByText('completed kata')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Enter the dojo/ }))

    expect(screen.getByText('katas browser')).toBeInTheDocument()
  })

  it('navigates to the session result when a row is clicked', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse())

    renderHistory()

    const row = await screen.findByRole('button', { name: /Reverse a Linked List/ })
    await userEvent.click(row)

    expect(screen.getByText('kata result page')).toBeInTheDocument()
  })

  it('hides pagination for a single page and refetches with the new page on navigation', async () => {
    mockedGetHistory.mockResolvedValue(
      makeResponse({ total: 24, totalPages: 3, page: 1 }),
    )

    renderHistory()

    await screen.findByText('Reverse a Linked List')

    const pager = screen.getByRole('navigation', { name: 'History pagination' })
    await userEvent.click(within(pager).getByRole('button', { name: 'Next →' }))

    await waitFor(() => expect(mockedGetHistory).toHaveBeenCalledWith(2))
  })

  it('does not render pagination when there is only one page', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse({ totalPages: 1 }))

    renderHistory()

    await screen.findByText('Reverse a Linked List')
    expect(
      screen.queryByRole('navigation', { name: 'History pagination' }),
    ).not.toBeInTheDocument()
  })
})
