import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { BeltDTO, MilestoneDTO, UserDTO } from '@dojo/shared'
import { BeltsPage } from './BeltsPage'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: { getBelts: vi.fn() },
}))

// BrushstrokeUnderline pulls GSAP + IntersectionObserver + SVGPath.getTotalLength,
// none of which jsdom implements. Stub it to a marker so the page renders.
vi.mock('../components/ui/BrushstrokeUnderline', () => ({
  BrushstrokeUnderline: ({ seed }: { seed: string }) => (
    <div data-testid="brushstroke" data-seed={seed} />
  ),
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedGetBelts = vi.mocked(api.getBelts)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const belt: BeltDTO = {
  rank: 'green',
  factors: { completed: 42, distinctClusters: 7, activeDays30: 13, daysAtRank: 9 },
}

function authed() {
  mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <BeltsPage />
    </MemoryRouter>,
  )
}

describe('BeltsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the loading skeleton while the belts request is pending', () => {
    authed()
    mockedGetBelts.mockReturnValue(new Promise(() => {})) // never resolves

    const { container } = renderPage()

    // Loading state: the plain "Belts" placeholder heading, not the rank header.
    expect(screen.getByRole('heading', { name: 'Belts' })).toBeInTheDocument()
    expect(screen.queryByText(/your rank/i)).not.toBeInTheDocument()
    // Six SkeletonCards render while the request is pending.
    expect(container.querySelectorAll('.bg-surface.p-6')).toHaveLength(6)
  })

  it('renders the rank header, factors, and milestone progress once data loads', async () => {
    authed()
    const milestones: MilestoneDTO[] = [
      { id: 'FIRST_KATA', earnedAt: '2026-03-04T10:00:00.000Z', contextRef: 's1' },
      { id: 'UNDEFINED_NO_MORE', earnedAt: '2026-05-20T10:00:00.000Z', contextRef: null },
    ]
    mockedGetBelts.mockResolvedValue({ belt, milestones })

    renderPage()

    // Loaded header replaces the skeleton: rank surfaced + swatch labelled.
    expect(await screen.findByRole('heading', { name: /green belt/i })).toBeInTheDocument()
    expect(screen.getByText('Your rank')).toBeInTheDocument()
    expect(screen.getByLabelText('green belt')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Belts' })).not.toBeInTheDocument()

    // Factors come straight from the DTO.
    const completed = screen.getByText('Katas completed').closest('div')!
    expect(within(completed).getByText('42')).toBeInTheDocument()
    const clusters = screen.getByText('Topic clusters').closest('div')!
    expect(within(clusters).getByText('7')).toBeInTheDocument()

    // 2 of the 13 catalogued milestones earned.
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('of 13 earned')).toBeInTheDocument()
  })

  it('reads the slug from the belt and passes the seed to the underline', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({ belt, milestones: [] })

    renderPage()

    const brush = await screen.findByTestId('brushstroke')
    expect(brush).toHaveAttribute('data-seed', 'belt-green')
  })

  it('marks an earned milestone with its date and leaves unearned ones at the placeholder', async () => {
    authed()
    const milestones: MilestoneDTO[] = [
      { id: 'FIRST_KATA', earnedAt: '2026-03-04T10:00:00.000Z', contextRef: 's1' },
    ]
    mockedGetBelts.mockResolvedValue({ belt, milestones })

    renderPage()

    // Earned milestone surfaces its date (ISO date slice).
    const earnedCard = (await screen.findByText('First Kata')).closest('div')!
      .parentElement!.parentElement!
    expect(within(earnedCard).getByText('Earned 2026-03-04')).toBeInTheDocument()

    // An unearned one shows the em-dash placeholder, never an "Earned" date.
    const unearnedCard = screen.getByText('Polyglot').closest('div')!
      .parentElement!.parentElement!
    expect(within(unearnedCard).getByText('—')).toBeInTheDocument()
    expect(within(unearnedCard).queryByText(/^Earned /)).not.toBeInTheDocument()
  })

  it('shows zero earned when no milestones come back', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({ belt, milestones: [] })

    renderPage()

    expect(await screen.findByText('of 13 earned')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    // No card should claim an earned date.
    expect(screen.queryByText(/^Earned /)).not.toBeInTheDocument()
  })

  it('does not call the API for an anonymous visitor and stays on the skeleton', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
    mockedGetBelts.mockResolvedValue({ belt, milestones: [] })

    renderPage()

    expect(mockedGetBelts).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Belts' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /green belt/i })).not.toBeInTheDocument()
  })

  it('shows an error state with a retry when the belts request rejects', async () => {
    authed()
    mockedGetBelts.mockRejectedValue(new Error('boom'))

    renderPage()

    expect(await screen.findByText('We couldn\'t load your belt progress.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    // The skeleton is gone and no stale rank leaked through.
    expect(screen.queryByText('Your rank')).not.toBeInTheDocument()
  })

  it('refetches and recovers when Try again is clicked after a failure', async () => {
    authed()
    mockedGetBelts.mockRejectedValueOnce(new Error('boom'))
    mockedGetBelts.mockResolvedValueOnce({ belt, milestones: [] })

    renderPage()

    const retry = await screen.findByRole('button', { name: 'Try again' })
    await userEvent.click(retry)

    expect(await screen.findByText('Your rank')).toBeInTheDocument()
    expect(mockedGetBelts).toHaveBeenCalledTimes(2)
  })
})
