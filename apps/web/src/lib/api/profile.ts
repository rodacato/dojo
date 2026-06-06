import { request } from './client'
import type { PublicProfileData } from './types'
import type { BeltDTO, MilestoneDTO } from '@dojo/shared'

export const profile = {
  getPublicProfile: (username: string) =>
    request<PublicProfileData>(`/u/${username}`),

  getBelts: () =>
    request<{ belt: BeltDTO; milestones: MilestoneDTO[] }>('/belts'),

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

  getRepoStats: () =>
    request<{ stars: number; forks: number; language: string }>('/landing/repo-stats'),
}
