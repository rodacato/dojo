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

const kata: KataDTO = {
  id: 'k1',
  title: 'Off-by-one in pagination',
  description: 'Pages are 1-based.',
  duration: 5,
  difficulty: 'easy',
  type: 'review',
  language: ['typescript'],
  tags: ['micro'],
}

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

function chip(group: string, label: string) {
  return within(screen.getByRole('group', { name: group })).getByRole('button', { name: label })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('KatasPage (Advanced)', () => {
  it('starts with type and language on Any and Start waiting for a duration', () => {
    renderPage()

    expect(chip('Type', 'Any')).toHaveAttribute('aria-pressed', 'true')
    expect(chip('Language', 'Any')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('asks for one kata inside the filters and opens it, with no list in between', async () => {
    const user = userEvent.setup()
    mockedApi.getKatas.mockResolvedValue([kata, { ...kata, id: 'k2', title: 'Second' }])
    mockedApi.startSession.mockResolvedValue({ sessionId: 'sess-1' })

    renderPage()
    await user.click(chip('How long?', '10m'))
    await user.click(chip('Type', 'Review'))
    await user.click(chip('Language', 'TypeScript'))
    await user.click(screen.getByRole('button', { name: /start/i }))

    expect(mockedApi.getKatas).toHaveBeenCalledWith({ maxDuration: 10, type: 'review', language: 'typescript' })
    expect(mockedApi.startSession).toHaveBeenCalledWith('k1')
    expect(await screen.findByText('kata page')).toBeInTheDocument()
    expect(screen.queryByText('Second')).not.toBeInTheDocument()
  })

  it('leaves Any out of the request', async () => {
    const user = userEvent.setup()
    mockedApi.getKatas.mockResolvedValue([kata])
    mockedApi.startSession.mockResolvedValue({ sessionId: 'sess-1' })

    renderPage()
    await user.click(chip('How long?', '20m'))
    await user.click(screen.getByRole('button', { name: /start/i }))

    expect(mockedApi.getKatas).toHaveBeenCalledWith({ maxDuration: 20 })
  })

  it('says how to widen the filters when nothing fits, and starts nothing', async () => {
    const user = userEvent.setup()
    mockedApi.getKatas.mockResolvedValue([])

    renderPage()
    await user.click(chip('How long?', '20m'))
    await user.click(chip('Type', 'Chat'))
    await user.click(chip('Language', 'Go'))
    await user.click(screen.getByRole('button', { name: /start/i }))

    expect(await screen.findByText('No kata fits these filters.')).toBeInTheDocument()
    expect(screen.getByText('Widen one: set Type or Language to Any.')).toBeInTheDocument()
    expect(mockedApi.startSession).not.toHaveBeenCalled()

    await user.click(chip('Language', 'Any'))
    expect(screen.queryByText('No kata fits these filters.')).not.toBeInTheDocument()
  })

  it('reports a failed start and lets the learner try again', async () => {
    const user = userEvent.setup()
    mockedApi.getKatas.mockResolvedValue([kata])
    mockedApi.startSession.mockRejectedValue(new Error('boom'))

    renderPage()
    await user.click(chip('How long?', '10m'))
    await user.click(screen.getByRole('button', { name: /start/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't start that kata. Try again.")
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
  })

  it('no longer offers mood, three picks or the Customize panel', () => {
    renderPage()

    expect(screen.queryByText(/pick your mood/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /surprise me/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Customize')).not.toBeInTheDocument()
  })
})
