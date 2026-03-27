import { request } from './client'
import type { PublicProfileData, LeaderboardData } from './types'

export const profile = {
  getPublicProfile: (username: string) =>
    request<PublicProfileData>(`/u/${username}`),

  getLeaderboard: (period: 'month' | 'all-time' = 'month') =>
    request<LeaderboardData>(`/leaderboard?period=${period}`),

  getPreferences: () =>
    request<{
      reminderEnabled: boolean
      reminderHour: number
      email: string | null
      level: string
      interests: string[]
      randomness: number
      goalWeeklyTarget: number
    }>('/preferences'),

  updatePreferences: (prefs: {
    reminderEnabled: boolean
    reminderHour: number
    email?: string | null
    level?: string
    interests?: string[]
    randomness?: number
    goalWeeklyTarget?: number
  }) =>
    request<{ ok: boolean }>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),

  requestAccess: (githubHandle: string, reason?: string) =>
    request<{ ok: boolean }>('/access-requests', {
      method: 'POST',
      body: JSON.stringify({ githubHandle, reason }),
    }),
}
