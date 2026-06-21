import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { AdminErrorsPage } from './AdminErrorsPage'
import { admin } from '../../lib/api/admin'

vi.mock('../../lib/api/admin', () => ({
  admin: {
    getErrors: vi.fn(),
  },
}))

const mockedAdmin = vi.mocked(admin)

type ErrorResult = Awaited<ReturnType<typeof admin.getErrors>>
type ErrorRow = ErrorResult['rows'][number]

function makeRow(over: Partial<ErrorRow> & { id: string }): ErrorRow {
  return {
    createdAt: '2026-06-20T14:30:45.000Z',
    source: 'api',
    status: 500,
    route: '/api/sessions',
    method: 'POST',
    message: 'Internal failure',
    stack: null,
    requestId: null,
    userId: null,
    context: null,
    ...over,
  }
}

function makeResult(rows: ErrorRow[], total = rows.length): ErrorResult {
  return { total, limit: 25, offset: 0, rows }
}

const rows: ErrorRow[] = [
  makeRow({ id: 'e1', status: 500, route: '/api/sessions', message: 'DB write failed', source: 'api', requestId: 'req-1', stack: 'Error: DB write failed\n  at db.ts:1' }),
  makeRow({ id: 'e2', status: 404, route: '/api/missing', method: 'GET', message: 'Not found', source: 'web' }),
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/errors']}>
      <AdminErrorsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedAdmin.getErrors.mockResolvedValue(makeResult(rows))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AdminErrorsPage', () => {
  it('fetches with default pagination on mount and renders a row per error', async () => {
    renderPage()
    await screen.findByText('DB write failed')

    expect(mockedAdmin.getErrors).toHaveBeenCalledWith({
      source: undefined,
      status: undefined,
      limit: 25,
      offset: 0,
    })
    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(screen.getByText('/api/sessions')).toBeInTheDocument()
    expect(screen.getByText('2 total')).toBeInTheDocument()
  })

  it('refetches with the chosen source filter and resets to page 1', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('DB write failed')

    await user.selectOptions(screen.getByLabelText('Source'), 'web')

    await waitFor(() =>
      expect(mockedAdmin.getErrors).toHaveBeenLastCalledWith({
        source: 'web',
        status: undefined,
        limit: 25,
        offset: 0,
      }),
    )
  })

  it('refetches with the status filter coerced to a number', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('DB write failed')

    await user.selectOptions(screen.getByLabelText('Status'), '500')

    await waitFor(() =>
      expect(mockedAdmin.getErrors).toHaveBeenLastCalledWith({
        source: undefined,
        status: 500,
        limit: 25,
        offset: 0,
      }),
    )
  })

  it('expands a row to reveal the stack and a copy-trace action', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('DB write failed')

    await user.click(screen.getByText('DB write failed'))

    expect(await screen.findByText(/at db.ts:1/)).toBeInTheDocument()
    expect(screen.getByText('Copy trace')).toBeInTheDocument()
    expect(screen.getByText(/req-1/)).toBeInTheDocument()
  })

  it('copies a formatted trace to the clipboard', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderPage()
    await screen.findByText('DB write failed')

    await user.click(screen.getByText('DB write failed'))
    await user.click(screen.getByText('Copy trace'))

    expect(writeText).toHaveBeenCalledTimes(1)
    const text = writeText.mock.calls[0]?.[0] as string
    expect(text).toContain('POST /api/sessions → 500')
    expect(text).toContain('message: DB write failed')
    expect(text).toContain('request_id: req-1')
  })

  it('manually refreshes via the Refresh button', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('DB write failed')

    await user.click(screen.getByRole('button', { name: /Refresh/ }))
    await waitFor(() => expect(mockedAdmin.getErrors).toHaveBeenCalledTimes(2))
  })

  it('shows the no-window empty state with no filters active', async () => {
    mockedAdmin.getErrors.mockResolvedValue(makeResult([], 0))
    renderPage()

    expect(await screen.findByText('No errors in this window. Nice.')).toBeInTheDocument()
  })

  it('shows a filtered empty state and clears filters back to the default fetch', async () => {
    mockedAdmin.getErrors.mockResolvedValue(makeResult([], 0))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No errors in this window. Nice.')

    await user.selectOptions(screen.getByLabelText('Source'), 'web')
    expect(await screen.findByText('No errors match the current filters.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))
    await waitFor(() =>
      expect(mockedAdmin.getErrors).toHaveBeenLastCalledWith({
        source: undefined,
        status: undefined,
        limit: 25,
        offset: 0,
      }),
    )
  })

  it('renders the error branch when the fetch rejects', async () => {
    mockedAdmin.getErrors.mockRejectedValue(new Error('forbidden'))
    renderPage()

    expect(await screen.findByText('forbidden')).toBeInTheDocument()
  })

  it('pages forward with the correct offset', async () => {
    mockedAdmin.getErrors.mockResolvedValue(makeResult(rows, 60))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('DB write failed')

    await user.click(screen.getByRole('button', { name: /Next/ }))

    await waitFor(() =>
      expect(mockedAdmin.getErrors).toHaveBeenLastCalledWith({
        source: undefined,
        status: undefined,
        limit: 25,
        offset: 25,
      }),
    )
  })
})
