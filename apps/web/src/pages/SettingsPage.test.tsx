import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

function section(name: 'Practice' | 'Reminders') {
  return within(screen.getByRole('region', { name }))
}

function goOffline() {
  return vi.spyOn(globalThis.navigator, 'onLine', 'get').mockReturnValue(false)
}

afterEach(() => {
  vi.restoreAllMocks()
})

beforeEach(() => {
  mockedGetPreferences.mockReset()
  mockedGetBelts.mockReset()
  mockedUpdatePreferences.mockReset()
  logout.mockClear()
  // Belt resolves by default; individual tests override when they care.
  mockedGetBelts.mockResolvedValue({ belt, record: [], next: null, milestones: [] })
  mockedUpdatePreferences.mockResolvedValue({ ok: true })
  mockedUseAuth.mockReturnValue({ user, loading: false, logout })
})

describe('SettingsPage', () => {
  describe('loading state', () => {
    it('shows the loading state, not guessed defaults, while preferences are pending', () => {
      mockedGetPreferences.mockReturnValue(new Promise(() => {}))

      renderSettings()

      expect(screen.getByRole('status')).toHaveTextContent('Loading your settings')
      expect(screen.queryByRole('heading', { name: 'Practice' })).not.toBeInTheDocument()
    })

    it('stays in the loading state (no crash) when the auth user is absent', () => {
      mockedUseAuth.mockReturnValue({ user: null, loading: false, logout })
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      expect(screen.getByRole('status')).toHaveTextContent('Loading your settings')
      expect(screen.queryByRole('heading', { name: 'Practice' })).not.toBeInTheDocument()
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
      expect(screen.getByRole('button', { name: 'security' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: 'backend' })).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByText('1 topic selected')).toBeInTheDocument()
    })

    it('renders the belt ring avatar and rank suffix once belts resolve', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      expect(await screen.findByLabelText('green belt')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /green belt/ })).toHaveAttribute('href', '/belts')
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
      expect(screen.queryByRole('link', { name: /green belt/ })).not.toBeInTheDocument()
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

  describe('reminder fields', () => {
    async function renderReminders() {
      mockedGetPreferences.mockResolvedValue(
        basePrefs({ reminderEnabled: true, email: 'you@test.dev', reminderHour: 7 }),
      )
      renderSettings()
      return {
        email: await screen.findByLabelText('Email'),
        hour: screen.getByLabelText('Hour (0–23 UTC)'),
      }
    }

    it('saves an email once, when the learner leaves the field', async () => {
      const u = userEvent.setup()
      const { email } = await renderReminders()

      await u.clear(email)
      await u.type(email, 'new@test.dev')
      expect(mockedUpdatePreferences).not.toHaveBeenCalled()

      await u.tab()

      expect(mockedUpdatePreferences).toHaveBeenCalledTimes(1)
      expect(mockedUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@test.dev' }),
      )
    })

    it('flags a partial email instead of saving it', async () => {
      const u = userEvent.setup()
      const { email } = await renderReminders()

      await u.clear(email)
      await u.type(email, 'new@')
      await u.tab()

      expect(screen.getByText('Enter a complete email, like you@example.com.')).toBeInTheDocument()
      expect(mockedUpdatePreferences).not.toHaveBeenCalled()
    })

    it('clears the email when the field is emptied', async () => {
      const u = userEvent.setup()
      const { email } = await renderReminders()

      await u.clear(email)
      await u.tab()

      expect(mockedUpdatePreferences).toHaveBeenCalledWith(expect.objectContaining({ email: null }))
    })

    it('never turns an emptied hour into midnight', async () => {
      const u = userEvent.setup()
      const { hour } = await renderReminders()

      await u.clear(hour)
      await u.tab()

      expect(screen.getByText('Choose a whole hour from 0 to 23 UTC.')).toBeInTheDocument()
      expect(mockedUpdatePreferences).not.toHaveBeenCalled()
    })

    it('flags an address the API would reject', async () => {
      const u = userEvent.setup()
      const { email } = await renderReminders()

      await u.clear(email)
      await u.type(email, 'new@host')
      await u.tab()

      expect(screen.getByText('Enter a complete email, like you@example.com.')).toBeInTheDocument()
      expect(mockedUpdatePreferences).not.toHaveBeenCalled()
    })

    it('says invalid details are not saved, and undo brings the saved ones back', async () => {
      const u = userEvent.setup()
      const { email } = await renderReminders()

      await u.clear(email)
      await u.type(email, 'new@')
      await u.tab()

      expect(screen.getByText('These details are not saved yet.')).toBeInTheDocument()
      expect(screen.getByText('Check reminder details')).toBeInTheDocument()

      await u.click(section('Reminders').getByRole('button', { name: 'Undo changes' }))

      expect(screen.getByLabelText('Email')).toHaveValue('you@test.dev')
      expect(screen.queryByText('These details are not saved yet.')).not.toBeInTheDocument()
    })

    it('turns reminders off without sending an invalid draft', async () => {
      const u = userEvent.setup()
      const { email } = await renderReminders()

      await u.clear(email)
      await u.type(email, 'new@')
      await u.tab()
      await u.click(screen.getByRole('switch', { name: 'Daily reminder' }))

      expect(mockedUpdatePreferences).toHaveBeenCalledWith({
        reminderEnabled: false,
        reminderHour: 7,
        email: 'you@test.dev',
      })
      expect(screen.queryByText('Check reminder details')).not.toBeInTheDocument()
    })

    it('keeps the weekend promise and says the days are UTC', async () => {
      await renderReminders()

      expect(screen.getByText(/Never on a UTC weekend if your goal is under 5 kata a week/)).toBeInTheDocument()
    })

    it('asks for an email while reminders are on without one, and still saves', async () => {
      const u = userEvent.setup()
      const { email } = await renderReminders()

      await u.clear(email)
      await u.tab()

      expect(screen.getByText('Add an email to receive reminders.')).toBeInTheDocument()
      expect(mockedUpdatePreferences).toHaveBeenCalledTimes(1)
    })

    it('rejects an hour outside the day', async () => {
      const u = userEvent.setup()
      const { hour } = await renderReminders()

      await u.clear(hour)
      await u.type(hour, '24')
      await u.tab()

      expect(mockedUpdatePreferences).not.toHaveBeenCalled()
    })

    it('saves midnight when the learner asks for it', async () => {
      const u = userEvent.setup()
      const { hour } = await renderReminders()

      await u.clear(hour)
      await u.type(hour, '0')
      await u.tab()

      expect(mockedUpdatePreferences).toHaveBeenCalledWith(expect.objectContaining({ reminderHour: 0 }))
    })

    it('does not save when nothing changed', async () => {
      const u = userEvent.setup()
      const { email } = await renderReminders()

      await u.click(email)
      await u.tab()

      expect(mockedUpdatePreferences).not.toHaveBeenCalled()
    })
  })

  describe('preferences error', () => {
    it('shows an error with a retry instead of loading forever when getPreferences rejects', async () => {
      mockedGetPreferences.mockRejectedValueOnce(new Error('prefs 500'))
      mockedGetPreferences.mockResolvedValue(basePrefs())
      const u = userEvent.setup()

      renderSettings()

      expect(await screen.findByText("We couldn't load your settings.")).toBeInTheDocument()
      expect(screen.queryByText('Loading your settings')).not.toBeInTheDocument()

      await u.click(screen.getByRole('button', { name: 'Try again' }))

      expect(await screen.findByRole('heading', { name: 'Practice' })).toBeInTheDocument()
      expect(mockedGetPreferences).toHaveBeenCalledTimes(2)
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
      expect(await section('Practice').findByText('Saved')).toBeInTheDocument()
    })

    it('toggles an interest off and persists the pruned array', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ interests: ['backend', 'security'] }))

      renderSettings()

      await u.click(await screen.findByRole('button', { name: 'backend' }))

      expect(mockedUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ interests: ['security'] }),
      )
    })

    it('offers debugging, the category of the micro kata, so it can steer today\'s kata', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ interests: ['backend'] }))

      renderSettings()

      await u.click(await screen.findByRole('button', { name: 'debugging' }))

      expect(mockedUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ interests: ['backend', 'debugging'] }),
      )
    })

    it('surfaces the Error indicator when the save request rejects', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ goalWeeklyTarget: 3 }))
      mockedUpdatePreferences.mockRejectedValue(new Error('save 500'))

      renderSettings()

      await u.click(await screen.findByRole('button', { name: '5 kata per week' }))

      expect(mockedUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ goalWeeklyTarget: 5 }),
      )
      expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't save practice.")
      expect(screen.getByText('Some changes are not saved')).toBeInTheDocument()
    })
  })

  describe('saving', () => {
    it('sends saves one at a time, so the newest choice lands last', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ goalWeeklyTarget: 3 }))
      let finishFirst = (): void => undefined
      mockedUpdatePreferences.mockReturnValueOnce(
        new Promise((resolve) => { finishFirst = () => resolve({ ok: true }) }),
      )

      renderSettings()
      await u.click(await screen.findByRole('button', { name: '5 kata per week' }))
      await u.click(screen.getByRole('button', { name: '6 kata per week' }))

      await waitFor(() => expect(mockedUpdatePreferences).toHaveBeenCalledTimes(1))
      expect(section('Practice').queryByText('Saved')).not.toBeInTheDocument()

      finishFirst()

      await waitFor(() => expect(mockedUpdatePreferences).toHaveBeenCalledTimes(2))
      expect(mockedUpdatePreferences).toHaveBeenLastCalledWith(
        expect.objectContaining({ goalWeeklyTarget: 6 }),
      )
      expect(await section('Practice').findByText('Saved')).toBeInTheDocument()
    })

    it('retries the latest values after a failed save', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ goalWeeklyTarget: 3 }))
      mockedUpdatePreferences.mockRejectedValueOnce(new Error('save 500'))

      renderSettings()
      await u.click(await screen.findByRole('button', { name: '5 kata per week' }))
      await u.click(await screen.findByRole('button', { name: 'Retry practice' }))

      expect(await section('Practice').findByText('Saved')).toBeInTheDocument()
      expect(mockedUpdatePreferences).toHaveBeenCalledTimes(2)
      expect(mockedUpdatePreferences).toHaveBeenLastCalledWith(
        expect.objectContaining({ goalWeeklyTarget: 5 }),
      )
    })

    it('sends only the fields of the section that changed', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ reminderEnabled: true, email: 'you@test.dev' }))

      renderSettings()
      await u.click(await screen.findByRole('button', { name: 'Senior' }))

      expect(mockedUpdatePreferences).toHaveBeenCalledWith({
        level: 'senior',
        interests: ['backend'],
        randomness: 0.5,
        goalWeeklyTarget: 3,
      })

      await u.click(screen.getByRole('switch', { name: 'Daily reminder' }))

      expect(mockedUpdatePreferences).toHaveBeenLastCalledWith({
        reminderEnabled: false,
        reminderHour: 9,
        email: 'you@test.dev',
      })
    })

    it('keeps a failed practice draft out of a reminder save, and its error on screen', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ level: 'mid' }))
      mockedUpdatePreferences.mockRejectedValueOnce(new Error('save 500'))

      renderSettings()
      await u.click(await screen.findByRole('button', { name: 'Senior' }))
      await section('Practice').findByRole('button', { name: 'Retry practice' })

      await u.click(screen.getByRole('switch', { name: 'Daily reminder' }))

      await section('Reminders').findByText('Saved')
      expect(mockedUpdatePreferences.mock.lastCall?.[0]).not.toHaveProperty('level')
      expect(section('Practice').getByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Senior' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('says reminders are off once that is saved', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ reminderEnabled: true, email: 'you@test.dev' }))

      renderSettings()
      await u.click(await screen.findByRole('switch', { name: 'Daily reminder' }))

      expect(await screen.findByText('Reminders off · saved')).toBeInTheDocument()
    })

    it('undoes a failed draft back to what was last saved', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ level: 'mid' }))
      mockedUpdatePreferences.mockRejectedValueOnce(new Error('save 500'))

      renderSettings()
      await u.click(await screen.findByRole('button', { name: 'Senior' }))
      await u.click(await section('Practice').findByRole('button', { name: 'Undo changes' }))

      expect(screen.getByRole('button', { name: 'Mid' })).toHaveAttribute('aria-pressed', 'true')
      expect(section('Practice').queryByRole('alert')).not.toBeInTheDocument()
      expect(mockedUpdatePreferences).toHaveBeenCalledTimes(1)
    })

    it('never offers undo once a change is saved', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ level: 'mid' }))

      renderSettings()
      await u.click(await screen.findByRole('button', { name: 'Senior' }))
      await section('Practice').findByText('Saved')

      expect(screen.queryByRole('button', { name: 'Undo changes' })).not.toBeInTheDocument()
    })
  })

  describe('randomness slider', () => {
    function slide(value: number) {
      fireEvent.change(screen.getByRole('slider', { name: /Randomness/ }), { target: { value } })
    }

    it('saves once, with the last value, after the slider settles', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs({ randomness: 0.5 }))

      renderSettings()
      await screen.findByRole('heading', { name: 'Settings' })
      slide(0.6)
      slide(0.7)
      slide(0.8)

      expect(mockedUpdatePreferences).not.toHaveBeenCalled()
      await waitFor(() => expect(mockedUpdatePreferences).toHaveBeenCalledTimes(1))
      expect(mockedUpdatePreferences).toHaveBeenCalledWith(expect.objectContaining({ randomness: 0.8 }))
    })

    it('saves right away when the slider loses focus', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs({ randomness: 0.5 }))

      renderSettings()
      await screen.findByRole('heading', { name: 'Settings' })
      slide(0.6)
      fireEvent.blur(screen.getByRole('slider', { name: /Randomness/ }))

      await section('Practice').findByText('Saved')
      expect(mockedUpdatePreferences).toHaveBeenCalledTimes(1)
    })

    it('does not lose a pending value when the learner leaves the page', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs({ randomness: 0.5 }))

      const { unmount } = renderSettings()
      await screen.findByRole('heading', { name: 'Settings' })
      slide(0.9)
      unmount()

      await waitFor(() => expect(mockedUpdatePreferences).toHaveBeenCalledTimes(1))
      expect(mockedUpdatePreferences).toHaveBeenCalledWith(expect.objectContaining({ randomness: 0.9 }))
    })
  })

  describe('offline', () => {
    it('keeps the draft without calling the API, then saves on reconnect', async () => {
      const u = userEvent.setup()
      mockedGetPreferences.mockResolvedValue(basePrefs({ level: 'mid' }))

      renderSettings()
      const senior = await screen.findByRole('button', { name: 'Senior' })
      const onLine = goOffline()
      await u.click(senior)

      expect(screen.getByText('Draft kept on this page. Reconnect to save.')).toBeInTheDocument()
      expect(screen.getByText('Draft kept on this page')).toBeInTheDocument()
      expect(mockedUpdatePreferences).not.toHaveBeenCalled()

      onLine.mockReturnValue(true)
      fireEvent(globalThis.window, new Event('online'))

      await section('Practice').findByText('Saved')
      expect(mockedUpdatePreferences).toHaveBeenCalledWith(expect.objectContaining({ level: 'senior' }))
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

  describe('privacy', () => {
    it('stays unavailable and says so', async () => {
      mockedGetPreferences.mockResolvedValue(basePrefs())

      renderSettings()

      expect(await screen.findByRole('switch', { name: 'Make profile private' })).toBeDisabled()
      expect(screen.getByText('Profile privacy is not available yet.')).toBeInTheDocument()
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
