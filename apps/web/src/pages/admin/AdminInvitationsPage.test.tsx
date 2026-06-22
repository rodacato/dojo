import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { AdminInvitationsPage } from './AdminInvitationsPage'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    getInvitations: vi.fn(),
    createInvitation: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

const future = () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
const past = () => new Date(Date.now() - 60 * 60 * 1000).toISOString()

const invitations = [
  { id: 'i1', token: 'PENDINGTOKEN1', status: 'pending' as const, usedBy: null, expiresAt: future(), createdAt: past() },
  { id: 'i2', token: 'USEDTOKEN0002', status: 'used' as const, usedBy: 'alice', expiresAt: future(), createdAt: past() },
  { id: 'i3', token: 'EXPIREDTKN003', status: 'expired' as const, usedBy: null, expiresAt: past(), createdAt: past() },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/invitations']}>
      <AdminInvitationsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedApi.getInvitations.mockResolvedValue(invitations)
  mockedApi.createInvitation.mockResolvedValue({
    id: 'new1',
    token: 'FRESHTOKEN999',
    url: 'https://dojo.test/invite/FRESHTOKEN999',
    expiresAt: future(),
    emailSent: false,
  })
})

describe('AdminInvitationsPage', () => {
  it('renders a row per invitation with status label and redeemer', async () => {
    renderPage()
    await screen.findByText('redeemed')

    // mid-ellipsis tokens.
    expect(screen.getByText('PEND…KEN1')).toBeInTheDocument()
    expect(screen.getByText('unused')).toBeInTheDocument()
    expect(screen.getByText('redeemed')).toBeInTheDocument()
    expect(screen.getByText('@alice')).toBeInTheDocument()
  })

  it('shows expired for an invitation past its expiry', async () => {
    renderPage()
    await screen.findByText('redeemed')
    // Two cells say "expired" (status badge + the expires column) for the expired row.
    expect(screen.getAllByText('expired')).toHaveLength(2)
  })

  it('only renders a Copy URL action for pending invitations', async () => {
    renderPage()
    await screen.findByText('redeemed')

    const pendingRow = screen.getByText('PEND…KEN1').closest('tr') as HTMLElement
    expect(within(pendingRow).getByRole('button', { name: 'Copy URL' })).toBeInTheDocument()

    const usedRow = screen.getByText('@alice').closest('tr') as HTMLElement
    expect(within(usedRow).queryByRole('button', { name: 'Copy URL' })).not.toBeInTheDocument()
  })

  it('creates an invitation with the typed email and shows the last-created panel', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('redeemed')

    await user.type(screen.getByLabelText(/Recipient email/), 'new@dev.com')
    await user.click(screen.getByRole('button', { name: 'Generate' }))

    await waitFor(() => expect(mockedApi.createInvitation).toHaveBeenCalledWith('new@dev.com'))
    // Fresh token surfaces (mid-ellipsis) and reload is triggered.
    expect(await screen.findByText('FRES…N999')).toBeInTheDocument()
    expect(mockedApi.getInvitations).toHaveBeenCalledTimes(2)
  })

  it('creates without an email (undefined arg) when the field is left blank', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('redeemed')

    await user.click(screen.getByRole('button', { name: 'Generate' }))

    await waitFor(() => expect(mockedApi.createInvitation).toHaveBeenCalledWith(undefined))
  })

  it('surfaces an error banner when creation fails and does not show last-created', async () => {
    mockedApi.createInvitation.mockRejectedValue(new Error('Quota exceeded'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('redeemed')

    await user.click(screen.getByRole('button', { name: 'Generate' }))

    expect(await screen.findByText('Quota exceeded')).toBeInTheDocument()
    expect(screen.queryByText(/Last created/)).not.toBeInTheDocument()
  })

  it('copies the invite URL to the clipboard from the row action', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderPage()
    await screen.findByText('redeemed')

    const pendingRow = screen.getByText('PEND…KEN1').closest('tr') as HTMLElement
    await user.click(within(pendingRow).getByRole('button', { name: 'Copy URL' }))

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0]?.[0]).toContain('/invite/PENDINGTOKEN1')
  })

  it('shows the empty state when there are no invitations', async () => {
    mockedApi.getInvitations.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('No invitations created yet.')).toBeInTheDocument()
  })

  it('shows an error when invitations fail to load', async () => {
    mockedApi.getInvitations.mockRejectedValue(new Error('boom'))
    renderPage()

    expect(await screen.findByText('boom')).toBeInTheDocument()
  })
})
