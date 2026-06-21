import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { AdminHealthPage } from './AdminHealthPage'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    getAdminHealth: vi.fn(),
    reprovisionPiston: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

type HealthData = Awaited<ReturnType<typeof api.getAdminHealth>>

function makeHealth(over: Partial<HealthData> = {}): HealthData {
  return {
    api: { status: 'ok', latencyMs: 3, detail: { env: 'production' } },
    db: { status: 'ok', latencyMs: 5, detail: {} },
    piston: {
      status: 'ok',
      latencyMs: 12,
      detail: {
        expected: [{ language: 'python', version: '3.12' }, { language: 'node', version: '20' }],
        actual: [{ language: 'python', version: '3.12' }, { language: 'node', version: '20' }],
        missing: [],
        extra: [],
      },
    },
    llm: { status: 'ok', latencyMs: null, detail: { adapter: 'anthropic', configured: true } },
    ...over,
  }
}

function cardFor(title: string): HTMLElement {
  return screen.getByRole('heading', { name: title }).closest('.rounded-md') as HTMLElement
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/health']}>
      <AdminHealthPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedApi.getAdminHealth.mockResolvedValue(makeHealth())
})

describe('AdminHealthPage', () => {
  it('renders one card per subsystem with its OK status and latency', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'API' })

    expect(within(cardFor('API')).getByText('OK · 3ms')).toBeInTheDocument()
    expect(within(cardFor('API')).getByText('env: production')).toBeInTheDocument()
    expect(within(cardFor('Database')).getByText('Postgres reachable')).toBeInTheDocument()
  })

  it('reflects a DOWN database with its unreachable copy and error detail', async () => {
    mockedApi.getAdminHealth.mockResolvedValue(
      makeHealth({ db: { status: 'down', latencyMs: null, detail: { error: 'ECONNREFUSED' } } }),
    )
    renderPage()
    await screen.findByRole('heading', { name: 'Database' })

    const card = cardFor('Database')
    expect(await within(card).findByText('DOWN')).toBeInTheDocument()
    expect(within(card).getByText('Postgres unreachable')).toBeInTheDocument()
    expect(within(card).getByText('ECONNREFUSED')).toBeInTheDocument()
  })

  it('shows installed runtime count and lists each installed runtime when piston is ok', async () => {
    renderPage()
    const card = await screen.findByRole('heading', { name: 'Piston' }).then((h) => h.closest('.rounded-md') as HTMLElement)

    expect(within(card).getByText('2 of 2 runtimes installed')).toBeInTheDocument()
    expect(within(card).getByText('python 3.12')).toBeInTheDocument()
    expect(within(card).getByText('node 20')).toBeInTheDocument()
  })

  it('surfaces missing runtimes in the secondary line when piston is degraded', async () => {
    mockedApi.getAdminHealth.mockResolvedValue(
      makeHealth({
        piston: {
          status: 'down',
          latencyMs: 9,
          detail: {
            expected: [{ language: 'python', version: '3.12' }, { language: 'go', version: '1.22' }],
            actual: [{ language: 'python', version: '3.12' }],
            missing: [{ language: 'go', version: '1.22' }],
            extra: [],
          },
        },
      }),
    )
    renderPage()
    const card = await screen.findByRole('heading', { name: 'Piston' }).then((h) => h.closest('.rounded-md') as HTMLElement)

    expect(within(card).getByText('1 of 2 runtimes installed')).toBeInTheDocument()
    expect(within(card).getByText('Missing: go 1.22')).toBeInTheDocument()
  })

  it('shows the piston unreachable copy when the detail carries an error', async () => {
    mockedApi.getAdminHealth.mockResolvedValue(
      makeHealth({
        piston: {
          status: 'down',
          latencyMs: null,
          detail: { expected: [], actual: [], missing: [], extra: [], error: 'timeout' },
        },
      }),
    )
    renderPage()
    const card = await screen.findByRole('heading', { name: 'Piston' }).then((h) => h.closest('.rounded-md') as HTMLElement)

    expect(within(card).getByText('Unreachable — timeout')).toBeInTheDocument()
  })

  it('shows the mock-adapter copy when the LLM adapter is mock and unconfigured', async () => {
    mockedApi.getAdminHealth.mockResolvedValue(
      makeHealth({ llm: { status: 'unconfigured', latencyMs: null, detail: { adapter: 'mock', configured: false } } }),
    )
    renderPage()
    const card = await screen.findByRole('heading', { name: 'LLM' }).then((h) => h.closest('.rounded-md') as HTMLElement)

    expect(within(card).getByText('UNCONFIGURED')).toBeInTheDocument()
    expect(within(card).getByText(/adapter: mock \(API key missing\)/)).toBeInTheDocument()
    expect(within(card).getByText(/Mock adapter — no external calls/)).toBeInTheDocument()
  })

  it('reprovisions piston, reports the install summary, and reloads health', async () => {
    mockedApi.reprovisionPiston.mockResolvedValue({
      installed: [{ language: 'go', version: '1.22' }],
      skipped: [{ language: 'python', version: '3.12' }],
      failed: [],
      runtimes: [],
    })
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Piston' })

    await user.click(screen.getByRole('button', { name: /Reprovision/ }))

    await waitFor(() => expect(mockedApi.reprovisionPiston).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('1 installed · 1 skipped · 0 failed')).toBeInTheDocument()
    // load() runs once on mount + once after reprovision.
    expect(mockedApi.getAdminHealth).toHaveBeenCalledTimes(2)
  })

  it('reports a failed reprovision request without crashing the page', async () => {
    mockedApi.reprovisionPiston.mockRejectedValue(new Error('502 bad gateway'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'Piston' })

    await user.click(screen.getByRole('button', { name: /Reprovision/ }))

    expect(await screen.findByText(/Reprovision request died: 502 bad gateway/)).toBeInTheDocument()
  })

  it('shows the load-failed banner when health cannot be fetched', async () => {
    mockedApi.getAdminHealth.mockRejectedValue(new Error('unauthorized'))
    renderPage()

    expect(await screen.findByText('Load failed')).toBeInTheDocument()
    expect(screen.getByText('unauthorized')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'API' })).not.toBeInTheDocument()
  })

  it('refreshes health on demand from the header button', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('heading', { name: 'API' })

    await user.click(screen.getByRole('button', { name: /Refresh/ }))
    await waitFor(() => expect(mockedApi.getAdminHealth).toHaveBeenCalledTimes(2))
  })
})
