/**
 * Zod schemas for API DTOs.
 *
 * Two uses:
 * 1. Frontend: validate API responses at runtime (optional but recommended)
 * 2. API: shared request/response schema validation where the same shape
 *    is used on both sides (e.g., a filter object passed as query params)
 *
 * API-only request schemas (e.g., StartSessionRequest) live in the route
 * file in apps/api, not here — they are not consumed by the frontend.
 */
import { z } from 'zod'

export const difficultySchema = z.enum(['easy', 'medium', 'hard'])
export const kataTypeSchema = z.enum(['code', 'chat', 'whiteboard', 'review'])
export const kataStatusSchema = z.enum(['draft', 'published', 'archived'])
export const sessionStatusSchema = z.enum(['active', 'completed', 'failed'])
export const verdictSchema = z.enum(['passed', 'passed_with_notes', 'needs_work'])
export const rubricSeveritySchema = z.enum(['high', 'medium', 'low'])
export const rubricIssueSchema = z.object({
  title: z.string().min(1),
  severity: rubricSeveritySchema,
  why: z.string().min(1),
})
export const rubricSchema = z.object({
  expectedIssues: z.array(rubricIssueSchema).min(1),
  contextNotes: z.string().optional(),
})

export const userDTOSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().url(),
  createdAt: z.string().datetime(),
})

export const kataDTOSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  duration: z.number().int().positive(),
  difficulty: difficultySchema,
  type: kataTypeSchema,
  language: z.array(z.string()),
  tags: z.array(z.string()),
})

export const variationDTOSchema = z.object({
  id: z.string().uuid(),
  kataId: z.string().uuid(),
  ownerRole: z.string(),
  ownerContext: z.string(),
})

export const sessionDTOSchema = z.object({
  id: z.string().uuid(),
  kataId: z.string().uuid(),
  variationId: z.string().uuid(),
  body: z.string(),
  status: sessionStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
})

export const attemptDTOSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  userResponse: z.string(),
  verdict: verdictSchema.nullable(),
  analysis: z.string().nullable(),
  topicsToReview: z.array(z.string()),
  isFinalEvaluation: z.boolean(),
  submittedAt: z.string().datetime(),
})

// Feedback
export const claritySignalSchema = z.enum(['clear', 'somewhat_unclear', 'confusing'])
export const timingSignalSchema = z.enum(['too_short', 'about_right', 'too_long'])
export const evaluationSignalSchema = z.enum(['fair_and_relevant', 'too_generic', 'missed_the_point'])

export const feedbackSubmitSchema = z.object({
  clarity: claritySignalSchema.nullable().default(null),
  timing: timingSignalSchema.nullable().default(null),
  evaluation: evaluationSignalSchema.nullable().default(null),
  note: z.string().max(280).nullable().default(null),
})

export const userLevelSchema = z.enum(['junior', 'mid', 'senior'])

// Shared filter schema — used by both API (query param parsing) and frontend (form state)
export const kataFiltersSchema = z.object({
  mood: z.enum(['focused', 'regular', 'low_energy']).optional(),
  maxDuration: z.number().int().positive().optional(),
})

// ── Learning (Scrolls) ──────────────────────────────────────────────

export const stepTypeSchema = z.enum(['read', 'code', 'exercise', 'challenge', 'predict'])
export const scrollStatusSchema = z.enum(['draft', 'published'])

// `predict` step data — variant-shaped JSONB column per ADR 022 + the
// scroll-player CSS state machine (unanswered → reviewing → revealed).
// The PredictData / PredictOption TS types live in types.ts; this schema
// is the runtime validator the API uses when persisting or returning
// `step.data` for a predict step.
export const predictOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
})
export const predictDataSchema = z.object({
  snippet: z.string(),
  options: z.array(predictOptionSchema).min(2).max(4),
  correct: z.string().min(1),
  feedback: z.record(z.string(), z.string()),
})

export const scrollSlugSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})

export const executeStepSchema = z.object({
  code: z.string().min(1).max(50_000),
  testCode: z.string().min(1).max(50_000),
  language: z.string().min(1).max(30),
})

export const trackProgressSchema = z.object({
  scrollId: z.string().uuid(),
  stepId: z.string().uuid(),
  anonymousSessionId: z.string().uuid().optional(),
})

export const mergeAnonymousProgressSchema = z.object({
  anonymousSessionId: z.string().uuid(),
})

export const stepDTOSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int(),
  type: stepTypeSchema,
  title: z.string().nullable(),
  instruction: z.string(),
  starterCode: z.string().nullable(),
  testCode: z.string().nullable(),
  hint: z.string().nullable(),
  // Variant-shaped data for Tier 2 step types (predict; later trace, read+inline).
  // Null for kata/read/code/exercise/challenge. The renderer dispatches on
  // step.type and parses data against the corresponding variant schema
  // (e.g. predictDataSchema for `predict`).
  data: z.unknown().nullable(),
})

export const lessonDTOSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int(),
  title: z.string(),
  steps: z.array(stepDTOSchema),
})

export const externalReferenceKindSchema = z.enum(['book', 'docs', 'talk', 'article'])

export const externalReferenceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  kind: externalReferenceKindSchema,
})

export const scrollDTOSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  language: z.string(),
  accentColor: z.string(),
  status: scrollStatusSchema,
  lessonCount: z.number().int(),
  stepCount: z.number().int(),
  externalReferences: z.array(externalReferenceSchema),
})

export const stepSolutionDTOSchema = z.object({
  solution: z.string().nullable(),
  alternativeApproach: z.string().nullable(),
})

export const scrollDetailDTOSchema = scrollDTOSchema.extend({
  lessons: z.array(lessonDTOSchema),
})

// ── Recognition (Belts + Milestones) ────────────────────────────────

export const beltRankSchema = z.enum(['white', 'yellow', 'green', 'brown', 'black'])

export const beltDTOSchema = z.object({
  rank: beltRankSchema,
  factors: z.object({
    completed: z.number().int().nonnegative(),
    distinctClusters: z.number().int().nonnegative(),
    activeDays30: z.number().int().nonnegative(),
    daysAtRank: z.number().int().nonnegative(),
  }),
})

export const milestoneDTOSchema = z.object({
  id: z.string(),
  earnedAt: z.string().datetime(),
  contextRef: z.string().nullable(),
})
