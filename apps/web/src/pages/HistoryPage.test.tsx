import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

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
        outcome: 'passed',
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
        outcome: 'needs_work',
        startedAt: '2026-06-02T10:00:00.000Z',
        completedAt: '2026-06-02T10:30:00.000Z',
      },
    ],
    total: 2,
    recordTotal: 2,
    page: 1,
    totalPages: 1,
    ...overrides,
  }
}

function ResultStub() {
  const location = useLocation()
  return <div>kata result page from {(location.state as { from: string }).from}</div>
}

function renderHistory(initialEntry = '/history') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/katas" element={<div>katas browser</div>} />
        <Route path="/katas/:id/result" element={<ResultStub />} />
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
    // ...but neither real rows nor the empty state nor a total of zero exist yet.
    expect(screen.queryByText('Reverse a Linked List')).not.toBeInTheDocument()
    expect(
      screen.queryByText('No sessions yet. The dojo is patient.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('sessions')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
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
    expect(screen.getByText('sessions')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    expect(mockedGetHistory).toHaveBeenCalledWith(1, { outcome: 'all', q: '' })
    // The empty state must not leak into the populated view.
    expect(
      screen.queryByText('No sessions yet. The dojo is patient.'),
    ).not.toBeInTheDocument()
  })

  it('renders the empty state with a CTA into the dojo when there are no sessions', async () => {
    mockedGetHistory.mockResolvedValue(
      makeResponse({ sessions: [], total: 0, recordTotal: 0, totalPages: 0 }),
    )

    renderHistory()

    expect(
      await screen.findByText('No sessions yet. The dojo is patient.'),
    ).toBeInTheDocument()
    // No total count when nothing is completed.
    expect(screen.queryByText('sessions')).not.toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Find a past kata' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Enter the dojo/ }))

    expect(screen.getByText('katas browser')).toBeInTheDocument()
  })

  it('says so when the next page fails, keeps the rows and retries that page', async () => {
    mockedGetHistory.mockReset()
    mockedGetHistory.mockResolvedValueOnce(makeResponse({ total: 40, recordTotal: 40, totalPages: 2 }))
    mockedGetHistory.mockRejectedValueOnce(new Error('history 500'))
    mockedGetHistory.mockResolvedValue(makeResponse({ total: 40, recordTotal: 40, page: 2, totalPages: 2 }))

    renderHistory()
    await screen.findByText('Reverse a Linked List')

    await userEvent.click(screen.getByRole('button', { name: /Next/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load that page.")
    expect(screen.getByText('Reverse a Linked List')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Retry page 2' }))

    await waitFor(() => expect(mockedGetHistory).toHaveBeenLastCalledWith(2, { outcome: 'all', q: '' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  })

  it('shows an error with a retry instead of the empty state when the request rejects', async () => {
    mockedGetHistory.mockRejectedValueOnce(new Error('history 500'))
    mockedGetHistory.mockResolvedValue(makeResponse())

    renderHistory()

    expect(await screen.findByText("We couldn't load your history.")).toBeInTheDocument()
    expect(screen.queryByText('No sessions yet. The dojo is patient.')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Reverse a Linked List')).toBeInTheDocument()
    expect(mockedGetHistory).toHaveBeenCalledTimes(2)
  })

  it('links a row to its result and hands over the filtered history to return to', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse({ total: 40, recordTotal: 90, page: 2, totalPages: 2 }))

    renderHistory('/history?q=rate&outcome=needs_work&page=2')

    const row = await screen.findByRole('link', { name: /Reverse a Linked List/ })
    await userEvent.click(row)

    expect(
      screen.getByText('kata result page from /history?q=rate&outcome=needs_work&page=2'),
    ).toBeInTheDocument()
  })

  it('hides pagination for a single page and refetches with the new page on navigation', async () => {
    mockedGetHistory.mockResolvedValue(
      makeResponse({ total: 24, recordTotal: 24, totalPages: 3, page: 1 }),
    )

    renderHistory()

    await screen.findByText('Reverse a Linked List')

    const pager = screen.getByRole('navigation', { name: 'History pagination' })
    await userEvent.click(within(pager).getByRole('button', { name: 'Next →' }))

    await waitFor(() => expect(mockedGetHistory).toHaveBeenCalledWith(2, { outcome: 'all', q: '' }))
  })

  it('does not render pagination when there is only one page', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse({ totalPages: 1 }))

    renderHistory()

    await screen.findByText('Reverse a Linked List')
    expect(
      screen.queryByRole('navigation', { name: 'History pagination' }),
    ).not.toBeInTheDocument()
  })

  it('reads filters from the URL and counts matches against the whole record', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse({ total: 2, recordTotal: 30 }))

    renderHistory('/history?q=%20rate%20&outcome=needs_work')

    expect(await screen.findByText('2 of 30 sessions')).toBeInTheDocument()
    expect(mockedGetHistory).toHaveBeenCalledWith(1, { outcome: 'needs_work', q: 'rate' })
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Find a kata' })).toHaveValue('rate')
    expect(screen.getByRole('combobox', { name: 'Result' })).toHaveValue('needs_work')
  })

  it('ignores an unknown outcome in the URL', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse())

    renderHistory('/history?outcome=failed')

    await screen.findByText('Reverse a Linked List')
    expect(mockedGetHistory).toHaveBeenCalledWith(1, { outcome: 'all', q: '' })
  })

  it('searches after the pause in typing and goes back to the first page', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse({ total: 40, recordTotal: 40, page: 2, totalPages: 2 }))

    renderHistory('/history?page=2')
    await screen.findByText('Reverse a Linked List')
    mockedGetHistory.mockClear()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Find a kata' }), 'rate')

    await waitFor(() => expect(mockedGetHistory).toHaveBeenCalledWith(1, { outcome: 'all', q: 'rate' }))
    expect(mockedGetHistory).toHaveBeenCalledTimes(1)
  })

  it('applies the outcome filter from the first page', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse({ total: 40, recordTotal: 40, page: 2, totalPages: 2 }))

    renderHistory('/history?page=2')
    await screen.findByText('Reverse a Linked List')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Result' }), 'expired')

    await waitFor(() => expect(mockedGetHistory).toHaveBeenLastCalledWith(1, { outcome: 'expired', q: '' }))
  })

  it('tells a search with no match from an empty record, and clears back to the record', async () => {
    mockedGetHistory.mockResolvedValueOnce(makeResponse({ sessions: [], total: 0, recordTotal: 12, totalPages: 0 }))
    mockedGetHistory.mockResolvedValue(makeResponse({ total: 12, recordTotal: 12 }))

    renderHistory('/history?q=nothing')

    expect(await screen.findByText('No matching sessions.')).toBeInTheDocument()
    expect(screen.getByText('0 of 12 sessions')).toBeInTheDocument()
    expect(screen.queryByText('No sessions yet. The dojo is patient.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Enter the dojo/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(await screen.findByText('Reverse a Linked List')).toBeInTheDocument()
    expect(mockedGetHistory).toHaveBeenLastCalledWith(1, { outcome: 'all', q: '' })
    expect(screen.getByRole('searchbox', { name: 'Find a kata' })).toHaveValue('')
    expect(screen.getByRole('searchbox', { name: 'Find a kata' })).toHaveFocus()
  })

  it('never shows rows from other filters when a filtered request fails', async () => {
    mockedGetHistory.mockResolvedValueOnce(makeResponse())
    mockedGetHistory.mockRejectedValueOnce(new Error('history 500'))

    renderHistory()
    await screen.findByText('Reverse a Linked List')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Result' }), 'passed')

    expect(await screen.findByText("We couldn't load your history.")).toBeInTheDocument()
    expect(screen.queryByText('Reverse a Linked List')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Result' })).toHaveValue('passed')
  })

  it('shows the outcome the server derived, not one guessed from the status', async () => {
    mockedGetHistory.mockResolvedValue(
      makeResponse({
        sessions: [
          {
            id: 's3',
            status: 'failed',
            kataTitle: 'Evaluation broke',
            kataType: 'code',
            difficulty: 'easy',
            verdict: null,
            outcome: 'no_evaluation',
            startedAt: '2026-06-02T10:00:00.000Z',
            completedAt: null,
          },
        ],
        total: 1,
        recordTotal: 1,
      }),
    )

    renderHistory()

    await screen.findByText('Evaluation broke')
    const row = screen.getByRole('link', { name: /Evaluation broke/ })
    expect(row).toHaveTextContent('No evaluation')
    expect(row).not.toHaveTextContent('Expired')
    expect(screen.getByText('session')).toBeInTheDocument()
  })

  it('groups rows by day with the date on one strip', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse())

    renderHistory()

    expect(await screen.findByRole('heading', { name: /Jun 1, 2026/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Jun 2, 2026/ })).toBeInTheDocument()
  })

  it('moves focus to the first day once a new page arrives', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse({ total: 40, recordTotal: 40, totalPages: 2 }))

    renderHistory()
    await screen.findByText('Reverse a Linked List')

    await userEvent.click(screen.getByRole('button', { name: 'Next →' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: /Jun 1, 2026/ })).toHaveFocus())
  })

  it('keeps loaded sessions offline and stops every control that needs the network', async () => {
    mockedGetHistory.mockResolvedValue(makeResponse({ total: 40, recordTotal: 40, totalPages: 2 }))
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

    renderHistory()

    expect(await screen.findByText('Offline. Showing previously loaded sessions.')).toBeInTheDocument()
    expect(screen.getByText('Reverse a Linked List')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Find a kata' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Result' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled()

    vi.restoreAllMocks()
  })
})
