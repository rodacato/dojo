import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminEditKataPage } from './AdminEditKataPage'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    getAdminKata: vi.fn(),
    getKataFeedback: vi.fn(),
    updateKata: vi.fn(),
    archiveKata: vi.fn(),
  },
}))

const mockedGet = vi.mocked(api.getAdminKata)
const mockedFeedback = vi.mocked(api.getKataFeedback)
const mockedUpdate = vi.mocked(api.updateKata)
const mockedArchive = vi.mocked(api.archiveKata)

// Save changes renders twice (header + sticky bar); the header trigger is first in DOM.
function clickSave(u: ReturnType<typeof userEvent.setup>) {
  return u.click(screen.getAllByRole('button', { name: 'Save changes' })[0]!)
}

type Kata = Awaited<ReturnType<typeof api.getAdminKata>>
type Feedback = Awaited<ReturnType<typeof api.getKataFeedback>>

function makeKata(over: Partial<Kata> = {}): Kata {
  return {
    id: 'k1',
    title: 'Rate limiter',
    description: 'Build a token bucket.',
    duration: 30,
    difficulty: 'hard',
    type: 'code',
    languages: ['ts'],
    tags: ['api'],
    topics: ['backpressure'],
    status: 'draft',
    variations: [
      { id: 'v1', ownerRole: 'Senior DBA', ownerContext: 'Focus on locks.' },
    ],
    ...over,
  }
}

const emptyFeedback: Feedback = {
  total: 0,
  clarity: {},
  timing: {},
  evaluation: {},
  notes: [],
  byVariation: {},
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/katas/k1']}>
      <Routes>
        <Route path="/admin/katas/:id" element={<AdminEditKataPage />} />
        <Route path="/admin/katas" element={<div>katas list</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGet.mockResolvedValue(makeKata())
  mockedFeedback.mockResolvedValue(emptyFeedback)
  mockedUpdate.mockResolvedValue({ ok: true })
  mockedArchive.mockResolvedValue({ ok: true })
})

