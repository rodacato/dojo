import { describe, it, expect } from 'vitest'
import type { StepDTO } from '@dojo/shared'
import { STEP_RENDERERS } from '../steps/StepContent'
import { extractStepTitle, stepTypeLabel } from '../steps/stepMeta'

const ALL_STEP_TYPES: StepDTO['type'][] = ['read', 'code', 'exercise', 'challenge', 'predict']

describe('STEP_RENDERERS', () => {
  it('registers a callable renderer for every step type', () => {
    for (const type of ALL_STEP_TYPES) {
      expect(STEP_RENDERERS[type], `missing renderer for "${type}"`).toBeTypeOf('function')
    }
  })
})

describe('stepTypeLabel', () => {
  it('labels every step type', () => {
    for (const type of ALL_STEP_TYPES) {
      expect(stepTypeLabel(type)).toBeTruthy()
    }
  })
})

describe('extractStepTitle', () => {
  const base = {
    id: 's1',
    order: 3,
    instruction: '',
    starterCode: null,
    testCode: null,
    hint: null,
    data: null,
  }

  it('prefers the explicit title field', () => {
    const step = { ...base, type: 'code', title: 'Sum two numbers', instruction: '# Other' }
    expect(extractStepTitle(step as StepDTO)).toBe('Sum two numbers')
  })

  it('falls back to the first H1 and strips the type prefix', () => {
    const step = { ...base, type: 'code', title: null, instruction: '# kata: Sum two numbers\n\nBody' }
    expect(extractStepTitle(step as StepDTO)).toBe('Sum two numbers')
  })

  it('falls back to the ordinal when there is no title source', () => {
    const step = { ...base, type: 'code', title: null, instruction: 'no heading here' }
    expect(extractStepTitle(step as StepDTO)).toBe('Step 3')
  })

  it('labels bare read steps as Read', () => {
    const step = { ...base, type: 'read', title: null, instruction: 'plain prose' }
    expect(extractStepTitle(step as StepDTO)).toBe('Read')
  })
})
