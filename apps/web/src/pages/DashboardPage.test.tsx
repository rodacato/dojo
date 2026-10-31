import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { DashboardData } from '../lib/api'
import { DashboardPage } from './DashboardPage'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: { getDashboard: vi.fn(), startDailyKata: vi.fn() },
}))

const mockedGetDashboard = vi.mocked(api.getDashboard)
const mockedStartDailyKata = vi.mocked(api.startDailyKata)

function baseDashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    streak: 5,
    totalCompleted: 4,
    todayComplete: false,
    todaySession: null,
    activeSessionId: null,
    dailyKataMinutes: null,
    heatmapData: [],
    recentSessions: [],
    weakAreas: [],
    practicePatterns: {
      avgTimeMinutes: 25,
      mostAvoidedType: null,
      sessionsTimedOut: 0,
    },
    weeklyGoal: { target: 5, completed: 2 },
    belt: {
      rank: 'green',
      factors: { completed: 12, distinctClusters: 3, activeDays30: 8, daysAtRank: 20 },
    },
    ...overrides,
  }
}

function renderDashboard(initialEntry = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/katas" element={<div>katas page</div>} />
        <Route path="/belts" element={<div>belts page</div>} />
        <Route path="/katas/:id" element={<div>resume kata page</div>} />
        <Route path="/katas/:id/result" element={<div>kata result page</div>} />
        <Route path="/history" element={<div>history page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedGetDashboard.mockReset()
  mockedStartDailyKata.mockReset()
  window.localStorage.clear()
})

