import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminNewKataPage } from './AdminNewKataPage'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    createKata: vi.fn(),
  },
}))

const mockedCreate = vi.mocked(api.createKata)

// Save as draft renders twice (header + sticky bar); the header trigger is first in DOM.
function clickSave(u: ReturnType<typeof userEvent.setup>) {
  return u.click(screen.getAllByRole('button', { name: 'Save as draft' })[0]!)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/katas/new']}>
      <Routes>
        <Route path="/admin/katas/new" element={<AdminNewKataPage />} />
        <Route path="/admin/katas" element={<div>katas list</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedCreate.mockResolvedValue({ id: 'new-1' })
})

describe('AdminNewKataPage', () => {
  it('renders the empty new-kata form with one variation seeded', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'New kata' })).toBeInTheDocument()
    expect(screen.getByText('Variation 1')).toBeInTheDocument()
    // Only one variation by default → no Remove button (onRemove undefined when length === 1).
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })

  it('blocks submit and shows the validation banner when title + owner role are empty', async () => {
    const u = userEvent.setup()
    renderPage()

    await clickSave(u)

    expect(mockedCreate).not.toHaveBeenCalled()
    // Both issues surface in the banner.
    expect(screen.getByText('Validation')).toBeInTheDocument()
    expect(
      screen.getByText(/Title is required\. At least 1 variation must have an owner role\./),
    ).toBeInTheDocument()
  })

  it('still blocks submit when only the title is filled (no owner role)', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.type(screen.getByPlaceholderText(/Refactor a 200-line/), 'Caching layer')
    await clickSave(u)

    expect(mockedCreate).not.toHaveBeenCalled()
    expect(screen.getByText(/At least 1 variation must have an owner role\./)).toBeInTheDocument()
    // Title satisfied → that issue is dropped from the banner.
    expect(screen.queryByText(/Title is required\./)).not.toBeInTheDocument()
  })

  it('submits the exact payload built from the edited fields and navigates away', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.type(screen.getByPlaceholderText(/Refactor a 200-line/), 'Caching layer')
    await u.type(
      screen.getByPlaceholderText(/Describe the problem/),
      'Add an LRU cache.',
    )
    // BasicsFields renders Type, Difficulty, Duration selects in DOM order.
    const [typeSelect] = screen.getAllByRole('combobox')
    await u.selectOptions(typeSelect!, 'chat')
    await u.type(
      screen.getByPlaceholderText(/Senior DBA/),
      'Senior backend',
    )

    await clickSave(u)

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1))
    expect(mockedCreate).toHaveBeenCalledWith({
      title: 'Caching layer',
      description: 'Add an LRU cache.',
      duration: 20,
      difficulty: 'medium',
      type: 'chat',
      languages: [],
      tags: [],
      topics: [],
      variations: [{ ownerRole: 'Senior backend', ownerContext: '' }],
    })
    expect(await screen.findByText('katas list')).toBeInTheDocument()
  })

  it('adds a second variation and submits both rows', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.type(screen.getByPlaceholderText(/Refactor a 200-line/), 'Two persona kata')
    await u.click(screen.getByRole('button', { name: '+ Add variation' }))

    expect(screen.getByText('Variation 2')).toBeInTheDocument()
    const roleInputs = screen.getAllByPlaceholderText(/Senior DBA/)
    expect(roleInputs).toHaveLength(2)
    await u.type(roleInputs[0]!, 'DBA')
    await u.type(roleInputs[1]!, 'SRE')

    await clickSave(u)

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1))
    expect(mockedCreate.mock.calls[0]![0].variations).toEqual([
      { ownerRole: 'DBA', ownerContext: '' },
      { ownerRole: 'SRE', ownerContext: '' },
    ])
  })

  it('round-trips languages, tags and the variation context into the payload', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.type(screen.getByPlaceholderText(/Refactor a 200-line/), 'Full kata')
    await u.type(screen.getByPlaceholderText(/Senior DBA/), 'DBA')

    // ChipInput commits a chip on Enter.
    const langInput = screen.getByPlaceholderText(/typescript, sql, python/)
    await u.type(langInput, 'sql{Enter}')
    const tagInput = screen.getByPlaceholderText(/senior, frontend, performance/)
    await u.type(tagInput, 'backend{Enter}')

    await u.type(
      screen.getByPlaceholderText(/Tell the sensei what to focus on/),
      'Focus on locks.',
    )

    await clickSave(u)

    await waitFor(() => expect(mockedCreate).toHaveBeenCalled())
    const payload = mockedCreate.mock.calls[0]![0]
    expect(payload.languages).toEqual(['sql'])
    expect(payload.tags).toEqual(['backend'])
    expect(payload.variations[0]).toEqual({ ownerRole: 'DBA', ownerContext: 'Focus on locks.' })
  })

  it('removes an added variation row, mutating state back to a single persona', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.click(screen.getByRole('button', { name: '+ Add variation' }))
    expect(screen.getByText('Variation 2')).toBeInTheDocument()
    // Now two rows → each gets a Remove button.
    const removes = screen.getAllByRole('button', { name: 'Remove' })
    expect(removes).toHaveLength(2)

    await u.click(removes[1]!)

    expect(screen.queryByText('Variation 2')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })

  it('caps Add variation at three rows', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.click(screen.getByRole('button', { name: '+ Add variation' }))
    await u.click(screen.getByRole('button', { name: '+ Add variation' }))

    expect(screen.getByText('Variation 3')).toBeInTheDocument()
    // At 3 the add control is gone.
    expect(screen.queryByRole('button', { name: '+ Add variation' })).not.toBeInTheDocument()
  })

  it('surfaces the API error and stays on the form when createKata rejects', async () => {
    mockedCreate.mockRejectedValue(new Error('duplicate slug'))
    const u = userEvent.setup()
    renderPage()

    await u.type(screen.getByPlaceholderText(/Refactor a 200-line/), 'Boom')
    await u.type(screen.getByPlaceholderText(/Senior DBA/), 'DBA')
    await clickSave(u)

    expect(await screen.findByText('duplicate slug')).toBeInTheDocument()
    // Did not navigate.
    expect(screen.queryByText('katas list')).not.toBeInTheDocument()
    // Save button is enabled again (saving reset to false).
    expect(screen.getByRole('heading', { name: 'New kata' })).toBeInTheDocument()
  })

  it('saves via the Cmd/Ctrl+S keyboard shortcut', async () => {
    const u = userEvent.setup()
    renderPage()

    await u.type(screen.getByPlaceholderText(/Refactor a 200-line/), 'Keyboard save')
    await u.type(screen.getByPlaceholderText(/Senior DBA/), 'DBA')
    await u.keyboard('{Control>}s{/Control}')

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1))
    expect(mockedCreate.mock.calls[0]![0].title).toBe('Keyboard save')
  })
})
