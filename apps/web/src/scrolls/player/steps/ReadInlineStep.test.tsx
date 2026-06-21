import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReadInlineInteraction, StepDTO } from '@dojo/shared'

import { ReadInlineStep } from './ReadInlineStep'

function makeStep(
  instruction: string,
  interactions: ReadInlineInteraction[],
): StepDTO {
  return {
    id: 'step-1',
    order: 1,
    type: 'read+inline',
    title: 'Inline read',
    instruction,
    starterCode: null,
    testCode: null,
    hint: null,
    hints: null,
    data: { interactions },
  }
}

function renderStep(
  step: StepDTO,
  overrides: Partial<{
    isCompleted: boolean
    onMarkComplete: () => void
    onAdvance: () => void
  }> = {},
) {
  const onMarkComplete = overrides.onMarkComplete ?? vi.fn()
  const onAdvance = overrides.onAdvance ?? vi.fn()
  render(
    <ReadInlineStep
      step={step}
      scrollSlug="ruby-basics"
      language="ruby"
      isCompleted={overrides.isCompleted ?? false}
      onMarkComplete={onMarkComplete}
      onAdvance={onAdvance}
    />,
  )
  return { onMarkComplete, onAdvance }
}

const reveal: ReadInlineInteraction = {
  kind: 'reveal',
  after: 'r1',
  prompt: 'Why is this slow?',
  answer: 'Because it allocates on every call.',
}

const quiz: ReadInlineInteraction = {
  kind: 'micro-quiz',
  after: 'q1',
  question: 'Which is O(1)?',
  options: ['array push', 'array unshift'],
  correct: 0,
  feedback: ['Right — push is amortized O(1).', 'Nope — unshift is O(n).'],
}

describe('ReadInlineStep', () => {
  it('renders the prose around a marker and routes the interaction inline', () => {
    const step = makeStep('Intro paragraph.\n<!-- interact:r1 -->\nOutro paragraph.', [
      reveal,
    ])
    renderStep(step)

    expect(screen.getByText(/Intro paragraph/)).toBeInTheDocument()
    expect(screen.getByText(/Outro paragraph/)).toBeInTheDocument()
    // reveal routes to a collapsible button carrying the prompt
    expect(screen.getByRole('button', { name: /Why is this slow/ })).toBeInTheDocument()
  })

  describe('continue / next button', () => {
    it('marks complete THEN advances when the step is not yet completed', async () => {
      const user = userEvent.setup()
      const order: string[] = []
      const onMarkComplete = vi.fn(() => order.push('mark'))
      const onAdvance = vi.fn(() => order.push('advance'))
      const step = makeStep('Read this.', [])
      renderStep(step, { isCompleted: false, onMarkComplete, onAdvance })

      const btn = screen.getByRole('button', { name: /Continue/ })
      await user.click(btn)

      expect(onMarkComplete).toHaveBeenCalledTimes(1)
      expect(onAdvance).toHaveBeenCalledTimes(1)
      expect(order).toEqual(['mark', 'advance'])
    })

    it('only advances (never re-marks) when already completed', async () => {
      const user = userEvent.setup()
      const onMarkComplete = vi.fn()
      const onAdvance = vi.fn()
      const step = makeStep('Read this.', [])
      renderStep(step, { isCompleted: true, onMarkComplete, onAdvance })

      const btn = screen.getByRole('button', { name: /Next/ })
      await user.click(btn)

      expect(onMarkComplete).not.toHaveBeenCalled()
      expect(onAdvance).toHaveBeenCalledTimes(1)
    })
  })

  describe('Reveal', () => {
    it('hides the answer until clicked, then toggles it back hidden', async () => {
      const user = userEvent.setup()
      const step = makeStep('Lead.\n<!-- interact:r1 -->', [reveal])
      renderStep(step)

      const toggle = screen.getByRole('button', { name: /Why is this slow/ })
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(/allocates on every call/)).not.toBeInTheDocument()

      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText(/allocates on every call/)).toBeInTheDocument()

      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText(/allocates on every call/)).not.toBeInTheDocument()
    })
  })

  describe('MicroQuiz', () => {
    it('reveals feedback and locks the options after a pick', async () => {
      const user = userEvent.setup()
      const step = makeStep('Setup.\n<!-- interact:q1 -->', [quiz])
      renderStep(step)

      expect(screen.getByText(/Which is O\(1\)/)).toBeInTheDocument()
      // no feedback before answering
      expect(screen.queryByText(/amortized O\(1\)/)).not.toBeInTheDocument()

      const wrong = screen.getByRole('button', { name: /array unshift/ })
      await user.click(wrong)

      // picked the wrong one → its feedback shows
      expect(screen.getByText(/unshift is O\(n\)/)).toBeInTheDocument()
      // both option buttons are now disabled (answered state)
      expect(screen.getByRole('button', { name: /array push/ })).toBeDisabled()
      expect(wrong).toBeDisabled()
    })

    it('shows the correct-option feedback when the right answer is picked', async () => {
      const user = userEvent.setup()
      const step = makeStep('Setup.\n<!-- interact:q1 -->', [quiz])
      renderStep(step)

      await user.click(screen.getByRole('button', { name: /array push/ }))

      expect(screen.getByText(/amortized O\(1\)/)).toBeInTheDocument()
      expect(screen.queryByText(/unshift is O\(n\)/)).not.toBeInTheDocument()
    })
  })

  it('renders an orphan interaction (typo marker) at the end instead of dropping it', () => {
    // marker id never matches the interaction `after` → degrades visibly
    const step = makeStep('Body with a typo.\n<!-- interact:WRONG -->', [reveal])
    renderStep(step)

    expect(screen.getByText(/Body with a typo/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Why is this slow/ })).toBeInTheDocument()
  })
})
