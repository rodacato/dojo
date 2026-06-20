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
export type KataType = 'code' | 'chat' | 'whiteboard' | 'review'
export type KataStatus = 'draft' | 'published' | 'archived'
export type SessionStatus = 'active' | 'completed' | 'failed'
export type Verdict = 'passed' | 'passed_with_notes' | 'needs_work'
export type UserLevel = 'junior' | 'mid' | 'senior'
export type RubricSeverity = 'high' | 'medium' | 'low'

// Code-review kata rubric (PRD 027). Each `expectedIssues` entry is what the
// sensei evaluates the learner's review against; `contextNotes` is extra
// background the learner never sees but the sensei should consider.
export interface RubricIssue {
  title: string
  severity: RubricSeverity
  why: string
}

export interface Rubric {
  expectedIssues: RubricIssue[]
  contextNotes?: string
}

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

export interface KataDTO {
  id: string
  title: string
  description: string
  duration: number
  difficulty: Difficulty
  type: KataType
  language: string[]
  tags: string[]
  starterCode?: string | null
}

export interface VariationDTO {
  id: string
  kataId: string
  ownerRole: string
  ownerContext: string
}

export interface SessionDTO {
  id: string
  kataId: string
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

// ── Learning (Scrolls) ──────────────────────────────────────────────

export type StepType = 'read' | 'code' | 'exercise' | 'challenge' | 'predict' | 'read+inline'
export type ScrollStatus = 'draft' | 'published'
export type ExternalReferenceKind = 'book' | 'docs' | 'talk' | 'article'

export interface ExternalReference {
  title: string
  url: string
  kind: ExternalReferenceKind
}

// `predict` step variant data — shipped on the `data` field of StepDTO when
// step.type === 'predict'. CSS state machine in the renderer dispatches on
// the option ids; per-option feedback voice is the load-bearing surface.
export interface PredictOption {
  id: string
  text: string
}
export interface PredictData {
  snippet: string
  options: PredictOption[]
  correct: string
  feedback: Record<string, string>
}

// `playground` variant data — shipped on the `data` field of a kata step when
// the step is a free-explore zone (no verdict, no pass/fail). Backend stays
// uniform (a kata with a trivially-true harness); the frontend reads the kind
// flag and renders without verdict UI. Scoped to Ruby as a local experiment
// per docs/courses/curricula/ruby/ruby.md §2.3. Promote to a canonical step
// type with an ADR + INTERACTIVITY-PATTERNS.md update only if the pattern
// survives 2-3 lessons across at least 2 scrolls.
export interface PlaygroundData {
  kind: 'playground'
}

// `read+inline` step variant data — shipped on the `data` field of StepDTO
// when step.type === 'read+inline'. Each interaction anchors to a
// `<!-- interact:<after> -->` marker in the instruction markdown; the
// renderer splits the prose on markers and inserts the matching interaction.
// Figures don't need an interaction kind — the `:figure[...]` markdown
// directive already resolves inside the prose segments. Contract in
// docs/courses/INTERACTIVITY-PATTERNS.md §read+inline.
export type ReadInlineInteraction =
  | { kind: 'reveal'; after: string; prompt: string; answer: string }
  | {
      kind: 'micro-quiz'
      after: string
      question: string
      options: [string, string]
      correct: 0 | 1
      feedback: [string, string]
    }
export interface ReadInlineData {
  interactions: ReadInlineInteraction[]
}

export type StepData = PredictData | PlaygroundData | ReadInlineData

export function isPredictData(data: StepData | null): data is PredictData {
  return data !== null && 'snippet' in data && 'options' in data
}

export function isPlaygroundData(data: StepData | null): data is PlaygroundData {
  return data !== null && 'kind' in data && data.kind === 'playground'
}

export function isReadInlineData(data: StepData | null): data is ReadInlineData {
  return data !== null && 'interactions' in data && Array.isArray(data.interactions)
}

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
  // Tier-ordered hints surfaced progressively on repeated failure: hints[0] on
  // the first failure, hints[1] (a stronger nudge) on the second. Falls back to
  // [hint] for steps authored before tiered hints. Null when none are authored.
  hints: string[] | null
  // Variant-shaped data for Tier 2 step types and step variants.
  // Discriminated by structural fields — use isPredictData / isPlaygroundData
  // to narrow. Null for plain kata/read steps without a variant.
  data: StepData | null
  // Solution is intentionally NOT in StepDTO — it ships only via
  // GET /scrolls/:slug/steps/:id/solution after pass.
}

export interface LessonDTO {
  id: string
  order: number
  title: string
  // §4.4 "what changed in the learner's head", shown under the lesson title on
  // the landing. Null when not yet authored — the row renders only the title.
  outcome: string | null
  steps: StepDTO[]
}

export interface ScrollDTO {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  // Optional because /scrolls (summary list) omits it when not needed;
  // /admin/scrolls and /scrolls/:slug both include it.
  status?: ScrollStatus
  isPublic: boolean
  // Real work time in minutes (framework §4.2). Null when not yet measured —
  // the card renders no time rather than a fabricated one.
  estimatedMinutes: number | null
  lessonCount: number
  stepCount: number
  externalReferences: ExternalReference[]
}

export interface StepSolutionDTO {
  solution: string | null
  alternativeApproach: string | null
}

export interface ScrollDetailDTO extends ScrollDTO {
  lessons: LessonDTO[]
}

// Batch catalog progress (GET /scrolls/progress). One entry per scroll the
// caller has touched; the catalog derives binary state client-side against
// each scroll's stepCount. Kept off ScrollDTO so the content DTO stays pure.
export interface ScrollProgressSummary {
  scrollId: string
  completedStepCount: number
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
  | 'output-exceeded' // killed for printing past the runner's stdout/stderr cap

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

export interface ScrollProgressDTO {
  completedSteps: string[]
}

// ── Recognition (Belts + Milestones) ────────────────────────────────

export type BeltRank = 'white' | 'yellow' | 'green' | 'brown' | 'black'

export interface BeltFactors {
  completed: number
  distinctClusters: number
  activeDays30: number
  daysAtRank: number
}

export interface BeltDTO {
  rank: BeltRank
  factors: BeltFactors
}

export interface MilestoneDTO {
  id: string         // FIRST_KATA, POLYGLOT, CONSISTENT, 5_STREAK, SCROLL_* (preserved)
  earnedAt: string   // ISO
  contextRef: string | null  // session id or scroll slug
}

// ── Activity heatmap ─────────────────────────────────────────────────

/** One day in the activity heatmap. Date is YYYY-MM-DD (ISO date only). */
export interface HeatmapDayDTO {
  date: string
  count: number
}

// ── Session row projections shared across surfaces ───────────────────

/** Compact session row used by /dashboard (last 5) and /history (paged). */
export interface SessionSummaryDTO {
  id: string
  kataTitle: string
  kataType: string
  difficulty: string
  verdict: string | null
  startedAt: string
}

/** Public-profile session row — adds status + completedAt on top of summary. */
export interface PublicSessionDTO extends SessionSummaryDTO {
  status: string
  completedAt: string | null
}
