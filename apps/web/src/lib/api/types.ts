import type { ExerciseDTO, AttemptDTO } from '@dojo/shared'

export { type AttemptDTO }

export interface DashboardData {
  streak: number
  totalCompleted: number
  todayComplete: boolean
  todaySession: { id: string; exerciseTitle: string; verdict: string | null } | null
  activeSessionId: string | null
  heatmapData: Array<{ date: string; count: number }>
  recentSessions: Array<{
    id: string
    exerciseTitle: string
    exerciseType: string
    difficulty: string
    verdict: string | null
    startedAt: string
  }>
  // Extended dashboard (Phase 2)
  weakAreas: Array<{ topic: string; frequency: number }>
  practicePatterns: {
    avgTimeMinutes: number
    mostAvoidedType: string | null
    sessionsTimedOut: number
  }
  senseiSuggests: string[]
  weeklyGoal: { target: number; completed: number }
}

export interface SessionAttempt {
  id: string
  userResponse: string
  verdict: string | null
  analysis: string
  topicsToReview: string[]
  isFinalEvaluation: boolean
  submittedAt: string
}

export interface SessionWithExercise {
  id: string
  body: string
  status: string
  startedAt: string
  completedAt: string | null
  exercise: ExerciseDTO
  variationId: string
  ownerRole: string
  finalAttempt: SessionAttempt | null
}

export interface StartSessionResponse {
  sessionId: string
}

export interface SubmitAttemptResponse {
  attemptId: string
}

export interface AdminExerciseDTO {
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

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatarUrl: string
  streak: number
  kataCount: number
  passRate: number
  lastActive: string
  isCurrentUser: boolean
}

export interface LeaderboardData {
  entries: LeaderboardEntry[]
  period: 'month' | 'all-time'
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
  heatmapData: Array<{ date: string; count: number }>
  recentSessions: Array<{
    id: string
    exerciseTitle: string
    exerciseType: string
    difficulty: string
    verdict: string | null
    status: string
    startedAt: string
    completedAt: string | null
  }>
  badges: Array<{
    slug: string
    earnedAt: string
  }>
}
