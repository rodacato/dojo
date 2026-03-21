/**
 * API Data Transfer Objects (DTOs)
 *
 * These are the shapes of data that cross the API/frontend boundary over HTTP.
 * They are NOT domain aggregates — domain logic lives in apps/api/src/domain/.
 *
 * Rules:
 * - Types here must match what the API serializes to JSON
 * - No methods, no invariants, no business logic
 * - All dates are ISO strings (not Date objects — JSON doesn't have Date)
 * - All IDs are plain strings (not branded types — branding is a compile-time API concern)
 *
 * Naming convention: suffix DTOs with nothing (keep it clean for consumer use),
 * but if a type conflicts with a domain type of the same name, suffix it with `DTO`.
 */

export type Difficulty = 'easy' | 'medium' | 'hard'
export type ExerciseType = 'code' | 'chat' | 'whiteboard'
export type ExerciseStatus = 'draft' | 'published' | 'archived'
export type SessionStatus = 'active' | 'completed' | 'failed'
export type Verdict = 'passed' | 'passed_with_notes' | 'needs_work'

export interface UserDTO {
  id: string
  username: string
  avatarUrl: string
  createdAt: string // ISO string
}

export interface ExerciseDTO {
  id: string
  title: string
  description: string
  duration: number
  difficulty: Difficulty
  type: ExerciseType
  language: string[]
  tags: string[]
}

export interface VariationDTO {
  id: string
  exerciseId: string
  ownerRole: string
  ownerContext: string
}

export interface SessionDTO {
  id: string
  exerciseId: string
  variationId: string
  body: string
  status: SessionStatus
  startedAt: string // ISO string
  completedAt: string | null
}

export interface AttemptDTO {
  id: string
  sessionId: string
  userResponse: string
  verdict: Verdict | null
  analysis: string | null
  topicsToReview: string[]
  isFinalEvaluation: boolean
  submittedAt: string // ISO string
}
