import { describe, expect, it } from 'vitest'
import { buildMessages, type BuildMessagesParams } from './sensei-evaluation'

const base: BuildMessagesParams = {
  ownerRole: 'Senior backend engineer',
  ownerContext: 'Credit a why that names the cause.',
  kataTitle: 'Off-by-one in pagination',
  sessionBody: 'Pages are 1-based.',
  userResponse: 'Line 4: const end = start + limit\n\nThe end is wrong.',
  history: [],
  rubric: {
    expectedIssues: [{ title: 'start treats a 1-based page as 0-based', severity: 'high', why: 'page 1 is skipped' }],
    answer: { shape: 'point', line: 3 },
  },
}

const code = 'function paginate(items, page, limit) {\n  if (page < 1) return []\n  const start = page * limit\n  const end = start + limit\n}\n'

describe('buildMessages', () => {
  it('tells the sensei a wrong tap as a fact, with the numbered code and the why', () => {
    const [message] = buildMessages({
      ...base,
      point: { code, correctLine: 3, pointedLine: 4, why: 'The end is wrong.' },
    })
    expect(message!.content).toContain('The developer tapped line 4. The bug is on line 3, so the tap is wrong.')
    expect(message!.content).toContain('  3 |   const start = page * limit')
    expect(message!.content).toContain('The end is wrong.')
  })

  it('tells the sensei a correct tap as a fact', () => {
    const [message] = buildMessages({
      ...base,
      point: { code, correctLine: 3, pointedLine: 3, why: 'page 1 starts at limit.' },
    })
    expect(message!.content).toContain('The developer tapped line 3. That is the correct line.')
  })

  it('keeps the code review prompt for a review kata without a point', () => {
    const [message] = buildMessages({ ...base, rubric: { expectedIssues: base.rubric!.expectedIssues } })
    expect(message!.content).toContain("THE DEVELOPER'S REVIEW:")
    expect(message!.content).not.toContain('THE TAP')
  })
})
