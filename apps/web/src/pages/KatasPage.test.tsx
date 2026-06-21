import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { KataDTO } from '@dojo/shared'

import { KatasPage } from './KatasPage'
import { api, type DashboardData } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: {
    getDashboard: vi.fn(),
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
    getKatas: vi.fn(),
    startSession: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

const dashboard: DashboardData = {
  streak: 7,
  totalCompleted: 12,
  todayComplete: false,
  todaySession: null,
  activeSessionId: null,
  heatmapData: [{ date: '2026-06-20', count: 2 }],
  recentSessions: [],
  weakAreas: [],
  practicePatterns: { avgTimeMinutes: 15, mostAvoidedType: null, sessionsTimedOut: 0 },
  weeklyGoal: { target: 3, completed: 1 },
  belt: { rank: 'white', factors: {} as never },
}

const prefs = {
  reminderEnabled: true,
  reminderHour: 9,
  email: 'a@b.test',
  level: 'senior',
  interests: ['backend'],
  randomness: 0.3,
  goalWeeklyTarget: 3,
}

function makeKata(over: Partial<KataDTO> & { id: string; title: string }): KataDTO {
  return {
    description: 'A focused exercise.',
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    language: ['ts'],
    tags: ['api'],
    ...over,
  }
}

const katas: KataDTO[] = [
  makeKata({ id: 'k1', title: 'Rate limiter' }),
  makeKata({ id: 'k2', title: 'Idempotency keys' }),
  makeKata({ id: 'k3', title: 'Backpressure' }),
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/katas']}>
      <Routes>
        <Route path="/katas" element={<KatasPage />} />
        <Route path="/katas/:id" element={<div>session screen</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // jsdom doesn't implement scrollIntoView; the page calls it via rAF after picks load.
  Element.prototype.scrollIntoView = vi.fn()
  mockedApi.getDashboard.mockResolvedValue(dashboard)
  mockedApi.getPreferences.mockResolvedValue(prefs)
  mockedApi.updatePreferences.mockResolvedValue({ ok: true })
  mockedApi.getKatas.mockResolvedValue(katas)
  mockedApi.startSession.mockResolvedValue({ sessionId: 'sess-99' })
})

describe('KatasPage', () => {
  it('shows the activity-strip and preferences loading placeholders before data resolves', () => {
    // Pending promises keep the page in its loading state.
    mockedApi.getDashboard.mockReturnValue(new Promise(() => {}))
    mockedApi.getPreferences.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: /Ready for your kata/ })).toBeInTheDocument()
    expect(screen.getByText('Loading streak...')).toBeInTheDocument()
    expect(screen.getByText('Loading preferences...')).toBeInTheDocument()
    // No streak number and no resolved-prefs controls while loading.
    expect(screen.queryByText('day streak')).not.toBeInTheDocument()
    expect(screen.queryByText('Skill level')).not.toBeInTheDocument()
  })

  it('renders the streak and 30-day activity once the dashboard resolves', async () => {
    renderPage()

    const strip = await screen.findByText('30-day activity')
    const section = strip.closest('section') as HTMLElement
    expect(within(section).getByText('7')).toBeInTheDocument()
    expect(within(section).getByText('day streak')).toBeInTheDocument()
    expect(screen.queryByText('Loading streak...')).not.toBeInTheDocument()
  })

  it('renders the preferences controls reflecting the loaded prefs', async () => {
    renderPage()

    expect(await screen.findByText('Skill level')).toBeInTheDocument()
    // level: 'senior' from prefs is selected.
    expect(screen.getByRole('button', { name: 'Senior' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Mid' })).toHaveAttribute('aria-pressed', 'false')
    // interest 'backend' from prefs is selected.
    expect(screen.getByRole('button', { name: /backend/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps "Show kata" disabled until both mood and duration are picked', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Skill level')

    const showBtn = screen.getByRole('button', { name: /Show kata/ })
    expect(showBtn).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /In flow/ }))
    expect(showBtn).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '20m' }))
    expect(showBtn).toBeEnabled()
  })

  it('requests katas with the selected mood + duration and renders the three picks', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Skill level')

    await user.click(screen.getByRole('button', { name: /Foggy/ }))
    await user.click(screen.getByRole('button', { name: '30m' }))
    await user.click(screen.getByRole('button', { name: /Show kata/ }))

    await waitFor(() =>
      expect(mockedApi.getKatas).toHaveBeenCalledWith({ mood: 'low_energy', maxDuration: 30 }),
    )

    expect(await screen.findByRole('heading', { name: /Three kata\. One choice/ })).toBeInTheDocument()
    expect(screen.getByText('Rate limiter')).toBeInTheDocument()
    expect(screen.getByText('Idempotency keys')).toBeInTheDocument()
    expect(screen.getByText('Backpressure')).toBeInTheDocument()
    // Filter summary reflects the chosen mood + duration.
    expect(screen.getByText('Today · Foggy · 30 min')).toBeInTheDocument()
  })

  it('starts a session and navigates to the session route when a kata is selected', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Skill level')

    await user.click(screen.getByRole('button', { name: /In flow/ }))
    await user.click(screen.getByRole('button', { name: '10m' }))
    await user.click(screen.getByRole('button', { name: /Show kata/ }))

    await screen.findByText('Idempotency keys')
    await user.click(screen.getByText('Idempotency keys'))

    await waitFor(() => expect(mockedApi.startSession).toHaveBeenCalledWith('k2'))
    expect(await screen.findByText('session screen')).toBeInTheDocument()
  })

  it('shows the empty state when no kata matches and resets back to the picker', async () => {
    mockedApi.getKatas.mockResolvedValue([])
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Skill level')

    await user.click(screen.getByRole('button', { name: /Ok/ }))
    await user.click(screen.getByRole('button', { name: '45m+' }))
    await user.click(screen.getByRole('button', { name: /Show kata/ }))

    expect(
      await screen.findByRole('heading', { name: 'No kata matched these filters.' }),
    ).toBeInTheDocument()
    expect(mockedApi.startSession).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(
      screen.queryByRole('heading', { name: 'No kata matched these filters.' }),
    ).not.toBeInTheDocument()
  })

  it('Surprise me fetches katas then starts a random pick and navigates', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Skill level')

    await user.click(screen.getByRole('button', { name: 'Surprise me' }))

    await waitFor(() => expect(mockedApi.getKatas).toHaveBeenCalled())
    await waitFor(() => expect(mockedApi.startSession).toHaveBeenCalledTimes(1))
    // The started kata id is one of the returned picks.
    expect(['k1', 'k2', 'k3']).toContain(mockedApi.startSession.mock.calls[0]![0])
    expect(await screen.findByText('session screen')).toBeInTheDocument()
  })

  it('persists a preference change via updatePreferences when toggling an interest', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Skill level')

    // 'backend' starts selected; toggling it off should drop it from the saved set.
    await user.click(screen.getByRole('button', { name: /backend/ }))

    await waitFor(() => expect(mockedApi.updatePreferences).toHaveBeenCalled())
    const saved = mockedApi.updatePreferences.mock.calls.at(-1)![0]
    expect(saved.interests).not.toContain('backend')
  })
})
