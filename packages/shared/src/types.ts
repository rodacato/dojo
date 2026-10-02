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
export type SessionStatus = 'preparing' | 'active' | 'completed' | 'failed'
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
