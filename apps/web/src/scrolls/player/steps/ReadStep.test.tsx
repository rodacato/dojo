import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { StepDTO } from '@dojo/shared'

import { ReadStep } from './ReadStep'
import type { StepComponentProps } from './types'

vi.mock('../markdown', () => ({
  MarkdownContent: ({ content }: { content: string }) => (
    <div data-testid="markdown">{content}</div>
  ),
}))

function makeStep(overrides: Partial<StepDTO> = {}): StepDTO {
  return {
    id: 'step-1',
    order: 0,
    type: 'read',
    title: 'Intro',
    instruction: 'Read me carefully.',
    starterCode: null,
    testCode: null,
    hint: null,
    hints: null,
    data: null,
    ...overrides,
  }
}

function setup(overrides: Partial<StepComponentProps> = {}) {
  const onMarkComplete = vi.fn()
  const onAdvance = vi.fn()
  const props: StepComponentProps = {
    step: makeStep(),
    scrollSlug: 'binary-search',
    language: 'python',
    isCompleted: false,
    onMarkComplete,
    onAdvance,
    ...overrides,
  }
  render(<ReadStep {...props} />)
  return { onMarkComplete, onAdvance, props }
}

describe('ReadStep', () => {
  it('renders the step instruction through MarkdownContent', () => {
    setup({ step: makeStep({ instruction: 'The heap invariant holds.' }) })
    expect(screen.getByTestId('markdown')).toHaveTextContent('The heap invariant holds.')
  })

  it('labels the button "Continue →" when the step is not yet completed', () => {
    setup({ isCompleted: false })
    expect(screen.getByRole('button', { name: 'Continue →' })).toBeInTheDocument()
  })

  it('labels the button "Next →" once the step is completed', () => {
    setup({ isCompleted: true })
    expect(screen.getByRole('button', { name: 'Next →' })).toBeInTheDocument()
  })

  it('marks complete and advances when an uncompleted step is continued', async () => {
    const user = userEvent.setup()
    const { onMarkComplete, onAdvance } = setup({ isCompleted: false })

    await user.click(screen.getByRole('button', { name: 'Continue →' }))

    expect(onMarkComplete).toHaveBeenCalledTimes(1)
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('only advances (never re-marks) when an already-completed step is clicked', async () => {
    const user = userEvent.setup()
    const { onMarkComplete, onAdvance } = setup({ isCompleted: true })

    await user.click(screen.getByRole('button', { name: 'Next →' }))

    expect(onMarkComplete).not.toHaveBeenCalled()
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })
})
