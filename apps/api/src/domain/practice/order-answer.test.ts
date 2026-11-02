import { describe, expect, it } from 'vitest'
import { compareOrder, composeOrderAnswer, isValidOrder, orderContextFor, parseOrderAnswer } from './order-answer'

const code = 'b()\na()\nc()\nd()\n'
const rubric = { expectedIssues: [{ title: 't', severity: 'high' as const, why: 'w' }], answer: { shape: 'order' as const, accepted: [[2, 1, 3], [1, 2, 3]] } }

describe('isValidOrder', () => {
  it('accepts distinct lines of the code', () => {
    expect(isValidOrder(code, [4, 2])).toBe(true)
  })

  it.each([
    ['an empty order', []],
    ['a repeated line', [1, 1]],
    ['line 0', [0]],
    ['a line past the end', [5]],
    ['a fractional line', [1.5]],
  ])('rejects %s', (_label, order) => {
    expect(isValidOrder(code, order)).toBe(false)
  })
})

describe('the stored answer', () => {
  it('round-trips the order and the why', () => {
    expect(parseOrderAnswer(composeOrderAnswer([3, 1], '  because.  '))).toEqual({ order: [3, 1], why: 'because.' })
  })

  it('is not read from free prose', () => {
    expect(parseOrderAnswer('I would order them 3, 1')).toBeNull()
  })
})

describe('compareOrder', () => {
  it('matches any accepted order', () => {
    expect(compareOrder(4, rubric.answer.accepted, [1, 2, 3])).toEqual({ matches: true, distractorsUsed: [], missing: [], divergesAt: null })
  })

  it('names the distractor, the missing line and where the order departs', () => {
    expect(compareOrder(4, rubric.answer.accepted, [2, 4, 3])).toEqual({ matches: false, distractorsUsed: [4], missing: [1], divergesAt: 2 })
  })

  it('does not match a prefix of an accepted order', () => {
    expect(compareOrder(4, rubric.answer.accepted, [2, 1])).toMatchObject({ matches: false, missing: [3], divergesAt: 3 })
  })
})

describe('orderContextFor', () => {
  it('gives the sensei the lines and the computed facts', () => {
    const context = orderContextFor(code, rubric, composeOrderAnswer([2, 4, 3], 'b needs a.'))
    expect(context).toMatchObject({ lines: ['b()', 'a()', 'c()', 'd()'], ordered: [2, 4, 3], matches: false, distractorsUsed: [4], why: 'b needs a.' })
  })

  it('is absent for a kata without an order key or an answer in another shape', () => {
    expect(orderContextFor(code, { expectedIssues: rubric.expectedIssues }, composeOrderAnswer([1], 'x'))).toBeUndefined()
    expect(orderContextFor(code, rubric, 'Line 1: b()\n\nwhy')).toBeUndefined()
  })
})
