import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FeedbackSection } from './FeedbackSection'

const submitFeedback = vi.fn<(...args: unknown[]) => Promise<{ ok: boolean }>>()

vi.mock('../../lib/api', () => ({
  api: {
    submitFeedback: (...args: unknown[]) => submitFeedback(...args),
  },
}))

beforeEach(() => {
  submitFeedback.mockReset()
  submitFeedback.mockResolvedValue({ ok: true })
})

const TRIGGER = 'how was this kata? (optional)'

async function openForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: TRIGGER }))
}

describe('FeedbackSection', () => {
  it('renders only the thank-you note when feedback was already submitted', () => {
    render(<FeedbackSection sessionId="s1" alreadySubmitted />)

    expect(screen.getByText('feedback received — thank you.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: TRIGGER })).not.toBeInTheDocument()
    expect(screen.queryByText('quick feedback')).not.toBeInTheDocument()
  })

  it('starts collapsed as an optional trigger, with the form hidden', () => {
    render(<FeedbackSection sessionId="s1" alreadySubmitted={false} />)

    expect(screen.getByRole('button', { name: TRIGGER })).toBeInTheDocument()
    expect(screen.queryByText('quick feedback')).not.toBeInTheDocument()
  })

  it('expands the form with all three questions when the trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" alreadySubmitted={false} />)

    await openForm(user)

    expect(screen.getByText('quick feedback')).toBeInTheDocument()
    expect(screen.getByText('Was the description clear?')).toBeInTheDocument()
    expect(screen.getByText('Was the time limit right?')).toBeInTheDocument()
    expect(screen.getByText('Did the evaluation feel fair?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: TRIGGER })).not.toBeInTheDocument()
  })

  it('keeps send disabled until the user provides at least one signal', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" alreadySubmitted={false} />)
    await openForm(user)

    const send = screen.getByRole('button', { name: 'send' })
    expect(send).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Crystal clear' }))
    expect(send).toBeEnabled()
  })

  it('enables send when only a note is typed (no choices picked)', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" alreadySubmitted={false} />)
    await openForm(user)

    expect(screen.getByRole('button', { name: 'send' })).toBeDisabled()

    await user.type(screen.getByRole('textbox'), 'pacing felt off')
    expect(screen.getByRole('button', { name: 'send' })).toBeEnabled()
  })

  it('treats a whitespace-only note as empty and leaves send disabled', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" alreadySubmitted={false} />)
    await openForm(user)

    await user.type(screen.getByRole('textbox'), '   ')
    expect(screen.getByRole('button', { name: 'send' })).toBeDisabled()
  })

  it('submits the selected choices plus a trimmed note, then shows the thank-you', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="sess-42" alreadySubmitted={false} />)
    await openForm(user)

    await user.click(screen.getByRole('button', { name: 'Confusing' }))
    await user.click(screen.getByRole('button', { name: 'About right' }))
    await user.click(screen.getByRole('button', { name: 'Spot on' }))
    await user.type(screen.getByRole('textbox'), '  too rushed  ')

    await user.click(screen.getByRole('button', { name: 'send' }))

    expect(submitFeedback).toHaveBeenCalledTimes(1)
    expect(submitFeedback).toHaveBeenCalledWith('sess-42', {
      clarity: 'confusing',
      timing: 'about_right',
      evaluation: 'fair_and_relevant',
      note: 'too rushed',
    })
    expect(await screen.findByText('feedback received — thank you.')).toBeInTheDocument()
  })

  it('sends note as null when the user only picked choices', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s9" alreadySubmitted={false} />)
    await openForm(user)

    await user.click(screen.getByRole('button', { name: 'Crystal clear' }))
    await user.click(screen.getByRole('button', { name: 'send' }))

    expect(submitFeedback).toHaveBeenCalledWith('s9', {
      clarity: 'clear',
      timing: null,
      evaluation: null,
      note: null,
    })
  })

  it('caps the note at 280 characters and reflects the count', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" alreadySubmitted={false} />)
    await openForm(user)

    const textbox = screen.getByRole('textbox') as HTMLTextAreaElement
    await user.type(textbox, 'a'.repeat(300))

    expect(textbox.value).toHaveLength(280)
    expect(screen.getByText('280/280')).toBeInTheDocument()
  })

  it('stays on the form and re-enables send when the API call fails', async () => {
    submitFeedback.mockRejectedValueOnce(new Error('network'))
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" alreadySubmitted={false} />)
    await openForm(user)

    await user.click(screen.getByRole('button', { name: 'Crystal clear' }))
    const send = screen.getByRole('button', { name: 'send' })
    await user.click(send)

    expect(submitFeedback).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('feedback received — thank you.')).not.toBeInTheDocument()
    expect(screen.getByText('quick feedback')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'send' })).toBeEnabled()
  })

  it('collapses back to the trigger without submitting when skip is clicked', async () => {
    const user = userEvent.setup()
    render(<FeedbackSection sessionId="s1" alreadySubmitted={false} />)
    await openForm(user)

    await user.click(screen.getByRole('button', { name: 'skip' }))

    expect(submitFeedback).not.toHaveBeenCalled()
    expect(screen.queryByText('quick feedback')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: TRIGGER })).toBeInTheDocument()
  })
})
