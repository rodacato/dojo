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
  starterCode?: string | null
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

export type StepType = 'read' | 'code' | 'exercise' | 'challenge'
export type CourseStatus = 'draft' | 'published'

export interface StepDTO {
  id: string
  order: number
  type: StepType
  // Top-level title used for sidebar entry and the StepEditor H1.
  // Nullable for backwards compat with steps seeded before Sprint 018.
  title: string | null
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
  // Solution is intentionally NOT in StepDTO — it ships only via
  // GET /learn/courses/:slug/steps/:id/solution after pass.
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
  // Optional because /learn/courses (summary list) omits it when not needed;
  // /admin/courses and /learn/courses/:slug both include it.
  status?: CourseStatus
  isPublic: boolean
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

/**
 * Why execution failed — distinguishes infra errors from failing tests.
 * Lets the UI render a dedicated error card ("Couldn't reach the sandbox")
 * instead of mixing a fetch failure into the tests panel.
 */
export type ExecuteErrorKind =
  | 'runtime'   // user code crashed before tests finished (ReferenceError, etc.)
  | 'compile'   // TS/compiled language failed to compile
  | 'timeout'   // hit sandbox timeout
  | 'sandbox'   // infra failed (Piston unreachable, network, etc.)

export interface ExecuteStepResponse {
  passed: boolean
  /** Raw combined output (kept for backwards compat with legacy parsers). */
  output: string
  /** stdout captured by the sandbox, separate from stderr. */
  stdout: string
  /** stderr captured by the sandbox. */
  stderr: string
  /** Structured per-test outcomes. Empty when the run never reached tests. */
  testResults: TestResultDTO[]
  /** Populated only when !passed AND the failure is not "some tests failed". */
  errorKind?: ExecuteErrorKind
  /** Human-readable summary of the failure when errorKind is set. */
  errorMessage?: string
}

export interface CourseProgressDTO {
  completedSteps: string[]
}
