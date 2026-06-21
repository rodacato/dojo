import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { BeltDTO, UserDTO } from '@dojo/shared'
import { SettingsPage } from './SettingsPage'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

vi.mock('../lib/api', () => ({
  api: {
    getPreferences: vi.fn(),
    getBelts: vi.fn(),
    updatePreferences: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedGetPreferences = vi.mocked(api.getPreferences)
const mockedGetBelts = vi.mocked(api.getBelts)
const mockedUpdatePreferences = vi.mocked(api.updatePreferences)
const mockedUseAuth = vi.mocked(useAuth)

type Prefs = Awaited<ReturnType<typeof api.getPreferences>>

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-15T00:00:00.000Z',
}

const belt: BeltDTO = {
  rank: 'green',
  factors: { completed: 12, distinctClusters: 3, activeDays30: 8, daysAtRank: 20 },
}

function basePrefs(overrides: Partial<Prefs> = {}): Prefs {
  return {
    reminderEnabled: false,
    reminderHour: 9,
    email: null,
    level: 'mid',
    interests: ['backend'],
    randomness: 0.5,
    goalWeeklyTarget: 3,
    ...overrides,
  }
}

const logout = vi.fn().mockResolvedValue(undefined)

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/u/:username" element={<div>public profile of sensei</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedGetPreferences.mockReset()
  mockedGetBelts.mockReset()
  mockedUpdatePreferences.mockReset()
  logout.mockClear()
  // Belt resolves by default; individual tests override when they care.
  mockedGetBelts.mockResolvedValue({ belt, milestones: [] })
  mockedUpdatePreferences.mockResolvedValue({ ok: true })
  mockedUseAuth.mockReturnValue({ user, loading: false, logout })
})

describe('SettingsPage', () => {
  describe('loading state', () => {
    it('shows the page loader while preferences are pending', () => {
      mockedGetPreferences.mockReturnValue(new Promise(() => {}))

      renderSettings()

      expect(screen.getByText('loading')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument()
    })

    it('stays in the loader (no crash) when the auth user is absent', () => {
      mockedUseAuth.mockReturnValue({ user: null, loading: false, logout })
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      expect(screen.getByText('loading')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument()
    })
  })

  describe('loaded content', () => {
    it('renders the account identity and section scaffolding once prefs resolve', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
      // Username appears in the account card.
      expect(screen.getAllByText('sensei').length).toBeGreaterThan(0)
      expect(screen.getByText('@sensei')).toBeInTheDocument()
      // createdAt 2026-01-15 → "January 2026" via toLocaleDateString.
      expect(screen.getByText(/Member since January 2026/)).toBeInTheDocument()
      // The four sections render.
      expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Theme' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Reminders' })).toBeInTheDocument()
    })

    it('marks the saved level and interest as active and others inactive', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs({ level: 'senior', interests: ['security'] }))

      renderSettings()

      const senior = await screen.findByRole('button', { name: 'Senior' })
      expect(senior).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: 'Junior' })).toHaveAttribute('aria-pressed', 'false')
      // Interest button shows the ✓ marker only when active.
      expect(screen.getByRole('button', { name: '✓ security' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: 'backend' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('renders the belt ring avatar and rank suffix once belts resolve', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      expect(await screen.findByLabelText('green belt')).toBeInTheDocument()
      expect(screen.getByText(/· green belt/)).toBeInTheDocument()
    })

    it('falls back to a plain avatar and stays usable when belts fail', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs())
      mockedGetBelts.mockRejectedValue(new Error('belt 500'))

      renderSettings()

      expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
      // No belt ring (aria-label) and no rank suffix, but the page rendered.
      await waitFor(() => {
        expect(screen.queryByLabelText('green belt')).not.toBeInTheDocument()
      })
      expect(screen.queryByText(/· green belt/)).not.toBeInTheDocument()
    })

    it('hides reminder fields until the daily reminder toggle is on', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs({ reminderEnabled: false }))

      renderSettings()

      await screen.findByRole('heading', { name: 'Settings' })
      expect(screen.queryByPlaceholderText('you@example.com')).not.toBeInTheDocument()
    })

    it('shows reminder fields when the reminder is already enabled', async () => {
      mockedGetPreferences.mockResolvedValue(
        basePrefs({ reminderEnabled: true, email: 'you@test.dev', reminderHour: 7 }),
      )

      renderSettings()

      const email = await screen.findByPlaceholderText('you@example.com')
      expect(email).toHaveValue('you@test.dev')
    })
  })

  describe('preferences error', () => {
    it('keeps the loader and does not crash when getPreferences rejects', async () => {
      mockedGetPreferences.mockRejectedValue(new Error('prefs 500'))

      renderSettings()

      // prefs stays null → component remains in its loader branch.
      await waitFor(() => {
        expect(mockedGetPreferences).toHaveBeenCalled()
      })
      expect(screen.getByText('loading')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument()
    })
  })

  describe('auto-save interactions', () => {
    it('persists a level change and surfaces the Saved indicator', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ level: 'mid' }))

      renderSettings()

      await u.click(await screen.findByRole('button', { name: 'Senior' }))

      // The exact payload the API receives, derived from current prefs + patch.
      expect(mockedUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'senior', interests: ['backend'], goalWeeklyTarget: 3 }),
      )
      // Optimistic UI: the new pill is active immediately.
      expect(screen.getByRole('button', { name: 'Senior' })).toHaveAttribute('aria-pressed', 'true')
      // Save lifecycle resolves to "Saved".
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('toggles an interest off and persists the pruned array', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ interests: ['backend', 'security'] }))

      renderSettings()

      await u.click(await screen.findByRole('button', { name: '✓ backend' }))

      expect(mockedUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ interests: ['security'] }),
      )
    })

    it('surfaces the Error indicator when the save request rejects', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ goalWeeklyTarget: 3 }))
      mockedUpdatePreferences.mockRejectedValue(new Error('save 500'))

      renderSettings()

      await u.click(await screen.findByRole('button', { name: '5' }))

      expect(mockedUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ goalWeeklyTarget: 5 }),
      )
      expect(await screen.findByText('Error')).toBeInTheDocument()
    })
  })

  describe('sign out', () => {
    it('confirms before logging out and only calls logout on confirm', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      await u.click(await screen.findByRole('button', { name: 'Sign out' }))

      // Modal opened — confirm copy is present.
      expect(await screen.findByRole('heading', { name: 'See you tomorrow.' })).toBeInTheDocument()
      expect(logout).not.toHaveBeenCalled()

      // Two "Sign out" buttons now exist: the account trigger and the modal's
      // primary action (last in DOM order). Confirm via the modal one.
      const signOutButtons = screen.getAllByRole('button', { name: 'Sign out' })
      expect(signOutButtons).toHaveLength(2)
      const confirmSignOut = signOutButtons[1]
      if (!confirmSignOut) throw new Error('expected a modal Sign out button')
      await u.click(confirmSignOut)

      expect(logout).toHaveBeenCalledTimes(1)
    })

    it('does not call logout when the confirmation is dismissed', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      await u.click(await screen.findByRole('button', { name: 'Sign out' }))
      await u.click(await screen.findByRole('button', { name: 'Stay' }))

      expect(logout).not.toHaveBeenCalled()
      expect(screen.queryByRole('heading', { name: 'See you tomorrow.' })).not.toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('links to the public profile by username', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      const link = await screen.findByRole('link', { name: /View public profile/ })
      expect(link).toHaveAttribute('href', '/u/sensei')

      await u.click(link)
      expect(screen.getByText('public profile of sensei')).toBeInTheDocument()
    })
  })
})
