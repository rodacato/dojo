import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { PublicProfileData } from '../lib/api'
import { api, ApiError } from '../lib/api'
import { PublicProfilePage } from './PublicProfilePage'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    api: { ...actual.api, getPublicProfile: vi.fn() },
  }
})

const getPublicProfile = vi.mocked(api.getPublicProfile)

function makeProfile(overrides: Partial<PublicProfileData> = {}): PublicProfileData {
  return {
    username: 'kenobi',
    avatarUrl: 'https://example.test/avatar.png',
    memberSince: '2026-01-15T00:00:00.000Z',
    stats: {
      totalKata: 42,
      passRate: 91,
      avgTimeMinutes: 12.5,
      languages: ['ts', 'sql'],
    },
    streak: 7,
    heatmapData: [{ date: '2026-06-20', count: 3 }],
    recentSessions: [
      {
        id: 'sess-1',
        kataTitle: 'Reverse a linked list',
        kataType: 'algorithm',
        difficulty: 'medium',
        verdict: 'passed',
        startedAt: '2026-06-19T10:00:00.000Z',
        completedAt: '2026-06-19T10:08:00.000Z',
        status: 'completed',
      },
    ],
    badges: [{ slug: 'FIRST_KATA', earnedAt: '2026-02-01T00:00:00.000Z' }],
    belt: {
      rank: 'green',
      factors: { completed: 42, distinctClusters: 4, activeDays30: 12, daysAtRank: 30 },
    },
    ...overrides,
  }
}

function renderProfile(username = 'kenobi') {
  return render(
    <MemoryRouter initialEntries={[`/u/${username}`]}>
      <Routes>
        <Route path="/u/:username" element={<PublicProfilePage />} />
        <Route path="/" element={<div>landing page</div>} />
        <Route path="/share/:id" element={<div>share page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublicProfilePage', () => {
  beforeEach(() => {
    getPublicProfile.mockReset()
  })

  it('shows a loading indicator while the profile request is pending', () => {
    getPublicProfile.mockReturnValue(new Promise<PublicProfileData>(() => {}))

    renderProfile()

    expect(screen.getByText(/Loading profile/i)).toBeInTheDocument()
    // No profile content nor error UI while pending.
    expect(screen.queryByRole('heading', { name: 'kenobi' })).not.toBeInTheDocument()
    expect(screen.queryByText("We couldn't load this profile.")).not.toBeInTheDocument()
  })

  it('reads the username from the route and passes it to the api call', async () => {
    getPublicProfile.mockResolvedValue(makeProfile({ username: 'ahsoka' }))

    renderProfile('ahsoka')

    await screen.findByRole('heading', { name: 'ahsoka' })
    expect(getPublicProfile).toHaveBeenCalledWith('ahsoka')
  })

  it('renders the header, stats, streak, badges and recent kata once loaded', async () => {
    getPublicProfile.mockResolvedValue(makeProfile())

    renderProfile()

    expect(await screen.findByRole('heading', { name: 'kenobi' })).toBeInTheDocument()
    expect(screen.getByText('@kenobi')).toBeInTheDocument()
    expect(screen.getByText(/Member since January 2026 · green belt/)).toBeInTheDocument()

    // Stats grid: distinct values per cell.
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('91%')).toBeInTheDocument()
    expect(screen.getByText('12:30')).toBeInTheDocument() // avgTimeMinutes 12.5 -> mm:ss

    // Streak badge derived from streak > 0.
    expect(screen.getByText('7 day streak')).toBeInTheDocument()

    // Badge slug mapped to its friendly name.
    expect(screen.getByText('First Kata')).toBeInTheDocument()

    // Recent kata row renders the session title.
    expect(screen.getByText('Reverse a linked list')).toBeInTheDocument()

    // The loading affordance is gone.
    expect(screen.queryByText(/Loading profile/i)).not.toBeInTheDocument()
  })

  it('omits the streak badge, badges section and recent kata when empty', async () => {
    getPublicProfile.mockResolvedValue(
      makeProfile({ streak: 0, badges: [], recentSessions: [] }),
    )

    renderProfile()

    await screen.findByRole('heading', { name: 'kenobi' })
    expect(screen.queryByText(/day streak/)).not.toBeInTheDocument()
    expect(screen.queryByText('First Kata')).not.toBeInTheDocument()
    expect(screen.queryByText('Reverse a linked list')).not.toBeInTheDocument()
    // Header still renders so this is a populated-but-quiet profile, not an error.
    expect(screen.getByText('@kenobi')).toBeInTheDocument()
  })

  it('navigates to the share page when a recent kata row is clicked', async () => {
    const user = userEvent.setup()
    getPublicProfile.mockResolvedValue(makeProfile())

    renderProfile()

    const row = await screen.findByRole('button', { name: /Reverse a linked list/ })
    await user.click(row)

    expect(await screen.findByText('share page')).toBeInTheDocument()
  })

  it('renders the not-found error for a 404 response', async () => {
    getPublicProfile.mockRejectedValue(new ApiError(404, 'not_found'))

    renderProfile()

    expect(
      await screen.findByRole('heading', { name: 'Practitioner not found.' }),
    ).toBeInTheDocument()
    // Distinct from the generic network failure copy.
    expect(screen.queryByText("We couldn't load this profile.")).not.toBeInTheDocument()
  })

  it('renders the generic internal error with a retry that refetches', async () => {
    const user = userEvent.setup()
    getPublicProfile
      .mockRejectedValueOnce(new ApiError(500, 'boom'))
      .mockResolvedValueOnce(makeProfile())

    renderProfile()

    expect(await screen.findByText("We couldn't load this profile.")).toBeInTheDocument()
    // Not the 404 branch.
    expect(
      screen.queryByRole('heading', { name: 'Practitioner not found.' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    // Retry refetches and the resolved profile replaces the error UI.
    expect(await screen.findByRole('heading', { name: 'kenobi' })).toBeInTheDocument()
    expect(getPublicProfile).toHaveBeenCalledTimes(2)
    await waitFor(() =>
      expect(screen.queryByText("We couldn't load this profile.")).not.toBeInTheDocument(),
    )
  })

  it('treats a non-ApiError rejection as a network failure, not not-found', async () => {
    getPublicProfile.mockRejectedValue(new Error('connection reset'))

    renderProfile()

    expect(await screen.findByText("We couldn't load this profile.")).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Practitioner not found.' }),
    ).not.toBeInTheDocument()
  })

  it('formats avg time as an em dash when there is no recorded time', async () => {
    getPublicProfile.mockResolvedValue(
      makeProfile({
        stats: { totalKata: 0, passRate: 0, avgTimeMinutes: 0, languages: [] },
      }),
    )

    renderProfile()

    await screen.findByRole('heading', { name: 'kenobi' })
    const avgCell = screen.getByText('Avg time').closest('div')
    expect(avgCell).not.toBeNull()
    expect(within(avgCell as HTMLElement).getByText('—')).toBeInTheDocument()
  })
})
