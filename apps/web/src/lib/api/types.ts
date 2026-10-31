import type {
  KataDTO,
  BeltDTO,
  HeatmapDayDTO,
  PublicSessionDTO,
  PieceId,
  PublicPractitionerDTO,
} from '@dojo/shared'

export { type AttemptDTO, type DashboardDTO as DashboardData } from '@dojo/shared'

export interface SessionAttempt {
  id: string
  userResponse: string
  verdict: string | null
  analysis: string
  topicsToReview: string[]
  isFinalEvaluation: boolean
  submittedAt: string
}

export interface SessionWithKata {
  id: string
  body: string
  status: string
  startedAt: string
  completedAt: string | null
  kata: KataDTO
  variationId: string
  ownerRole: string
  finalAttempt: SessionAttempt | null
  answer: RevealedAnswer | null
  earnedPieces: PieceId[]
}

export interface RevealedAnswer {
  line: number
  title: string
  why: string
}

export interface KataFeedback {
  clarity: 'clear' | 'somewhat_unclear' | 'confusing' | null
  timing: 'too_short' | 'about_right' | 'too_long' | null
  evaluation: 'fair_and_relevant' | 'too_generic' | 'missed_the_point' | null
  note: string | null
}

export interface StartSessionResponse {
  sessionId: string
}

export interface SubmitAttemptResponse {
  attemptId: string
}

export interface AdminKataDTO {
  id: string
  title: string
  type: string
  difficulty: string
  duration: number
  status: string
  sessionCount: number
  avgScore: number | null
  variationCount: number
  createdAt: string
}

export interface PublicProfileData {
  username: string
  avatarUrl: string
  memberSince: string
  stats: {
    totalKata: number
    passRate: number
    avgTimeMinutes: number
    languages: string[]
  }
  streak: number
  heatmapData: HeatmapDayDTO[]
  recentSessions: PublicSessionDTO[]
  milestones: Array<{
    slug: string
    earnedAt: string
  }>
  belt: BeltDTO
  practitioner: PublicPractitionerDTO
}
