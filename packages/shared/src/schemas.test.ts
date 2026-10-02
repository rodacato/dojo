import { describe, expect, it } from 'vitest'
import {
  difficultySchema,
  kataTypeSchema,
  kataStatusSchema,
  sessionStatusSchema,
  verdictSchema,
  rubricSeveritySchema,
  rubricIssueSchema,
  rubricSchema,
  userDTOSchema,
  kataDTOSchema,
  variationDTOSchema,
  sessionDTOSchema,
  attemptDTOSchema,
  claritySignalSchema,
  timingSignalSchema,
  evaluationSignalSchema,
  feedbackSubmitSchema,
  userLevelSchema,
  kataFiltersSchema,
  beltRankSchema,
  beltDTOSchema,
  milestoneDTOSchema,
} from './schemas'

const UUID = '00000000-0000-4000-8000-000000000000'
const ISO = '2026-06-20T12:00:00.000Z'

describe('enum schemas', () => {
  const cases = [
    { name: 'difficultySchema', schema: difficultySchema, valid: 'easy' },
    { name: 'kataTypeSchema', schema: kataTypeSchema, valid: 'code' },
    { name: 'kataStatusSchema', schema: kataStatusSchema, valid: 'published' },
    { name: 'sessionStatusSchema', schema: sessionStatusSchema, valid: 'active' },
    { name: 'verdictSchema', schema: verdictSchema, valid: 'passed' },
    { name: 'rubricSeveritySchema', schema: rubricSeveritySchema, valid: 'high' },
    { name: 'claritySignalSchema', schema: claritySignalSchema, valid: 'clear' },
    { name: 'timingSignalSchema', schema: timingSignalSchema, valid: 'about_right' },
    { name: 'evaluationSignalSchema', schema: evaluationSignalSchema, valid: 'fair_and_relevant' },
    { name: 'userLevelSchema', schema: userLevelSchema, valid: 'senior' },
    { name: 'beltRankSchema', schema: beltRankSchema, valid: 'black' },
  ] as const

  for (const { name, schema, valid } of cases) {
    it(`${name} accepts a valid member and rejects bogus`, () => {
      expect(schema.parse(valid)).toBe(valid)
      expect(schema.safeParse('__not_a_member__').success).toBe(false)
    })
  }

  // Regression: `preparing` (body-generation window) must stay in sync with the
  // domain's 4-state SessionStatus — it drifted out of the DTO once already.
  it('sessionStatusSchema accepts every domain status including preparing', () => {
    for (const status of ['preparing', 'active', 'completed', 'failed'] as const) {
      expect(sessionStatusSchema.parse(status)).toBe(status)
    }
    expect(sessionStatusSchema.safeParse('__not_a_member__').success).toBe(false)
  })
})

describe('rubricIssueSchema', () => {
  it('parses a valid issue and rejects missing title', () => {
    expect(rubricIssueSchema.parse({ title: 'X', severity: 'low', why: 'because' })).toBeTruthy()
    expect(rubricIssueSchema.safeParse({ severity: 'low', why: 'because' }).success).toBe(false)
  })
})

describe('rubricSchema', () => {
  it('parses with at least one expected issue and rejects empty array', () => {
    const issue = { title: 'X', severity: 'low' as const, why: 'because' }
    expect(rubricSchema.parse({ expectedIssues: [issue] })).toBeTruthy()
    expect(rubricSchema.safeParse({ expectedIssues: [] }).success).toBe(false)
  })
})

describe('userDTOSchema', () => {
  it('parses a valid user and rejects a non-url avatar', () => {
    const valid = { id: UUID, username: 'ada', avatarUrl: 'https://x.dev/a.png', createdAt: ISO }
    expect(userDTOSchema.parse(valid)).toBeTruthy()
    expect(userDTOSchema.safeParse({ ...valid, avatarUrl: 'not-a-url' }).success).toBe(false)
  })
})

describe('kataDTOSchema', () => {
  it('parses a valid kata and rejects non-positive duration', () => {
    const valid = {
      id: UUID,
      title: 't',
      description: 'd',
      duration: 30,
      difficulty: 'easy' as const,
      type: 'code' as const,
      language: ['ts'],
      tags: ['a'],
    }
    expect(kataDTOSchema.parse(valid)).toBeTruthy()
    expect(kataDTOSchema.safeParse({ ...valid, duration: 0 }).success).toBe(false)
  })
})

describe('variationDTOSchema', () => {
  it('parses a valid variation and rejects a non-uuid id', () => {
    const valid = { id: UUID, kataId: UUID, ownerRole: 'r', ownerContext: 'c' }
    expect(variationDTOSchema.parse(valid)).toBeTruthy()
    expect(variationDTOSchema.safeParse({ ...valid, id: 'nope' }).success).toBe(false)
  })
})

describe('sessionDTOSchema', () => {
  it('parses a valid session and rejects a missing status', () => {
    const valid = {
      id: UUID,
      kataId: UUID,
      variationId: UUID,
      body: 'b',
      status: 'active' as const,
      startedAt: ISO,
      completedAt: null,
    }
    expect(sessionDTOSchema.parse(valid)).toBeTruthy()
    const { status: _status, ...missing } = valid
    expect(sessionDTOSchema.safeParse(missing).success).toBe(false)
  })
})

describe('attemptDTOSchema', () => {
  it('parses a valid attempt and rejects a wrong-typed isFinalEvaluation', () => {
    const valid = {
      id: UUID,
      sessionId: UUID,
      userResponse: 'r',
      verdict: null,
      analysis: null,
      topicsToReview: [],
      isFinalEvaluation: false,
      submittedAt: ISO,
    }
    expect(attemptDTOSchema.parse(valid)).toBeTruthy()
    expect(attemptDTOSchema.safeParse({ ...valid, isFinalEvaluation: 'yes' }).success).toBe(false)
  })
})

describe('feedbackSubmitSchema', () => {
  it('defaults all fields to null and rejects an over-long note', () => {
    expect(feedbackSubmitSchema.parse({})).toEqual({
      clarity: null,
      timing: null,
      evaluation: null,
      note: null,
    })
    expect(feedbackSubmitSchema.safeParse({ note: 'x'.repeat(281) }).success).toBe(false)
  })
})

describe('kataFiltersSchema', () => {
  it('parses an empty object and rejects a bad mood', () => {
    expect(kataFiltersSchema.parse({})).toBeTruthy()
    expect(kataFiltersSchema.safeParse({ mood: 'sleepy' }).success).toBe(false)
  })
})

describe('beltDTOSchema', () => {
  it('parses valid factors and rejects a negative factor', () => {
    const factors = { completed: 1, distinctClusters: 1, activeDays30: 1, daysAtRank: 1 }
    expect(beltDTOSchema.parse({ rank: 'white', factors })).toBeTruthy()
    expect(
      beltDTOSchema.safeParse({ rank: 'white', factors: { ...factors, completed: -1 } }).success,
    ).toBe(false)
  })
})

describe('milestoneDTOSchema', () => {
  it('parses a valid milestone and rejects a bad earnedAt', () => {
    const valid = { id: 'm1', earnedAt: ISO, contextRef: null }
    expect(milestoneDTOSchema.parse(valid)).toBeTruthy()
    expect(milestoneDTOSchema.safeParse({ ...valid, earnedAt: 'nope' }).success).toBe(false)
  })
})
