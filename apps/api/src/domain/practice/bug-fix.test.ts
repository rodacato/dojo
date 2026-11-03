import { describe, expect, it } from 'vitest'
import { gatedResult, isBugFixKata, testsPassed } from './bug-fix'
import type { EvaluationResult } from './values'

const passedResult: EvaluationResult = {
  verdict: 'passed',
  analysis: 'Clean fix.',
  topicsToReview: [],
  followUpQuestion: 'Why does slice not help?',
  isFinalEvaluation: false,
}

describe('isBugFixKata', () => {
  it('is a debugging code kata with tests', () => {
    expect(isBugFixKata({ type: 'code', category: 'debugging', testCode: 'assert(1)' })).toBe(true)
  })

  it.each([
    ['without tests', { type: 'code', category: 'debugging', testCode: null }],
    ['in another category', { type: 'code', category: 'algorithms', testCode: 'assert(1)' }],
    ['answered by pointing', { type: 'review', category: 'debugging', testCode: 'assert(1)' }],
  ])('is not a kata %s', (_label, kata) => {
    expect(isBugFixKata(kata)).toBe(false)
  })
})

describe('testsPassed', () => {
  const run = { stdout: '', stderr: '', exitCode: 0, timedOut: false, outputExceeded: false, runTimeoutMs: 3000, executionTimeMs: 4 }

  it('passes on exit code 0 only', () => {
    expect(testsPassed(run)).toBe(true)
    expect(testsPassed({ ...run, exitCode: 1 })).toBe(false)
    expect(testsPassed({ ...run, timedOut: true })).toBe(false)
    expect(testsPassed({ ...run, failure: 'compile' })).toBe(false)
  })
})

describe('gatedResult', () => {
  it('turns any verdict on failing tests into a final needs_work, with no follow-up', () => {
    expect(gatedResult(passedResult, { testsPassed: false })).toEqual({
      ...passedResult,
      verdict: 'needs_work',
      followUpQuestion: null,
      isFinalEvaluation: true,
    })
  })

  it('leaves the result alone when the tests pass or the kata has no gate', () => {
    expect(gatedResult(passedResult, { testsPassed: true })).toBe(passedResult)
    expect(gatedResult(passedResult)).toBe(passedResult)
  })
})
