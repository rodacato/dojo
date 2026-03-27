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
export type UserLevel = 'junior' | 'mid' | 'senior'

export type ClaritySignal = 'clear' | 'somewhat_unclear' | 'confusing'
export type TimingSignal = 'too_short' | 'about_right' | 'too_long'
export type EvaluationSignal = 'fair_and_relevant' | 'too_generic' | 'missed_the_point'

export interface UserDTO {
  id: string
  username: string
  avatarUrl: string
  createdAt: string // ISO string
  isCreator?: boolean
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

export interface FeedbackDTO {
  clarity: ClaritySignal | null
  timing: TimingSignal | null
  evaluation: EvaluationSignal | null
  note: string | null
}

// ── Learning (Courses) ──────────────────────────────────────────────

export type StepType = 'explanation' | 'exercise' | 'challenge'
export type CourseStatus = 'draft' | 'published'

export interface StepDTO {
  id: string
  order: number
  type: StepType
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
}

export interface LessonDTO {
  id: string
  order: number
  title: string
  steps: StepDTO[]
}

export interface CourseDTO {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  status: CourseStatus
  lessonCount: number
  stepCount: number
}

export interface CourseDetailDTO extends CourseDTO {
  lessons: LessonDTO[]
}

export interface ExecuteStepRequest {
  code: string
  testCode: string
  language: string
}

export interface TestResultDTO {
  name: string
  passed: boolean
  message?: string
}

export interface ExecuteStepResponse {
  passed: boolean
  output: string
  testResults: TestResultDTO[]
}

export interface CourseProgressDTO {
  completedSteps: string[]
}