describe('DashboardPage', () => {
  describe('loading state', () => {
    it('shows the page loader while the dashboard request is pending', () => {
      // Never-resolving promise keeps the component in its loading branch.
      mockedGetDashboard.mockReturnValue(new Promise(() => {}))

      renderDashboard()

      expect(screen.getByText('loading')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /green belt/i })).not.toBeInTheDocument()
    })

    it('shows an error with a retry instead of loading forever when the request rejects', async () => {
      mockedGetDashboard.mockRejectedValueOnce(new Error('boom'))
      mockedGetDashboard.mockResolvedValueOnce(baseDashboard())
      const user = userEvent.setup()
      renderDashboard()

      expect(await screen.findByText("We couldn't load your dashboard.")).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /try again/i }))

      expect(await screen.findByRole('heading', { name: 'green belt' })).toBeInTheDocument()
    })
  })

  describe('loaded content', () => {
    it('renders streak, belt and practice patterns once data resolves', async () => {
      mockedGetDashboard.mockResolvedValue(baseDashboard({ streak: 7 }))

      renderDashboard()

      expect(await screen.findByText('Current streak')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('2/5 this week')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'green belt' })).toBeInTheDocument()
      // totalCompleted (4) >= 3 → practice patterns card present, avg formatted.
      expect(screen.getByText('Practice patterns')).toBeInTheDocument()
      expect(screen.getByText('25m')).toBeInTheDocument()
    })

    it('puts practice before rank', async () => {
      mockedGetDashboard.mockResolvedValue(baseDashboard())

      renderDashboard()

      const streak = await screen.findByRole('heading', { name: 'Current streak' })
      const belt = screen.getByRole('heading', { name: 'green belt' })
      expect(streak.compareDocumentPosition(belt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('spells out which days of this week have a kata', async () => {
      const iso = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      mockedGetDashboard.mockResolvedValue(baseDashboard({ heatmapData: [{ date: iso(new Date()), count: 1 }] }))

      renderDashboard()

      await screen.findByText('Mon', { exact: false })
      expect(screen.getByText(': kata done')).toBeInTheDocument()
      expect(screen.getAllByText(': no kata')).toHaveLength(6)
    })

    it('hides practice patterns and weak areas while under the 3-kata threshold', async () => {
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({
          totalCompleted: 2,
          weakAreas: [{ topic: 'recursion', frequency: 4 }],
        }),
      )

      renderDashboard()

      expect(await screen.findByText('Current streak')).toBeInTheDocument()
      expect(screen.queryByText('Practice patterns')).not.toBeInTheDocument()
      expect(screen.queryByText('Weak areas')).not.toBeInTheDocument()
      expect(screen.queryByText('recursion')).not.toBeInTheDocument()
    })

    it('renders weak areas once at or above the threshold', async () => {
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({
          totalCompleted: 6,
          weakAreas: [{ topic: 'recursion', frequency: 4 }],
        }),
      )

      renderDashboard()

      expect(await screen.findByText('Weak areas')).toBeInTheDocument()
      expect(screen.getByText('recursion')).toBeInTheDocument()
      expect(screen.getByText('(4)')).toBeInTheDocument()
    })

    it('renders recent activity rows when there are sessions', async () => {
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({
          recentSessions: [
            {
              id: 's1',
              kataTitle: 'Reverse a linked list',
              kataType: 'algorithms',
              difficulty: 'medium',
              verdict: 'passed',
              startedAt: new Date(Date.now() - 3_600_000).toISOString(),
            },
          ],
        }),
      )

      renderDashboard()

      expect(await screen.findByText('Recent kata')).toBeInTheDocument()
      expect(screen.getByText('Reverse a linked list')).toBeInTheDocument()
      expect(screen.getByText('PASSED')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /reverse a linked list/i })).toHaveAttribute('href', '/katas/s1/result')
      expect(screen.getByRole('link', { name: /full history/i })).toHaveAttribute('href', '/history')
    })

    it('keeps the date, type and difficulty on a row with no verdict', async () => {
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({
          recentSessions: [
            {
              id: 's2',
              kataTitle: 'Timed out kata',
              kataType: 'chat',
              difficulty: 'hard',
              verdict: null,
              startedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
            },
          ],
        }),
      )

      renderDashboard()

      const row = await screen.findByRole('link', { name: /timed out kata/i })
      expect(row).toHaveTextContent('chat')
      expect(row).toHaveTextContent('hard')
      expect(row).toHaveTextContent('2h')
    })

    it('omits the recent activity section when there are no sessions', async () => {
      mockedGetDashboard.mockResolvedValue(baseDashboard({ recentSessions: [] }))

      renderDashboard()

      expect(await screen.findByText('Current streak')).toBeInTheDocument()
      expect(screen.queryByText('Recent kata')).not.toBeInTheDocument()
    })
  })

  describe('today card states', () => {
    it('offers "Enter the dojo" and navigates to /katas on click', async () => {
      const user = userEvent.setup()
      mockedGetDashboard.mockResolvedValue(baseDashboard())

      renderDashboard()

      const cta = await screen.findByRole('button', { name: /enter the dojo/i })
      await user.click(cta)

      expect(screen.getByText('katas page')).toBeInTheDocument()
    })

    it('explains the blind kata beside the start action, not the streak warning', async () => {
      mockedGetDashboard.mockResolvedValue(baseDashboard({ dailyKataMinutes: 5 }))

      renderDashboard()

      expect(await screen.findByText('One kata, about five minutes. You see the topic when it opens.')).toBeInTheDocument()
    })

    it('keeps the streak line in non-daily mode', async () => {
      mockedGetDashboard.mockResolvedValue(baseDashboard())

      renderDashboard()

      expect(await screen.findByText(/Your streak resets at midnight/)).toBeInTheDocument()
    })

    it('resumes an active session, routing to /katas/:id', async () => {
      const user = userEvent.setup()
      mockedGetDashboard.mockResolvedValue(baseDashboard({ activeSessionId: 'sess-42' }))

      renderDashboard()

      const cta = await screen.findByRole('button', { name: /resume kata/i })
      await user.click(cta)

      expect(screen.getByText('resume kata page')).toBeInTheDocument()
    })

    it('shows the done-today state and links to results', async () => {
      const user = userEvent.setup()
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({
          todayComplete: true,
          todaySession: { id: 'done-1', kataTitle: 'Binary search', verdict: 'passed' },
        }),
      )

      renderDashboard()

      expect(await screen.findByRole('heading', { name: 'Binary search' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /view results/i }))

      expect(screen.getByText('kata result page')).toBeInTheDocument()
    })

    it('reads the verdict on the page when today is done', async () => {
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({
          todayComplete: true,
          todaySession: { id: 'done-1', kataTitle: 'Binary search', verdict: 'needs_work' },
        }),
      )

      renderDashboard()

      expect(await screen.findByText('NEEDS WORK')).toBeInTheDocument()
    })
  })

  describe('daily kata', () => {
    it('shows the daily kata blind, with only its length, and opens it straight away', async () => {
      const user = userEvent.setup()
      mockedGetDashboard.mockResolvedValue(baseDashboard({ dailyKataMinutes: 5 }))
      mockedStartDailyKata.mockResolvedValue({ sessionId: 'sess-daily' })

      renderDashboard()

      expect(await screen.findByText('Today · ~5 min')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: "Today's kata is waiting." })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /enter the dojo/i }))

      expect(mockedStartDailyKata).toHaveBeenCalledOnce()
      expect(screen.getByText('resume kata page')).toBeInTheDocument()
    })

    it('offers one more kata once today is done', async () => {
      const user = userEvent.setup()
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({
          dailyKataMinutes: 5,
          todayComplete: true,
          todaySession: { id: 'done-1', kataTitle: 'Off-by-one in pagination', verdict: 'passed' },
        }),
      )
      mockedStartDailyKata.mockResolvedValue({ sessionId: 'sess-more' })

      renderDashboard()

      await user.click(await screen.findByRole('button', { name: 'One more kata' }))

      expect(mockedStartDailyKata).toHaveBeenCalledOnce()
      expect(screen.getByText('resume kata page')).toBeInTheDocument()
    })

    it('says so and stays put when the kata cannot start', async () => {
      const user = userEvent.setup()
      mockedGetDashboard.mockResolvedValue(baseDashboard({ dailyKataMinutes: 5 }))
      mockedStartDailyKata.mockRejectedValue(new Error('boom'))

      renderDashboard()

      await user.click(await screen.findByRole('button', { name: /enter the dojo/i }))

      expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't start that kata. Try again.")
      expect(screen.queryByText('resume kata page')).not.toBeInTheDocument()
    })

    it('has no one more without micro kata, and Enter still goes to the picker', async () => {
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({ todayComplete: true, todaySession: { id: 'done-1', kataTitle: 'Binary search', verdict: null } }),
      )

      renderDashboard()

      await screen.findByRole('heading', { name: 'Binary search' })
      expect(screen.queryByRole('button', { name: 'One more kata' })).not.toBeInTheDocument()
    })
  })

  describe('offline', () => {
    function goOffline() {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    }

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('holds a new daily kata until the network returns', async () => {
      goOffline()
      mockedGetDashboard.mockResolvedValue(baseDashboard({ dailyKataMinutes: 5 }))

      renderDashboard()

      expect(await screen.findByRole('button', { name: /enter the dojo/i })).toBeDisabled()

      act(() => {
        vi.restoreAllMocks()
        globalThis.dispatchEvent(new Event('online'))
      })

      expect(screen.getByRole('button', { name: /enter the dojo/i })).toBeEnabled()
    })

    it('holds one more kata but still opens the result', async () => {
      goOffline()
      mockedGetDashboard.mockResolvedValue(
        baseDashboard({
          dailyKataMinutes: 5,
          todayComplete: true,
          todaySession: { id: 'done-1', kataTitle: 'Binary search', verdict: 'passed' },
        }),
      )

      renderDashboard()

      expect(await screen.findByRole('button', { name: 'One more kata' })).toBeDisabled()
      expect(screen.getByRole('button', { name: /view results/i })).toBeEnabled()
    })

    it('still resumes a kata that already started', async () => {
      goOffline()
      mockedGetDashboard.mockResolvedValue(baseDashboard({ dailyKataMinutes: 5, activeSessionId: 'sess-42' }))

      renderDashboard()

      expect(await screen.findByRole('button', { name: /resume kata/i })).toBeEnabled()
    })

    it('keeps the non-daily picker reachable, since it starts nothing', async () => {
      goOffline()
      mockedGetDashboard.mockResolvedValue(baseDashboard())

      renderDashboard()

      expect(await screen.findByRole('button', { name: /enter the dojo/i })).toBeEnabled()
    })
  })

  describe('belt navigation', () => {
    it('links to /belts from the belt strip', async () => {
      const user = userEvent.setup()
      mockedGetDashboard.mockResolvedValue(baseDashboard())

      renderDashboard()

      const link = await screen.findByRole('link', { name: /view/i })
      await user.click(link)

      expect(screen.getByText('belts page')).toBeInTheDocument()
    })
  })

  describe('first-visit onboarding', () => {
    const freshUser = () =>
      baseDashboard({ streak: 0, totalCompleted: 0, recentSessions: [], weakAreas: [] })

    it('shows the onboarding overlay for a brand-new user', async () => {
      mockedGetDashboard.mockResolvedValue(freshUser())

      renderDashboard()

      expect(
        await screen.findByRole('heading', { name: 'Welcome to the dojo.' }),
      ).toBeInTheDocument()
    })

    it('does not show the overlay for a returning user with a streak', async () => {
      mockedGetDashboard.mockResolvedValue(baseDashboard({ streak: 5 }))

      renderDashboard()

      expect(await screen.findByText('Current streak')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Welcome to the dojo.' }),
      ).not.toBeInTheDocument()
    })

    it('suppresses the overlay once it has been dismissed before (localStorage)', async () => {
      window.localStorage.setItem('dojo-onboarding-seen', 'true')
      mockedGetDashboard.mockResolvedValue(freshUser())

      renderDashboard()

      expect(await screen.findByText('Current streak')).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Welcome to the dojo.' }),
      ).not.toBeInTheDocument()
    })
  })
})
