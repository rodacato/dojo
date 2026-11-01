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
  api: { getBelts: vi.fn(), getPractitioner: vi.fn(() => new Promise(() => {})) },
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

    renderPage()

    // Loading state: the plain "Belts" placeholder heading, not the rank header.
    expect(screen.getByRole('heading', { name: 'Belts' })).toBeInTheDocument()
    expect(screen.queryByText(/your rank/i)).not.toBeInTheDocument()
    expect(screen.getByRole('status', { busy: true })).toHaveTextContent('Loading your belt record')
  })

  it('renders the rank header, factors, and milestone progress once data loads', async () => {
    authed()
    const milestones: MilestoneDTO[] = [
      { id: 'FIRST_KATA', earnedAt: '2026-03-04T10:00:00.000Z', contextRef: 's1' },
      { id: 'UNDEFINED_NO_MORE', earnedAt: '2026-05-20T10:00:00.000Z', contextRef: null },
    ]
    mockedGetBelts.mockResolvedValue({ belt, record: [], next: null, milestones })

    renderPage()

    // Loaded header replaces the skeleton: rank surfaced + swatch labelled.
    expect(await screen.findByRole('heading', { name: /green belt/i })).toBeInTheDocument()
    expect(screen.getByText('Your rank')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Belts' })).not.toBeInTheDocument()

    // Factors come straight from the DTO.
    const completed = screen.getByText('Kata completed').closest('div')!
    expect(within(completed).getByText('42')).toBeInTheDocument()
    const clusters = screen.getByText('Topic clusters').closest('div')!
    expect(within(clusters).getByText('7')).toBeInTheDocument()

    // 2 of the 9 earnable milestones; the retired SENSEI_APPROVED is not counted.
    expect(screen.getByText('2 of 9 earned')).toBeInTheDocument()
  })

  it('dates the belts reached and names the ones still ahead', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({
      belt,
      record: [
        { rank: 'white', reachedAt: '2026-01-05T10:00:00.000Z' },
        { rank: 'yellow', reachedAt: '2026-02-01T10:00:00.000Z' },
        { rank: 'green', reachedAt: '2026-03-10T10:00:00.000Z' },
      ],
      next: { rank: 'brown', criteria: { completed: 120, distinctClusters: 6, activeDays30: 15, daysAtRank: 60 } },
      milestones: [],
    })

    renderPage()

    const current = (await screen.findByText('Current belt')).closest('li')!
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(within(current).getByText('Mar 10, 2026')).toBeInTheDocument()
    expect(screen.getByText('Feb 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('Next belt').closest('li')).toHaveTextContent('brown')
    expect(screen.getByText('Ahead').closest('li')).toHaveTextContent('black')
  })

  it('sets each factor beside what the next belt asks for, with no remainder', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({
      belt,
      record: [],
      next: { rank: 'brown', criteria: { completed: 120, distinctClusters: 6, activeDays30: 15, daysAtRank: 60 } },
      milestones: [],
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Next · brown belt' })).toBeInTheDocument()
    expect(screen.getByText('Asks for 120')).toBeInTheDocument()
    expect(screen.queryByText(/\d+ more/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('stops asking for anything at black', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({ belt: { ...belt, rank: 'black' }, record: [], next: null, milestones: [] })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Your practice' })).toBeInTheDocument()
    expect(screen.queryByText(/Asks for/)).not.toBeInTheDocument()
  })

  it('marks an earned milestone with its date and leaves unearned ones at the placeholder', async () => {
    authed()
    const milestones: MilestoneDTO[] = [
      { id: 'FIRST_KATA', earnedAt: '2026-03-04T10:00:00.000Z', contextRef: 's1' },
    ]
    mockedGetBelts.mockResolvedValue({ belt, record: [], next: null, milestones })

    renderPage()

    // Earned milestone surfaces its date in the record's format.
    const earnedCard = (await screen.findByText('First Kata')).closest('li')!
    expect(within(earnedCard).getByText('Earned Mar 4, 2026')).toBeInTheDocument()

    // An unearned one shows 'Not yet', never an "Earned" date.
    const unearnedCard = screen.getByText('Polyglot').closest('li')!
    expect(within(unearnedCard).getByText('Not yet')).toBeInTheDocument()
    expect(within(unearnedCard).queryByText(/^Earned /)).not.toBeInTheDocument()
  })

  it('hides the retired SENSEI_APPROVED until someone has earned it, then marks it legacy', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({ belt, record: [], next: null, milestones: [] })
    const { unmount } = renderPage()
    await screen.findByText('First Kata')
    expect(screen.queryByText('Sensei Approved')).toBeNull()
    unmount()

    mockedGetBelts.mockResolvedValue({ belt, record: [], next: null, milestones: [{ id: 'SENSEI_APPROVED', earnedAt: '2026-03-04T10:00:00.000Z', contextRef: null }] })
    renderPage()
    expect(await screen.findByText('Earned Mar 4, 2026 · Legacy')).toBeInTheDocument()
    expect(screen.getByText('1 of 10 earned')).toBeInTheDocument()
  })

  it('shows zero earned when no milestones come back', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({ belt, record: [], next: null, milestones: [] })

    renderPage()

    expect(await screen.findByText('0 of 9 earned')).toBeInTheDocument()
    // No row should claim an earned date.
    expect(screen.queryByText(/^Earned /)).not.toBeInTheDocument()
  })

  it('tells a first-time user how to earn their first milestone', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({ belt, record: [], next: null, milestones: [] })

    renderPage()

    expect(await screen.findByText(/Complete a kata to earn your first milestone/)).toBeInTheDocument()
  })

  it('drops the first-milestone hint once something is earned', async () => {
    authed()
    mockedGetBelts.mockResolvedValue({
      belt,
      record: [],
      next: null,
      milestones: [{ id: 'FIRST_KATA', earnedAt: '2026-03-04T10:00:00.000Z', contextRef: 's1' }],
    })

    renderPage()

    await screen.findByText('First Kata')
    expect(screen.queryByText(/Complete a kata to earn your first milestone/)).not.toBeInTheDocument()
  })

  it('does not call the API for an anonymous visitor and stays on the skeleton', () => {
    mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
    mockedGetBelts.mockResolvedValue({ belt, record: [], next: null, milestones: [] })

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
    mockedGetBelts.mockResolvedValueOnce({ belt, record: [], next: null, milestones: [] })

    renderPage()

    const retry = await screen.findByRole('button', { name: 'Try again' })
    await userEvent.click(retry)

    expect(await screen.findByText('Your rank')).toBeInTheDocument()
    expect(mockedGetBelts).toHaveBeenCalledTimes(2)
  })
})
