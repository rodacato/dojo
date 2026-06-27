import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { DashboardData } from '../lib/api'
import { DashboardPage } from './DashboardPage'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: { getDashboard: vi.fn() },
}))

const mockedGetDashboard = vi.mocked(api.getDashboard)

function baseDashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    streak: 5,
    totalCompleted: 4,
    todayComplete: false,
    todaySession: null,
    activeSessionId: null,
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

    // NOTE: There is intentionally no "request rejects" test. DashboardPage
    // calls `api.getDashboard().then(setDashboard)` with no `.catch`, so a
    // rejection has no UI branch — it would only escape as an unhandled
    // rejection. The pending-promise test above already covers the distinct
    // loading state; asserting the absence of a non-existent error surface
    // would add no value and only fight the runner.
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
      expect(screen.getByText('Passed')).toBeInTheDocument()
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
