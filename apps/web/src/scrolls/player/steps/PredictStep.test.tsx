import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { StepDTO } from '@dojo/shared'

import { PredictStep } from './PredictStep'
import type { StepComponentProps } from './types'

type PredictData = {
  snippet: string
  options: { id: string; text: string }[]
  correct: string
  feedback: Record<string, string>
}

function makeStep(overrides: Partial<StepDTO> = {}, data: PredictData | null = defaultData()): StepDTO {
  return {
    id: 'step-1',
    order: 2,
    type: 'predict',
    title: 'What prints',
    instruction: '# What prints\n\nReason about the output before running.',
    starterCode: null,
    testCode: null,
    hint: null,
    hints: null,
    data: data as StepDTO['data'],
    ...overrides,
  }
}

function defaultData(): PredictData {
  return {
    snippet: 'console.log(typeof null)',
    options: [
      { id: 'a', text: '"object"' },
      { id: 'b', text: '"null"' },
      { id: 'c', text: '"undefined"' },
    ],
    correct: 'a',
    feedback: {
      a: 'Right — typeof null is a historical wart that returns "object".',
      b: 'A common guess, but typeof never returns "null".',
      c: 'null is not undefined; they are distinct primitives.',
    },
  }
}

function renderStep(props: Partial<StepComponentProps> = {}, step = makeStep()) {
  const onMarkComplete = vi.fn()
  const onAdvance = vi.fn()
  render(
    <PredictStep
      step={step}
      scrollSlug="js-basics"
      language="javascript"
      isCompleted={false}
      onMarkComplete={onMarkComplete}
      onAdvance={onAdvance}
      {...props}
    />,
  )
  return { onMarkComplete, onAdvance }
}

describe('PredictStep', () => {
  it('renders an error and no options when the data payload is missing', () => {
    renderStep({}, makeStep({}, null))
    expect(screen.getByText(/missing required `data` payload/i)).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('renders the title, snippet, and one radio per option labeled A/B/C', () => {
    renderStep()
    expect(screen.getByRole('heading', { name: 'What prints' })).toBeInTheDocument()
    expect(screen.getByText('console.log(typeof null)')).toBeInTheDocument()

    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(3)
    // Pre-reveal each option shows its letter affordance, not a verdict icon.
    expect(options[0]).toHaveTextContent('A')
    expect(options[1]).toHaveTextContent('B')
    expect(options[2]).toHaveTextContent('C')
    options.forEach((o) => expect(o).toHaveAttribute('aria-checked', 'false'))
  })

  it('keeps Continue disabled and shows the hint prompt until an answer is picked', () => {
    renderStep()
    expect(screen.getByRole('button', { name: /Continue/ })).toBeDisabled()
    expect(screen.getByText(/Pick an answer to reveal the explanation/i)).toBeInTheDocument()
  })

  it('reveals the distractor-specific feedback when a WRONG option is chosen', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getByRole('radio', { name: /"null"/ }))

    expect(screen.getByText('Not quite')).toBeInTheDocument()
    // Load-bearing: the wrong-answer voice addresses the chosen distractor,
    // not the right answer in the abstract.
    expect(
      screen.getByText('A common guess, but typeof never returns "null".'),
    ).toBeInTheDocument()
    // The correct option is still surfaced as correct even though unselected.
    const correctOption = screen.getByRole('radio', { name: /"object"/ })
    expect(correctOption).toHaveTextContent('✓')
    // The chosen wrong option is flagged.
    expect(screen.getByRole('radio', { name: /"null"/ })).toHaveTextContent('✗')
  })

  it('reveals the correct verdict and feedback when the RIGHT option is chosen', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getByRole('radio', { name: /"object"/ }))

    expect(screen.getByText('Correct')).toBeInTheDocument()
    expect(
      screen.getByText(/typeof null is a historical wart/),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /"object"/ })).toHaveTextContent('✓')
  })

  it('locks all options after a selection so the prediction cannot be changed', async () => {
    const user = userEvent.setup()
    renderStep()

    await user.click(screen.getByRole('radio', { name: /"null"/ }))

    screen.getAllByRole('radio').forEach((o) => expect(o).toBeDisabled())

    // Clicking a different option after reveal does not move the verdict.
    await user.click(screen.getByRole('radio', { name: /"undefined"/ }))
    expect(screen.getByText('Not quite')).toBeInTheDocument()
    expect(
      screen.getByText('A common guess, but typeof never returns "null".'),
    ).toBeInTheDocument()
  })

  it('marks complete and advances when Continue is pressed after reveal', async () => {
    const user = userEvent.setup()
    const { onMarkComplete, onAdvance } = renderStep()

    await user.click(screen.getByRole('radio', { name: /"object"/ }))
    const cont = screen.getByRole('button', { name: /Continue/ })
    expect(cont).toBeEnabled()

    await user.click(cont)
    expect(onMarkComplete).toHaveBeenCalledTimes(1)
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('advances without re-marking complete when the step is already completed', async () => {
    const user = userEvent.setup()
    const { onMarkComplete, onAdvance } = renderStep({ isCompleted: true })

    expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /"object"/ }))
    await user.click(screen.getByRole('button', { name: /Next/ }))

    expect(onMarkComplete).not.toHaveBeenCalled()
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('moves focus between options with arrow keys without committing a selection', async () => {
    const user = userEvent.setup()
    const { onAdvance } = renderStep()

    const radios = screen.getAllByRole('radio')
    const first = radios[0]!
    const second = radios[1]!
    first.focus()
    await user.keyboard('{ArrowDown}')

    expect(second).toHaveFocus()
    // Arrow navigation must not reveal — Continue stays disabled, no advance.
    expect(screen.queryByText('Correct')).not.toBeInTheDocument()
    expect(screen.queryByText('Not quite')).not.toBeInTheDocument()
    expect(onAdvance).not.toHaveBeenCalled()
  })
})
