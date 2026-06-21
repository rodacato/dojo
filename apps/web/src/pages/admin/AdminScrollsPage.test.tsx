import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { AdminScrollsPage } from './AdminScrollsPage'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    getAdminScrolls: vi.fn(),
    seedScrolls: vi.fn(),
    updateScroll: vi.fn(),
    wipeScrollContent: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

type AdminScroll = Awaited<ReturnType<typeof api.getAdminScrolls>>[number]

function makeScroll(over: Partial<AdminScroll> & { id: string; slug: string; title: string }): AdminScroll {
  return {
    description: 'desc',
    language: 'TS',
    accentColor: '#3b82f6',
    status: 'published',
    isPublic: true,
    lessonCount: 4,
    stepCount: 20,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

const scrolls: AdminScroll[] = [
  makeScroll({ id: 's1', slug: 'async-rs', title: 'Async Rust', status: 'published', isPublic: true, lessonCount: 6, stepCount: 30 }),
  makeScroll({ id: 's2', slug: 'sql-deep', title: 'SQL Deep Dive', status: 'draft', isPublic: false, lessonCount: 3, stepCount: 12 }),
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/scrolls']}>
      <AdminScrollsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedApi.getAdminScrolls.mockResolvedValue(scrolls)
  mockedApi.seedScrolls.mockResolvedValue({ seeded: [{ slug: 'async-rs', title: 'Async Rust', lessonCount: 6, stepCount: 30 }] })
  mockedApi.updateScroll.mockResolvedValue({ id: 's1', isPublic: false, status: 'published' })
  mockedApi.wipeScrollContent.mockResolvedValue({ ok: true })
})

describe('AdminScrollsPage', () => {
  it('renders a row per scroll with title, slug, lesson and step counts', async () => {
    renderPage()
    await screen.findByText('Async Rust')

    const row = screen.getByText('Async Rust').closest('tr') as HTMLElement
    expect(within(row).getByText('/scrolls/async-rs')).toBeInTheDocument()
    expect(within(row).getByText('6')).toBeInTheDocument()
    expect(within(row).getByText('30')).toBeInTheDocument()
  })

  it('shows the published/draft counts in the header', async () => {
    renderPage()
    await screen.findByText('Async Rust')

    expect(screen.getByText('1 published')).toBeInTheDocument()
    expect(screen.getByText('1 draft')).toBeInTheDocument()
  })

  it('toggles status published -> draft via updateScroll then refreshes', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Async Rust')

    const row = screen.getByText('Async Rust').closest('tr') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'published' }))

    await waitFor(() => expect(mockedApi.updateScroll).toHaveBeenCalledWith('s1', { status: 'draft' }))
    expect(mockedApi.getAdminScrolls).toHaveBeenCalledTimes(2)
  })

  it('toggles the public switch via updateScroll on a published scroll', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Async Rust')

    // Async Rust is public+published — its toggle is enabled and turns it private.
    await user.click(screen.getByRole('switch', { name: /Make private Async Rust/ }))

    await waitFor(() => expect(mockedApi.updateScroll).toHaveBeenCalledWith('s1', { isPublic: false }))
  })

  it('disables the public toggle while the scroll is in draft', async () => {
    renderPage()
    await screen.findByText('SQL Deep Dive')

    // SQL Deep Dive is draft — its public toggle must be disabled.
    expect(screen.getByRole('switch', { name: /Make public SQL Deep Dive/ })).toBeDisabled()
  })

  it('re-seeds the catalog and shows a success notice', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Async Rust')

    await user.click(screen.getByRole('button', { name: /Re-seed all/ }))

    await waitFor(() => expect(mockedApi.seedScrolls).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('1 scroll patched in place.')).toBeInTheDocument()
    // refreshed after seeding.
    expect(mockedApi.getAdminScrolls).toHaveBeenCalledTimes(2)
  })

  it('requires typing the slug before wiping content, then calls wipeScrollContent', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Async Rust')

    const row = screen.getByText('Async Rust').closest('tr') as HTMLElement
    await user.click(within(row).getByLabelText('Wipe content'))

    // Modal open with the slug-typed confirmation — primary disabled until slug matches.
    expect(await screen.findByText('Wipe Async Rust?')).toBeInTheDocument()
    // The icon action also has aria-label "Wipe content"; the modal primary is the one with visible text.
    const modalPrimary = screen.getByText('Wipe content').closest('button') as HTMLButtonElement
    expect(modalPrimary).toBeDisabled()

    await user.type(screen.getByLabelText('Type the slug to confirm'), 'async-rs')
    expect(modalPrimary).toBeEnabled()
    await user.click(modalPrimary)

    await waitFor(() => expect(mockedApi.wipeScrollContent).toHaveBeenCalledWith('s1'))
    expect(await screen.findByText(/Async Rust cleared\./)).toBeInTheDocument()
  })

  it('does not wipe when the typed slug does not match', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Async Rust')

    const row = screen.getByText('Async Rust').closest('tr') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Wipe content' }))

    await user.type(screen.getByLabelText('Type the slug to confirm'), 'wrong-slug')
    const primary = screen.getAllByRole('button', { name: 'Wipe content' }).find((b) => (b as HTMLButtonElement).disabled)
    expect(primary).toBeDisabled()
    expect(mockedApi.wipeScrollContent).not.toHaveBeenCalled()
  })

  it('copies the public URL for a scroll', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderPage()
    await screen.findByText('Async Rust')

    const row = screen.getByText('Async Rust').closest('tr') as HTMLElement
    await user.click(within(row).getByLabelText('Copy public URL'))

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0]?.[0]).toContain('/scrolls/async-rs')
  })

  it('shows an error notice when the initial load fails', async () => {
    mockedApi.getAdminScrolls.mockRejectedValue(new Error('load boom'))
    renderPage()

    expect(await screen.findByText('load boom')).toBeInTheDocument()
  })

  it('shows the empty state when there are no scrolls', async () => {
    mockedApi.getAdminScrolls.mockResolvedValue([])
    renderPage()

    expect(await screen.findByText(/No scrolls yet\./)).toBeInTheDocument()
  })
})
