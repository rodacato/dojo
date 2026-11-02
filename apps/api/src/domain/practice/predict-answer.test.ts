import { describe, expect, it } from 'vitest'
import type { Rubric } from '@dojo/shared'
import { composePredictAnswer, isValidPrediction, normalizeOutput, parsePredictAnswer, predictContextFor } from './predict-answer'

const rubric: Rubric = {
  expectedIssues: [{ title: 'order', severity: 'high', why: 'sync first' }],
  answer: { shape: 'predict', output: 'start\nend\n' },
}

describe('normalizeOutput', () => {
  it('ignores line endings, whitespace at line ends and blank lines around the output', () => {
    expect(normalizeOutput('\nstart  \r\nend\t\r\n\n')).toBe('start\nend')
  })

  it('keeps indentation and blank lines inside the output', () => {
    expect(normalizeOutput('a\n\n  b')).toBe('a\n\n  b')
  })
})

describe('isValidPrediction', () => {
  it.each([
    ['blank', ' \n ', false],
    ['a fence that would end the stored answer', 'a\n```', false],
    ['too long', 'x'.repeat(2001), false],
    ['one line', 'start', true],
  ])('%s → %s', (_label, output, valid) => {
    expect(isValidPrediction(output)).toBe(valid)
  })
})

describe('predictContextFor', () => {
  it('matches a prediction that differs only in whitespace', () => {
    const stored = composePredictAnswer('start   \r\nend', 'sync code runs first')
    expect(predictContextFor('code', rubric, stored)).toEqual({
      code: 'code',
      expected: 'start\nend',
      predicted: 'start\nend',
      matches: true,
      why: 'sync code runs first',
    })
  })

  it('does not match a prediction in another order', () => {
    const stored = composePredictAnswer('end\nstart', 'why')
    expect(predictContextFor('code', rubric, stored)?.matches).toBe(false)
  })

  it('reads the output and the why back from the stored answer', () => {
    expect(parsePredictAnswer(composePredictAnswer('a\n\nb', '  because  '))).toEqual({ output: 'a\n\nb', why: 'because' })
  })

  it('is nothing for a kata that is not a predict kata', () => {
    const point: Rubric = { ...rubric, answer: { shape: 'point', line: 1 } }
    expect(predictContextFor('code', point, composePredictAnswer('a', 'b'))).toBeUndefined()
  })
})
