import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { KataDTO } from '@dojo/shared'

import { KatasPage } from './KatasPage'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({
  api: {
    getKatas: vi.fn(),
    startSession: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)

function kata(id: string, title: string, over: Partial<KataDTO> = {}): KataDTO {
  return {
    id,
    title,
    description: 'Pages are 1-based: page 1 should return the first `limit` items.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    language: ['typescript'],
    tags: ['micro'],
    ...over,
  }
}

const THREE = [kata('k1', 'Off-by-one in pagination'), kata('k2', 'Zero emails sent'), kata('k3', 'Stuck at nine')]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/katas']}>
      <Routes>
        <Route path="/katas" element={<KatasPage />} />
        <Route path="/katas/:id" element={<div>kata page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function duration(label: string) {
  return within(screen.getByRole('group', { name: 'Maximum duration' })).getByRole('button', { name: label })
}

function remember(filters: object) {
  localStorage.setItem('dojo_kata_filters', JSON.stringify(filters))
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('KatasPage (Choose a kata)', () => {
  it('offers 5, 10 and 20 minutes, with Find waiting for one', () => {
    renderPage()

    const durations = within(screen.getByRole('group', { name: 'Maximum duration' })).getAllByRole('button')
    expect(durations.map((b) => b.textContent)).toEqual(['5m', '10m', '20m'])
    expect(screen.getByLabelText('Type')).toHaveValue('')
    expect(screen.getByLabelText('Language')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Find katas →' })).toBeDisabled()
    expect(mockedApi.getKatas).not.toHaveBeenCalled()
  })

  it('finds up to three katas with the first selected, and starts nothing until Start', async () => {
    mockedApi.getKatas.mockResolvedValue(THREE)
    const user = userEvent.setup()
    renderPage()

    await user.click(duration('10m'))
    await user.selectOptions(screen.getByLabelText('Type'), 'Review')
    await user.click(screen.getByRole('button', { name: 'Find katas →' }))

    expect(mockedApi.getKatas).toHaveBeenCalledWith({ maxDuration: 10, type: 'review' })
    const choices = await screen.findAllByRole('radio')
    expect(choices).toHaveLength(3)
    expect(choices[0]).toBeChecked()
    expect(choices[0]).toHaveFocus()
    expect(screen.getByText('≤ 10m · Review · Any')).toBeInTheDocument()
    expect(mockedApi.startSession).not.toHaveBeenCalled()
  })

  it('starts the kata the learner picked', async () => {
    mockedApi.getKatas.mockResolvedValue(THREE)
    mockedApi.startSession.mockResolvedValue({ sessionId: 's9' })
    const user = userEvent.setup()
    renderPage()

    await user.click(duration('5m'))
    await user.click(screen.getByRole('button', { name: 'Find katas →' }))
    await user.click(await screen.findByRole('radio', { name: /Stuck at nine/ }))
    await user.click(screen.getByRole('button', { name: 'Start kata →' }))

    expect(mockedApi.startSession).toHaveBeenCalledWith('k3')
    expect(await screen.findByText('kata page')).toBeInTheDocument()
  })

  it('shows only the katas that exist, never padding to three', async () => {
    mockedApi.getKatas.mockResolvedValue([THREE[0]!])
    const user = userEvent.setup()
    renderPage()

    await user.click(duration('5m'))
    await user.click(screen.getByRole('button', { name: 'Find katas →' }))

    expect(await screen.findAllByRole('radio')).toHaveLength(1)
    expect(screen.getByRole('group', { name: '1 kata' })).toBeInTheDocument()
  })

  it('comes back with the last constraints, already looked up: one click to open, one to start', async () => {
    remember({ duration: 20, type: 'code', language: 'go' })
    mockedApi.getKatas.mockResolvedValue(THREE)
    mockedApi.startSession.mockResolvedValue({ sessionId: 's1' })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByRole('radio', { name: /Off-by-one/ })).toBeChecked()
    expect(mockedApi.getKatas).toHaveBeenCalledWith({ maxDuration: 20, type: 'code', language: 'go' })

    await user.click(screen.getByRole('button', { name: 'Start kata →' }))
    expect(mockedApi.startSession).toHaveBeenCalledWith('k1')
  })

  it('remembers the constraints of a lookup for next time', async () => {
    mockedApi.getKatas.mockResolvedValue(THREE)
    const user = userEvent.setup()
    renderPage()

    await user.click(duration('5m'))
    await user.selectOptions(screen.getByLabelText('Language'), 'SQL')
    await user.click(screen.getByRole('button', { name: 'Find katas →' }))
    await screen.findAllByRole('radio')

    expect(JSON.parse(localStorage.getItem('dojo_kata_filters')!)).toEqual({ duration: 5, type: '', language: 'sql' })
  })

  it('ignores remembered constraints it no longer offers', () => {
    remember({ duration: 45, type: 'code', language: '' })
    renderPage()

    expect(mockedApi.getKatas).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Find katas →' })).toBeDisabled()
  })

  it('keeps the constraints when the learner goes back to change them', async () => {
    remember({ duration: 10, type: 'review', language: 'python' })
    mockedApi.getKatas.mockResolvedValue(THREE)
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Change constraints' }))

    expect(duration('10m')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Type')).toHaveValue('review')
    expect(screen.getByLabelText('Language')).toHaveValue('python')
  })

  it('says how to widen the filters when nothing fits, and starts nothing', async () => {
    mockedApi.getKatas.mockResolvedValue([])
    const user = userEvent.setup()
    renderPage()

    await user.click(duration('5m'))
    await user.click(screen.getByRole('button', { name: 'Find katas →' }))

    expect(await screen.findByRole('status')).toHaveTextContent('No kata fits these filters.')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(mockedApi.startSession).not.toHaveBeenCalled()
  })

  it('keeps the constraints when the lookup fails', async () => {
    mockedApi.getKatas.mockRejectedValue(new Error('500'))
    const user = userEvent.setup()
    renderPage()

    await user.click(duration('20m'))
    await user.click(screen.getByRole('button', { name: 'Find katas →' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load your kata. Try again.")
    expect(duration('20m')).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('dojo_kata_filters')).toBeNull()
  })

  it('keeps the choice when the start fails, and retries that same kata', async () => {
    mockedApi.getKatas.mockResolvedValue(THREE)
    mockedApi.startSession.mockRejectedValueOnce(new Error('500')).mockResolvedValueOnce({ sessionId: 's2' })
    const user = userEvent.setup()
    renderPage()

    await user.click(duration('5m'))
    await user.click(screen.getByRole('button', { name: 'Find katas →' }))
    await user.click(await screen.findByRole('radio', { name: /Zero emails/ }))
    await user.click(screen.getByRole('button', { name: 'Start kata →' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't start that kata. Try again.")
    expect(screen.getByRole('radio', { name: /Zero emails/ })).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Start kata →' }))
    expect(mockedApi.startSession).toHaveBeenLastCalledWith('k2')
    expect(mockedApi.getKatas).toHaveBeenCalledTimes(1)
  })
})
