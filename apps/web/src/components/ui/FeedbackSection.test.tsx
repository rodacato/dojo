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

async function renderOpen(user = userEvent.setup()) {
  render(<FeedbackSection sessionId="s1" />)
  await user.click(await screen.findByRole('button', { name: /rate this kata|edit your rating/i }))
  return user
}

describe('FeedbackSection', () => {
  it('stays one link on the result until the learner opens it', async () => {
    render(<FeedbackSection sessionId="s1" />)

    expect(await screen.findByRole('button', { name: 'Rate this kata' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Was the time limit right?' })).not.toBeInTheDocument()
  })

  it('asks every question in the dialog, each labelled by its question', async () => {
    await renderOpen()

    const dialog = within(screen.getByRole('dialog', { name: 'Rate this kata' }))
    expect(dialog.getByRole('group', { name: 'Was the time limit right?' })).toBeInTheDocument()
    expect(dialog.getByRole('group', { name: "How was the sensei's review?" })).toBeInTheDocument()
    expect(dialog.getByRole('group', { name: 'Was the description clear?' })).toBeInTheDocument()
  })

  it('says the kata is rated once a vote saves, and closes', async () => {
    const user = await renderOpen()

    await user.click(screen.getByRole('button', { name: 'About right' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit your rating' })).toBeInTheDocument()
    expect(screen.getByText('Rated')).toBeInTheDocument()
  })

  it('saves a vote the moment it is tapped, with nothing to send', async () => {
    const user = await renderOpen()

    await user.click(screen.getByRole('button', { name: 'About right' }))

    expect(submitFeedback).toHaveBeenCalledWith('s1', { timing: 'about_right' })
    expect(question('Was the time limit right?').getByRole('button', { name: 'About right' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('stores what each label says (D62)', async () => {
    const user = await renderOpen()

    await user.click(screen.getByRole('button', { name: 'Too generic' }))
    await user.click(screen.getByRole('button', { name: 'Somewhat unclear' }))

    expect(submitFeedback).toHaveBeenCalledWith('s1', { evaluation: 'too_generic' })
    expect(submitFeedback).toHaveBeenCalledWith('s1', { clarity: 'somewhat_unclear' })
  })

  it('shows the votes already saved when the learner comes back', async () => {
    getFeedback.mockResolvedValue({ submitted: true, timing: 'too_long', evaluation: 'fair_and_relevant', clarity: null, note: 'kept' })
    await renderOpen()

    expect(screen.getByLabelText('Anything to add?')).toHaveValue('kept')
    expect(screen.getByRole('button', { name: 'Too loose' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Spot on' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('sends a trimmed note on its own, then thanks the learner', async () => {
    const user = await renderOpen()

    const send = screen.getByRole('button', { name: 'Send note' })
    expect(send).toBeDisabled()

    await user.type(screen.getByLabelText('Anything to add?'), '  shorter code next time  ')
    await user.click(send)

    expect(submitFeedback).toHaveBeenCalledWith('s1', { note: 'shorter code next time' })
    expect(await screen.findByText('feedback received — thank you.')).toBeInTheDocument()
  })

  it('caps the note at 1000 characters', async () => {
    const user = await renderOpen()

    const box = screen.getByLabelText('Anything to add?')
    await user.click(box)
    await user.paste('x'.repeat(1200))

    expect(box).toHaveValue('x'.repeat(1000))
    expect(screen.getByText('1000/1000 · 0 left')).toBeInTheDocument()
  })

  it('keeps a failed vote beside its own question and retries that vote', async () => {
    submitFeedback.mockRejectedValueOnce(new Error('500'))
    const user = await renderOpen()

    await user.click(screen.getByRole('button', { name: 'Spot on' }))

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
    const user = await renderOpen()

    await user.click(screen.getByRole('button', { name: 'Spot on' }))
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'About right' }))

    expect(question("How was the sensei's review?").getByRole('alert')).toBeInTheDocument()
  })

  it('ignores a second tap while that question is saving, and keeps the button focusable', async () => {
    let finish!: (value: { ok: boolean }) => void
    submitFeedback.mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const user = await renderOpen()

    const tapped = screen.getByRole('button', { name: 'About right' })
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
    const user = await renderOpen()

    const box = screen.getByLabelText('Anything to add?')
    await user.type(box, 'short')
    expect(screen.getByText('5/1000 · 995 left')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Send note' }))
    expect(await screen.findByText('feedback received — thank you.')).toBeInTheDocument()

    await user.type(box, 'er')

    expect(screen.queryByText('feedback received — thank you.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send note' })).toBeEnabled()
  })

  it('keeps a note that failed to send and offers it again', async () => {
    submitFeedback.mockRejectedValueOnce(new Error('500'))
    const user = await renderOpen()

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
    const user = await renderOpen()

    await user.click(screen.getByRole('button', { name: 'About right' }))

    expect(submitFeedback).toHaveBeenCalledWith('s1', { timing: 'about_right' })
  })
})
