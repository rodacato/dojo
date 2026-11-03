import { describe, expect, it } from 'vitest'
import { artifactOf, composePointAnswer, isLineInCode, parsePointAnswer, pointContextFor } from './point-answer'

const CODE = 'def add_tag(tag, tags=[]):\n    tags.append(tag)\n    return tags\n'
const RUBRIC = {
  expectedIssues: [{ title: 'Shared default', severity: 'high' as const, why: 'evaluated once' }],
  answer: { shape: 'point' as const, line: 1 },
}

describe('point answers', () => {
  it('reads back the line and a multi-paragraph why it composed', () => {
    const stored = composePointAnswer(CODE, 2, 'It appends to the shared list.\n\nEvery call sees it.')
    expect(stored).toBe('Line 2: tags.append(tag)\n\nIt appends to the shared list.\n\nEvery call sees it.')
    expect(parsePointAnswer(stored)).toEqual({ line: 2, why: 'It appends to the shared list.\n\nEvery call sees it.' })
  })

  it('does not count the trailing newline as a line', () => {
    expect(isLineInCode(CODE, 3)).toBe(true)
    expect(isLineInCode(CODE, 4)).toBe(false)
    expect(isLineInCode(CODE, 0)).toBe(false)
  })

  it('gives the sensei the tapped and the correct line for a point kata', () => {
    const stored = composePointAnswer(CODE, 2, 'why')
    expect(pointContextFor(CODE, RUBRIC, stored)).toEqual({ code: CODE, correctLine: 1, acceptedLines: [1], pointedLine: 2, why: 'why', artifact: undefined })
  })

  it('accepts every equally right line and names the artifact the kata shows', () => {
    const rubric = { ...RUBRIC, answer: { shape: 'point' as const, line: 1, also: [3] } }
    expect(pointContextFor(CODE, rubric, composePointAnswer(CODE, 3, 'why'), ['stacktrace'])).toMatchObject({
      correctLine: 1,
      acceptedLines: [1, 3],
      artifact: 'stacktrace',
    })
  })

  it('reads an artifact only from a known kind, never from a programming language', () => {
    expect(artifactOf(['query-plan'])).toBe('query-plan')
    expect(artifactOf(['typescript'])).toBeUndefined()
    expect(artifactOf([])).toBeUndefined()
  })

  it('gives no point context to a review kata without an answer key, or to free text', () => {
    expect(pointContextFor(CODE, { expectedIssues: RUBRIC.expectedIssues }, composePointAnswer(CODE, 1, 'why'))).toBeUndefined()
    expect(pointContextFor(CODE, RUBRIC, 'a free-text review')).toBeUndefined()
  })
})
