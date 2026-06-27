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
  stepTypeSchema,
  scrollStatusSchema,
  predictOptionSchema,
  predictDataSchema,
  readInlineInteractionSchema,
  readInlineDataSchema,
  scrollSlugSchema,
  executeStepSchema,
  trackProgressSchema,
  mergeAnonymousProgressSchema,
  stepDTOSchema,
  lessonDTOSchema,
  externalReferenceKindSchema,
  externalReferenceSchema,
  scrollDTOSchema,
  stepSolutionDTOSchema,
  scrollDetailDTOSchema,
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
    { name: 'stepTypeSchema', schema: stepTypeSchema, valid: 'read+inline' },
    { name: 'scrollStatusSchema', schema: scrollStatusSchema, valid: 'draft' },
    { name: 'externalReferenceKindSchema', schema: externalReferenceKindSchema, valid: 'book' },
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

describe('predictOptionSchema', () => {
  it('parses a valid option and rejects empty text', () => {
    expect(predictOptionSchema.parse({ id: '1', text: 'a' })).toBeTruthy()
    expect(predictOptionSchema.safeParse({ id: '1', text: '' }).success).toBe(false)
  })
})

describe('predictDataSchema', () => {
  it('parses with 2 options and rejects fewer than 2', () => {
    const opts = [
      { id: '1', text: 'a' },
      { id: '2', text: 'b' },
    ]
    const valid = { snippet: 's', options: opts, correct: '1', feedback: { '1': 'ok' } }
    expect(predictDataSchema.parse(valid)).toBeTruthy()
    expect(predictDataSchema.safeParse({ ...valid, options: [opts[0]] }).success).toBe(false)
  })
})

describe('readInlineInteractionSchema', () => {
  it('parses a reveal variant', () => {
    expect(
      readInlineInteractionSchema.parse({ kind: 'reveal', after: 'm', prompt: 'p', answer: 'a' }),
    ).toBeTruthy()
  })

  it('parses a micro-quiz variant', () => {
    expect(
      readInlineInteractionSchema.parse({
        kind: 'micro-quiz',
        after: 'm',
        question: 'q',
        options: ['a', 'b'],
        correct: 0,
        feedback: ['fa', 'fb'],
      }),
    ).toBeTruthy()
  })

  it('rejects an unknown discriminator', () => {
    expect(readInlineInteractionSchema.safeParse({ kind: 'bogus', after: 'm' }).success).toBe(false)
  })
})

describe('readInlineDataSchema', () => {
  it('parses one interaction and rejects an empty list', () => {
    const interaction = { kind: 'reveal' as const, after: 'm', prompt: 'p', answer: 'a' }
    expect(readInlineDataSchema.parse({ interactions: [interaction] })).toBeTruthy()
    expect(readInlineDataSchema.safeParse({ interactions: [] }).success).toBe(false)
  })
})

describe('scrollSlugSchema', () => {
  it('parses a kebab slug and rejects uppercase', () => {
    expect(scrollSlugSchema.parse({ slug: 'my-scroll' })).toBeTruthy()
    expect(scrollSlugSchema.safeParse({ slug: 'My_Scroll' }).success).toBe(false)
  })
})

describe('executeStepSchema', () => {
  it('parses valid code and rejects empty code', () => {
    const valid = { code: 'x', testCode: 'y', language: 'ts' }
    expect(executeStepSchema.parse(valid)).toBeTruthy()
    expect(executeStepSchema.safeParse({ ...valid, code: '' }).success).toBe(false)
  })
})

describe('trackProgressSchema', () => {
  it('parses required uuids and rejects a non-uuid stepId', () => {
    expect(trackProgressSchema.parse({ scrollId: UUID, stepId: UUID })).toBeTruthy()
    expect(trackProgressSchema.safeParse({ scrollId: UUID, stepId: 'x' }).success).toBe(false)
  })
})

describe('mergeAnonymousProgressSchema', () => {
  it('parses a uuid and rejects a non-uuid', () => {
    expect(mergeAnonymousProgressSchema.parse({ anonymousSessionId: UUID })).toBeTruthy()
    expect(mergeAnonymousProgressSchema.safeParse({ anonymousSessionId: 'x' }).success).toBe(false)
  })
})

describe('stepDTOSchema', () => {
  it('parses a minimal step and rejects a missing instruction', () => {
    const valid = {
      id: UUID,
      order: 0,
      type: 'read' as const,
      title: null,
      instruction: 'do',
      starterCode: null,
      testCode: null,
      hint: null,
      hints: null,
      data: null,
    }
    expect(stepDTOSchema.parse(valid)).toBeTruthy()
    const { instruction: _instruction, ...missing } = valid
    expect(stepDTOSchema.safeParse(missing).success).toBe(false)
  })
})

describe('lessonDTOSchema', () => {
  it('parses a lesson with no steps and rejects a missing title', () => {
    const valid = { id: UUID, order: 0, title: 't', outcome: null, steps: [] }
    expect(lessonDTOSchema.parse(valid)).toBeTruthy()
    const { title: _title, ...missing } = valid
    expect(lessonDTOSchema.safeParse(missing).success).toBe(false)
  })
})

describe('externalReferenceSchema', () => {
  it('parses a valid reference and rejects a non-url', () => {
    const valid = { title: 't', url: 'https://x.dev', kind: 'docs' as const }
    expect(externalReferenceSchema.parse(valid)).toBeTruthy()
    expect(externalReferenceSchema.safeParse({ ...valid, url: 'x' }).success).toBe(false)
  })
})

const validScroll = {
  id: UUID,
  slug: 's',
  title: 't',
  description: 'd',
  language: 'ts',
  accentColor: '#000',
  status: 'draft' as const,
  lessonCount: 1,
  stepCount: 1,
  externalReferences: [],
}

describe('scrollDTOSchema', () => {
  it('parses a valid scroll and rejects a wrong-typed lessonCount', () => {
    expect(scrollDTOSchema.parse(validScroll)).toBeTruthy()
    expect(scrollDTOSchema.safeParse({ ...validScroll, lessonCount: 'one' }).success).toBe(false)
  })
})

describe('stepSolutionDTOSchema', () => {
  it('parses nullable fields and rejects a wrong-typed solution', () => {
    expect(stepSolutionDTOSchema.parse({ solution: null, alternativeApproach: null })).toBeTruthy()
    expect(
      stepSolutionDTOSchema.safeParse({ solution: 1, alternativeApproach: null }).success,
    ).toBe(false)
  })
})

describe('scrollDetailDTOSchema', () => {
  it('parses scroll fields plus lessons and rejects a missing lessons array', () => {
    expect(scrollDetailDTOSchema.parse({ ...validScroll, lessons: [] })).toBeTruthy()
    expect(scrollDetailDTOSchema.safeParse(validScroll).success).toBe(false)
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