describe('AdminEditKataPage', () => {
  it('shows the loader until the kata resolves', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Rate limiter' })).not.toBeInTheDocument()
  })

  it('renders the loaded kata into the form fields', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Rate limiter' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Refactor a 200-line/)).toHaveValue('Rate limiter')
    expect(screen.getByPlaceholderText(/Describe the problem/)).toHaveValue('Build a token bucket.')
    expect(screen.getByPlaceholderText(/Senior DBA/)).toHaveValue('Senior DBA')
    // Status pill reflects the loaded status.
    const pill = screen.getByText('draft')
    expect(pill).toBeInTheDocument()
  })

  it('sends the full edited payload to updateKata and navigates back', async () => {
    const u = userEvent.setup()
    renderPage()

    const title = await screen.findByPlaceholderText(/Refactor a 200-line/)
    await u.clear(title)
    await u.type(title, 'Rate limiter v2')
    await clickSave(u)

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(1))
    expect(mockedUpdate).toHaveBeenCalledWith('k1', {
      title: 'Rate limiter v2',
      description: 'Build a token bucket.',
      duration: 30,
      difficulty: 'hard',
      type: 'code',
      status: 'draft',
      languages: ['ts'],
      tags: ['api'],
      topics: ['backpressure'],
      adminNotes: null,
      variations: [{ ownerRole: 'Senior DBA', ownerContext: 'Focus on locks.' }],
    })
    expect(await screen.findByText('katas list')).toBeInTheDocument()
  })

  it('serialises adminNotes when provided and keeps null when empty', async () => {
    const u = userEvent.setup()
    renderPage()

    const notes = await screen.findByPlaceholderText(/Why this kata exists/)
    await u.type(notes, 'tested by adrian')
    await clickSave(u)

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled())
    expect(mockedUpdate.mock.calls[0]![1].adminNotes).toBe('tested by adrian')
  })

  it('blocks save and shows the validation banner when the title is cleared', async () => {
    const u = userEvent.setup()
    renderPage()

    const title = await screen.findByPlaceholderText(/Refactor a 200-line/)
    await u.clear(title)
    await clickSave(u)

    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('Validation')).toBeInTheDocument()
    // Surfaces both in the banner and as the inline field error.
    expect(screen.getAllByText(/Title is required\./)).toHaveLength(2)
  })

  it('blocks save when no variation has an owner role', async () => {
    const u = userEvent.setup()
    renderPage()

    const role = await screen.findByPlaceholderText(/Senior DBA/)
    await u.clear(role)
    await clickSave(u)

    expect(mockedUpdate).not.toHaveBeenCalled()
    expect(
      screen.getByText(/At least 1 variation must have an owner role\./),
    ).toBeInTheDocument()
  })

  it('shows the API error and stays on the form when updateKata rejects', async () => {
    mockedUpdate.mockRejectedValue(new Error('conflict 409'))
    const u = userEvent.setup()
    renderPage()

    await screen.findByPlaceholderText(/Refactor a 200-line/)
    await clickSave(u)

    expect(await screen.findByText('conflict 409')).toBeInTheDocument()
    expect(screen.queryByText('katas list')).not.toBeInTheDocument()
  })

  it('persists an added variation row in the update payload', async () => {
    const u = userEvent.setup()
    renderPage()

    await screen.findByPlaceholderText(/Senior DBA/)
    await u.click(screen.getByRole('button', { name: '+ Add variation' }))

    const roles = screen.getAllByPlaceholderText(/Senior DBA/)
    expect(roles).toHaveLength(2)
    await u.type(roles[1]!, 'Staff SRE')
    await clickSave(u)

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled())
    expect(mockedUpdate.mock.calls[0]![1].variations).toEqual([
      { ownerRole: 'Senior DBA', ownerContext: 'Focus on locks.' },
      { ownerRole: 'Staff SRE', ownerContext: '' },
    ])
  })

  it('toggling "Make public" sends status published on save', async () => {
    const u = userEvent.setup()
    renderPage()

    await screen.findByRole('heading', { name: 'Rate limiter' })
    await u.click(screen.getByRole('switch', { name: 'Make public' }))
    await clickSave(u)

    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled())
    expect(mockedUpdate.mock.calls[0]![1].status).toBe('published')
  })

  describe('archive flow', () => {
    it('opens the confirm modal and archives only on confirm', async () => {
      const u = userEvent.setup()
      renderPage()

      await u.click(await screen.findByRole('button', { name: 'Archive' }))

      // Modal up; archive not yet called.
      expect(await screen.findByText('Archive kata?')).toBeInTheDocument()
      expect(mockedArchive).not.toHaveBeenCalled()

      // Confirm via the modal's primary action (the modal Archive button).
      const archiveButtons = screen.getAllByRole('button', { name: 'Archive' })
      await u.click(archiveButtons[archiveButtons.length - 1]!)

      await waitFor(() => expect(mockedArchive).toHaveBeenCalledWith('k1'))
      expect(await screen.findByText('katas list')).toBeInTheDocument()
    })

    it('hides the Archive button when the kata is already archived', async () => {
      mockedGet.mockResolvedValue(makeKata({ status: 'archived' }))
      renderPage()

      await screen.findByRole('heading', { name: 'Rate limiter' })
      expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument()
      // The archived status pill is shown instead.
      expect(screen.getByText('archived')).toBeInTheDocument()
    })
  })

  describe('feedback panel', () => {
    it('does not render the panel when there are zero sessions', async () => {
      renderPage()

      await screen.findByRole('heading', { name: 'Rate limiter' })
      expect(screen.queryByText(/Learner feedback/)).not.toBeInTheDocument()
    })

    it('renders aggregated signal scores when feedback exists', async () => {
      mockedFeedback.mockResolvedValue({
        ...emptyFeedback,
        total: 10,
        // all "clear" → weight 5 → score 5.0
        clarity: { clear: 10 },
        // all "about_right" → weight 5 → 5.0
        timing: { about_right: 10 },
        evaluation: {},
        notes: [],
        byVariation: {},
      })
      renderPage()

      expect(await screen.findByText(/Learner feedback · 10 sessions/)).toBeInTheDocument()
      // The label div sits inside its SignalCard; the parent holds the score.
      const clarityCard = screen.getByText('Clarity').parentElement as HTMLElement
      expect(within(clarityCard).getByText('5.0')).toBeInTheDocument()
      // Fairness has no votes → em dash.
      const fairnessCard = screen.getByText('Fairness').parentElement as HTMLElement
      expect(within(fairnessCard).getByText('—')).toBeInTheDocument()
    })

    it('renders a per-variation feedback row labelled VAR 1 from the loaded variation id', async () => {
      mockedFeedback.mockResolvedValue({
        ...emptyFeedback,
        total: 4,
        clarity: { clear: 4 },
        timing: {},
        evaluation: {},
        notes: [],
        // Keyed by the same variation id the kata loaded (v1) → labelled "VAR 1".
        byVariation: {
          v1: { total: 4, clarity: { clear: 4 }, timing: {}, evaluation: {} },
        },
      })
      renderPage()

      await screen.findByText(/Learner feedback/)
      const table = screen.getByRole('table')
      // The row uses the human label, not the raw id.
      expect(within(table).getByText('VAR 1')).toBeInTheDocument()
      expect(within(table).queryByText('v1')).not.toBeInTheDocument()
      // Session count for the variation is rendered.
      expect(within(table).getByText('4')).toBeInTheDocument()
    })

    it('renders even if the feedback request fails (panel just absent)', async () => {
      mockedFeedback.mockRejectedValue(new Error('feedback 500'))
      renderPage()

      expect(await screen.findByRole('heading', { name: 'Rate limiter' })).toBeInTheDocument()
      expect(screen.queryByText(/Learner feedback/)).not.toBeInTheDocument()
    })
  })
})
