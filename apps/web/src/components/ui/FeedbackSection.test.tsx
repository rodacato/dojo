import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FeedbackSection } from './FeedbackSection'

const submitFeedback = vi.fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()
const getFeedback = vi.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>()

vi.mock('../../lib/api', () => ({
  api: {
    submitFeedback: (...args: unknown[]) => submitFeedback(...args),
    getFeedback: (...args: unknown[]) => getFeedback(...args),
  },
}))

const NOTHING_SAVED = { submitted: false }

beforeEach(() => {
  submitFeedback.mockReset()
  submitFeedback.mockResolvedValue({ ok: true })
  getFeedback.mockReset()
  getFeedback.mockResolvedValue(NOTHING_SAVED)
})

function question(name: string) {
  return within(screen.getByRole('group', { name }))
}

describe('FeedbackSection', () => {
  it('asks the two trial questions openly, each labelled by its question', async () => {
    render(<FeedbackSection sessionId="s1" />)

    expect(await screen.findByRole('group', { name: 'Was the time limit right?' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: "How was the sensei's review?" })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Was the description clear?' })).not.toBeInTheDocument()
  })

  it('saves a vote the moment it is tapped, with nothing to send', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'About right' }))

    expect(submitFeedback).toHaveBeenCalledWith('s1', { timing: 'about_right' })
    expect(question('Was the time limit right?').getByRole('button', { name: 'About right' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('stores what each label says (D62)', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'Too generic' }))
    await user.click(screen.getByRole('button', { name: 'More feedback' }))
    await user.click(screen.getByRole('button', { name: 'Somewhat unclear' }))

    expect(submitFeedback).toHaveBeenCalledWith('s1', { evaluation: 'too_generic' })
    expect(submitFeedback).toHaveBeenCalledWith('s1', { clarity: 'somewhat_unclear' })
  })

  it('shows the votes already saved when the learner comes back', async () => {
    getFeedback.mockResolvedValue({ submitted: true, timing: 'too_long', evaluation: 'fair_and_relevant', clarity: null, note: null })
    render(<FeedbackSection sessionId="s1" />)

    expect(await screen.findByRole('button', { name: 'Too loose' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Spot on' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('sends a trimmed note on its own, then thanks the learner', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'More feedback' }))
    const send = screen.getByRole('button', { name: 'Send note' })
    expect(send).toBeDisabled()

    await user.type(screen.getByLabelText('Anything to add?'), '  shorter code next time  ')
    await user.click(send)

    expect(submitFeedback).toHaveBeenCalledWith('s1', { note: 'shorter code next time' })
    expect(await screen.findByText('feedback received — thank you.')).toBeInTheDocument()
  })

  it('caps the note at 280 characters', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'More feedback' }))
    const box = screen.getByLabelText('Anything to add?')
    await user.click(box)
    await user.paste('x'.repeat(300))

    expect(box).toHaveValue('x'.repeat(280))
  })

  it('says so when a vote could not be saved', async () => {
    submitFeedback.mockRejectedValue(new Error('500'))
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'Spot on' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't send your feedback. Try again.")
    expect(screen.getByRole('button', { name: 'Spot on' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('still lets the learner vote when the saved votes could not be loaded', async () => {
    getFeedback.mockRejectedValue(new Error('500'))
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'About right' }))

    expect(submitFeedback).toHaveBeenCalledWith('s1', { timing: 'about_right' })
  })
})
