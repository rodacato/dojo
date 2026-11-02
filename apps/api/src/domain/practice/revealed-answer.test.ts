import { describe, expect, it } from 'vitest'
import { revealedAnswer } from './revealed-answer'

const issue = { title: 'order', severity: 'high' as const, why: 'sync first' }

describe('revealedAnswer', () => {
  it('reveals the line of a point kata', () => {
    expect(revealedAnswer({ expectedIssues: [issue], answer: { shape: 'point', line: 3 } })).toEqual({ shape: 'point', line: 3, title: 'order', why: 'sync first' })
  })

  it('reveals the normalized output of a predict kata', () => {
    expect(revealedAnswer({ expectedIssues: [issue], answer: { shape: 'predict', output: 'a  \nb\n' } })).toEqual({
      shape: 'predict',
      output: 'a\nb',
      title: 'order',
      why: 'sync first',
    })
  })

  it('reveals nothing for a rubric without an answer key', () => {
    expect(revealedAnswer({ expectedIssues: [issue] })).toBeNull()
  })
})
