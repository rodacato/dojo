import type { StepDTO } from '@dojo/shared'
import { describe, expect, it } from 'vitest'
import { extractStepTitle, stepTypeLabel } from './stepMeta'

function makeStep(overrides: Partial<StepDTO>): StepDTO {
  return {
    id: 's1',
    order: 1,
    type: 'read',
    title: null,
    instruction: '',
    starterCode: null,
    testCode: null,
    hint: null,
    hints: null,
    data: null,
    ...overrides,
  }
}

describe('stepTypeLabel', () => {
  it('maps each DTO step type to its display label', () => {
    expect(stepTypeLabel('read')).toBe('Read')
    expect(stepTypeLabel('read+inline')).toBe('Read+')
    expect(stepTypeLabel('challenge')).toBe('Challenge')
    expect(stepTypeLabel('exercise')).toBe('Exercise')
    expect(stepTypeLabel('code')).toBe('Code')
    expect(stepTypeLabel('predict')).toBe('Predict')
  })

  it('labels the legacy "kata" DB value not present in the DTO union', () => {
    expect(stepTypeLabel('kata' as StepDTO['type'])).toBe('Kata')
  })
})

describe('extractStepTitle', () => {
  it('prefers the explicit step.title, trimmed', () => {
    const step = makeStep({ title: '  Closures  ', instruction: '# Body H1' })
    expect(extractStepTitle(step)).toBe('Closures')
  })

  it('falls back to the first H1 in the instruction when title is blank', () => {
    const step = makeStep({ title: '   ', instruction: 'intro\n# Recursion\nmore' })
    expect(extractStepTitle(step)).toBe('Recursion')
  })

  it('strips legacy type prefixes from the H1 fallback', () => {
    const step = makeStep({ title: null, instruction: '# Challenge: Binary Search' })
    expect(extractStepTitle(step)).toBe('Binary Search')
  })

  it('defaults to "Read" for read steps without a title or H1', () => {
    const step = makeStep({ type: 'read', title: null, instruction: 'plain body' })
    expect(extractStepTitle(step)).toBe('Read')
  })

  it('falls back to the step ordinal for non-read steps without a title or H1', () => {
    const step = makeStep({ type: 'code', title: null, instruction: 'no heading', order: 4 })
    expect(extractStepTitle(step)).toBe('Step 4')
  })
})
