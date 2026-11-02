import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { admin } from '../../lib/api/admin'
import { AdminFeedbackPage } from './AdminFeedbackPage'

vi.mock('../../lib/api/admin', () => ({ admin: { getRecentFeedback: vi.fn() } }))
const getRecentFeedback = vi.mocked(admin.getRecentFeedback)

const item = (overrides: Record<string, unknown> = {}) => ({
  sessionId: 's-1',
  kataId: 'k-1',
  kataTitle: 'Off-by-one in pagination',
  kataType: 'review',
  username: 'adrian',
  clarity: null,
  timing: 'too_short',
  evaluation: 'too_generic',
  note: 'The hint gave the answer away.\nMaybe drop line 3.',
  submittedAt: '2026-10-30T10:00:00.000Z',
  ...overrides,
})

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminFeedbackPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  getRecentFeedback.mockReset()
  getRecentFeedback.mockResolvedValue({ days: 30, items: [item(), item({ sessionId: 's-2', note: null, kataTitle: 'Race condition' })] })
})

describe('AdminFeedbackPage', () => {
  it('reads the last 30 days, with the votes in the learner-facing words and the note in full', async () => {
    renderPage()

    expect(await screen.findByRole('link', { name: 'Off-by-one in pagination' })).toHaveAttribute('href', '/admin/katas/k-1/edit')
    expect(getRecentFeedback).toHaveBeenCalledWith(30)
    expect(screen.getAllByText('Time: Too tight · Review: Too generic')).toHaveLength(2)
    expect(screen.getByText(/The hint gave the answer away\./)).toBeInTheDocument()
    expect(screen.getByText('2 ratings')).toBeInTheDocument()
  })

  it('narrows to ratings with a note', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('2 ratings')

    await user.click(screen.getByLabelText('With notes only'))

    expect(screen.getByText('1 rating')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Race condition' })).not.toBeInTheDocument()
  })

  it('changes the window', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('2 ratings')

    await user.click(screen.getByRole('button', { name: '7 days' }))

    expect(getRecentFeedback).toHaveBeenLastCalledWith(7)
  })

  it('says when the window is empty', async () => {
    getRecentFeedback.mockResolvedValue({ days: 30, items: [] })
    renderPage()

    expect(await screen.findByText('No feedback in the last 30 days.')).toBeInTheDocument()
  })

  it('offers a retry when the list fails to load', async () => {
    getRecentFeedback.mockRejectedValueOnce(new Error('500'))
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('2 ratings')).toBeInTheDocument()
  })
})
