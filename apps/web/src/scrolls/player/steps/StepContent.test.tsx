import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { StepDTO } from '@dojo/shared'
import type { StepComponentProps } from './types'

// Mock every child renderer so we test only StepContent's dispatch logic:
// each one renders a stable testid + echoes the step type it received.
vi.mock('./ReadStep', () => ({
  ReadStep: (p: StepComponentProps) => <div data-testid="read">{p.step.type}</div>,
}))
vi.mock('./ReadInlineStep', () => ({
  ReadInlineStep: (p: StepComponentProps) => <div data-testid="read-inline">{p.step.type}</div>,
}))
vi.mock('./PredictStep', () => ({
  PredictStep: (p: StepComponentProps) => <div data-testid="predict">{p.step.type}</div>,
}))
vi.mock('./StepEditor', () => ({
  StepEditor: (p: StepComponentProps) => (
    <div data-testid="editor" data-slug={p.scrollSlug}>
      {p.step.type}
    </div>
  ),
}))

import { StepContent, STEP_RENDERERS } from './StepContent'

function makeStep(type: string): StepDTO {
  return {
    id: 's1',
    order: 0,
    type: type as StepDTO['type'],
    title: null,
    instruction: 'do the thing',
    starterCode: null,
    testCode: null,
    hint: null,
    hints: null,
    data: null,
  }
}

function makeProps(type: string): StepComponentProps {
  return {
    step: makeStep(type),
    scrollSlug: 'binary-search',
    language: 'python',
    isCompleted: false,
    onMarkComplete: vi.fn(),
    onAdvance: vi.fn(),
  }
}

describe('StepContent', () => {
  it('routes read to ReadStep', () => {
    render(<StepContent {...makeProps('read')} />)
    expect(screen.getByTestId('read')).toBeInTheDocument()
    expect(screen.queryByTestId('editor')).not.toBeInTheDocument()
  })

  it('routes read+inline to ReadInlineStep', () => {
    render(<StepContent {...makeProps('read+inline')} />)
    expect(screen.getByTestId('read-inline')).toBeInTheDocument()
  })

  it('routes predict to PredictStep', () => {
    render(<StepContent {...makeProps('predict')} />)
    expect(screen.getByTestId('predict')).toBeInTheDocument()
  })

  it.each(['code', 'exercise', 'challenge'])('routes %s to StepEditor', (type) => {
    render(<StepContent {...makeProps(type)} />)
    expect(screen.getByTestId('editor')).toBeInTheDocument()
  })

  it('falls back to StepEditor for unknown/legacy step types (e.g. kata)', () => {
    render(<StepContent {...makeProps('kata')} />)
    // The else-branch: nothing in the Record matched but we still render the editor.
    expect(screen.getByTestId('editor')).toBeInTheDocument()
    expect(screen.getByText('kata')).toBeInTheDocument()
  })

  it('passes the full props through to the chosen renderer', () => {
    render(<StepContent {...makeProps('code')} />)
    expect(screen.getByTestId('editor')).toHaveAttribute('data-slug', 'binary-search')
  })

  it('exposes an exhaustive renderer map over the DTO step types', () => {
    expect(Object.keys(STEP_RENDERERS).sort()).toEqual(
      ['challenge', 'code', 'exercise', 'predict', 'read', 'read+inline'].sort(),
    )
  })
})
