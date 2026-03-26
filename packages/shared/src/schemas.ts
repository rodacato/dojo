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
export const exerciseTypeSchema = z.enum(['code', 'chat', 'whiteboard'])
export const exerciseStatusSchema = z.enum(['draft', 'published', 'archived'])
export const sessionStatusSchema = z.enum(['active', 'completed', 'failed'])
export const verdictSchema = z.enum(['passed', 'passed_with_notes', 'needs_work'])

export const userDTOSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  avatarUrl: z.string().url(),
  createdAt: z.string().datetime(),
})

export const exerciseDTOSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  duration: z.number().int().positive(),
  difficulty: difficultySchema,
  type: exerciseTypeSchema,
  language: z.array(z.string()),
  tags: z.array(z.string()),
})

export const variationDTOSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  ownerRole: z.string(),
  ownerContext: z.string(),
})

export const sessionDTOSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
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
export const exerciseFiltersSchema = z.object({
  mood: z.enum(['focused', 'regular', 'low_energy']).optional(),
  maxDuration: z.number().int().positive().optional(),
})
