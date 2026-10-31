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
    expect(screen.getByRole('group', { name: 'Was the description clear?' }).closest('details')).not.toHaveAttribute('open')
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
    await user.click(screen.getByText('More feedback'))
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

    await user.click(await screen.findByText('More feedback'))
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

    await user.click(await screen.findByText('More feedback'))
    const box = screen.getByLabelText('Anything to add?')
    await user.click(box)
    await user.paste('x'.repeat(300))

    expect(box).toHaveValue('x'.repeat(280))
  })

  it('keeps a failed vote beside its own question and retries that vote', async () => {
    submitFeedback.mockRejectedValueOnce(new Error('500'))
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'Spot on' }))

    const evaluation = question("How was the sensei's review?")
    expect(await evaluation.findByRole('alert')).toHaveTextContent("Couldn't send your feedback. Try again.")
    expect(evaluation.getByRole('button', { name: 'Spot on' })).toHaveAttribute('aria-pressed', 'true')
    expect(question('Was the time limit right?').queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Some feedback is not saved')).toBeInTheDocument()

    await user.click(evaluation.getByRole('button', { name: 'Retry feedback' }))

    expect(submitFeedback).toHaveBeenLastCalledWith('s1', { evaluation: 'fair_and_relevant' })
    expect(evaluation.queryByRole('alert')).not.toBeInTheDocument()
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('does not lose the failure on one question when another saves', async () => {
    submitFeedback.mockRejectedValueOnce(new Error('500'))
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'Spot on' }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'About right' }))

    expect(question("How was the sensei's review?").getByRole('alert')).toBeInTheDocument()
  })

  it('ignores a second tap while that question is saving, and keeps the button focusable', async () => {
    let finish!: (value: { ok: boolean }) => void
    submitFeedback.mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    const tapped = await screen.findByRole('button', { name: 'About right' })
    await user.click(tapped)
    expect(screen.getByText('Saving…')).toBeInTheDocument()
    expect(tapped).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Too loose' }))

    expect(submitFeedback).toHaveBeenCalledTimes(1)
    expect(tapped).toHaveAttribute('aria-pressed', 'true')
    finish({ ok: true })
    expect(await screen.findByText('Saved')).toBeInTheDocument()
  })

  it('counts the note, and treats an edited note as unsent again', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByText('More feedback'))
    const box = screen.getByLabelText('Anything to add?')
    await user.type(box, 'short')
    expect(screen.getByText('5/280')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Send note' }))
    expect(await screen.findByText('feedback received — thank you.')).toBeInTheDocument()

    await user.type(box, 'er')

    expect(screen.queryByText('feedback received — thank you.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send note' })).toBeEnabled()
  })

  it('keeps a note that failed to send and offers it again', async () => {
    submitFeedback.mockRejectedValueOnce(new Error('500'))
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByText('More feedback'))
    await user.type(screen.getByLabelText('Anything to add?'), 'a note')
    await user.click(screen.getByRole('button', { name: 'Send note' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('Anything to add?')).toHaveValue('a note')

    await user.click(screen.getByRole('button', { name: 'Retry feedback' }))

    expect(submitFeedback).toHaveBeenLastCalledWith('s1', { note: 'a note' })
    expect(await screen.findByText('feedback received — thank you.')).toBeInTheDocument()
  })

  it('still lets the learner vote when the saved votes could not be loaded', async () => {
    getFeedback.mockRejectedValue(new Error('500'))
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" />)

    await user.click(await screen.findByRole('button', { name: 'About right' }))

    expect(submitFeedback).toHaveBeenCalledWith('s1', { timing: 'about_right' })
  })
})
