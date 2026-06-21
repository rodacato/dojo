import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LessonDTO, StepDTO } from '@dojo/shared'

import { LessonNav } from './LessonNav'

function makeStep(over: Partial<StepDTO> & { id: string }): StepDTO {
  return {
    order: 1,
    type: 'read',
    title: null,
    instruction: '',
    starterCode: null,
    testCode: null,
    hint: null,
    hints: null,
    data: null,
    ...over,
  }
}

function makeLesson(over: Partial<LessonDTO> = {}): LessonDTO {
  return {
    id: 'lesson-1',
    order: 1,
    title: 'Closures',
    outcome: null,
    steps: [
      makeStep({ id: 's1', order: 1, type: 'read', title: 'Intro' }),
      makeStep({ id: 's2', order: 2, type: 'challenge', title: 'First challenge' }),
      makeStep({ id: 's3', order: 3, type: 'predict', title: 'Guess output' }),
    ],
    ...over,
  }
}

describe('LessonNav', () => {
  it('renders the zero-padded lesson number and title in the header', () => {
    render(
      <LessonNav
        lesson={makeLesson()}
        index={3}
        activeStepId={null}
        completedSteps={[]}
        onSelectStep={vi.fn()}
      />,
    )
    const header = screen.getByRole('button', { name: /Closures/ })
    expect(header).toHaveTextContent('03 ·')
    expect(header).toHaveTextContent('Closures')
  })

  it('shows the done/total progress count from completedSteps', () => {
    render(
      <LessonNav
        lesson={makeLesson()}
        index={1}
        activeStepId={null}
        completedSteps={['s1', 's3']}
        onSelectStep={vi.fn()}
      />,
    )
    const header = screen.getByRole('button', { name: /Closures/ })
    expect(header).toHaveTextContent('2/3')
  })

  it('counts only steps that belong to this lesson, ignoring unrelated ids', () => {
    render(
      <LessonNav
        lesson={makeLesson()}
        index={1}
        activeStepId={null}
        completedSteps={['s1', 'other-lesson-step', 'ghost']}
        onSelectStep={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /Closures/ })).toHaveTextContent('1/3')
  })

  it('marks the progress count as success styled only when every step is done', () => {
    const lesson = makeLesson()
    const { rerender } = render(
      <LessonNav
        lesson={lesson}
        index={1}
        activeStepId={null}
        completedSteps={['s1', 's2']}
        onSelectStep={vi.fn()}
      />,
    )
    expect(screen.getByText('2/3')).toHaveClass('text-muted')
    expect(screen.getByText('2/3')).not.toHaveClass('text-success')

    rerender(
      <LessonNav
        lesson={lesson}
        index={1}
        activeStepId={null}
        completedSteps={['s1', 's2', 's3']}
        onSelectStep={vi.fn()}
      />,
    )
    expect(screen.getByText('3/3')).toHaveClass('text-success')
  })

  it('lists each step with its title and type label', () => {
    render(
      <LessonNav
        lesson={makeLesson()}
        index={1}
        activeStepId={null}
        completedSteps={[]}
        onSelectStep={vi.fn()}
      />,
    )
    // 1 header + 3 step rows
    expect(screen.getAllByRole('button')).toHaveLength(4)
    expect(screen.getByText('Intro')).toBeInTheDocument()
    expect(screen.getByText('First challenge')).toBeInTheDocument()
    // type labels come from stepMeta.stepTypeLabel
    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.getByText('Challenge')).toBeInTheDocument()
    expect(screen.getByText('Predict')).toBeInTheDocument()
  })

  it('collapses and re-expands the step list when the header is toggled', async () => {
    const user = userEvent.setup()
    render(
      <LessonNav
        lesson={makeLesson()}
        index={1}
        activeStepId={null}
        completedSteps={[]}
        onSelectStep={vi.fn()}
      />,
    )
    const header = screen.getByRole('button', { name: /Closures/ })
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Intro')).toBeInTheDocument()

    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Intro')).not.toBeInTheDocument()

    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Intro')).toBeInTheDocument()
  })

  it('fires onSelectStep with the clicked step id', async () => {
    const user = userEvent.setup()
    const onSelectStep = vi.fn()
    render(
      <LessonNav
        lesson={makeLesson()}
        index={1}
        activeStepId={null}
        completedSteps={[]}
        onSelectStep={onSelectStep}
      />,
    )
    await user.click(screen.getByText('First challenge'))
    expect(onSelectStep).toHaveBeenCalledTimes(1)
    expect(onSelectStep).toHaveBeenCalledWith('s2')
  })

  it('renders the right status icon per step: complete, active, or pending', () => {
    render(
      <LessonNav
        lesson={makeLesson()}
        index={1}
        activeStepId="s2"
        completedSteps={['s1']}
        onSelectStep={vi.fn()}
      />,
    )
    const rowComplete = screen.getByText('Intro').closest('button')!
    const rowActive = screen.getByText('First challenge').closest('button')!
    const rowPending = screen.getByText('Guess output').closest('button')!

    expect(within(rowComplete).getByText('✓')).toBeInTheDocument()
    expect(within(rowActive).getByText('▸')).toBeInTheDocument()
    expect(within(rowPending).getByText('○')).toBeInTheDocument()
  })

  it('applies active styling to the row matching activeStepId', () => {
    render(
      <LessonNav
        lesson={makeLesson()}
        index={1}
        activeStepId="s3"
        completedSteps={[]}
        onSelectStep={vi.fn()}
      />,
    )
    const activeRow = screen.getByText('Guess output').closest('button')!
    const inactiveRow = screen.getByText('Intro').closest('button')!
    expect(activeRow).toHaveClass('border-accent')
    expect(inactiveRow).toHaveClass('border-transparent')
    expect(inactiveRow).not.toHaveClass('border-accent')
  })

  it('falls back to the instruction H1 when a step has no explicit title', () => {
    const lesson = makeLesson({
      steps: [
        makeStep({
          id: 's1',
          order: 1,
          type: 'read',
          title: null,
          instruction: '# Hoisting explained\n\nbody',
        }),
      ],
    })
    render(
      <LessonNav
        lesson={lesson}
        index={1}
        activeStepId={null}
        completedSteps={[]}
        onSelectStep={vi.fn()}
      />,
    )
    expect(screen.getByText('Hoisting explained')).toBeInTheDocument()
  })
})
