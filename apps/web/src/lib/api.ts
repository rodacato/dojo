import type { UserDTO, ExerciseDTO, AttemptDTO } from '@dojo/shared'
import { API_URL } from './config'
import { getToken, clearToken } from './auth-token'

export interface DashboardData {
  streak: number
  totalCompleted: number
  todayComplete: boolean
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

export { type AttemptDTO }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    window.location.href = `${window.location.origin}/?error=session_expired`
    throw new Error('Unauthenticated')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
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

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export const api = {
  getMe: () => request<UserDTO>('/auth/me'),

  getDashboard: () => request<DashboardData>('/dashboard'),

  getExercises: (params: { mood?: string; maxDuration?: number }) => {
    const qs = new URLSearchParams()
    if (params.mood) qs.set('mood', params.mood)
    if (params.maxDuration) qs.set('maxDuration', String(params.maxDuration))
    return request<ExerciseDTO[]>(`/exercises?${qs}`)
  },

  startSession: (exerciseId: string) =>
    request<StartSessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ exerciseId }),
    }),

  getSession: (id: string) => request<SessionWithExercise>(`/sessions/${id}`),

  submitAttempt: (sessionId: string, userResponse: string) =>
    request<SubmitAttemptResponse>(`/sessions/${sessionId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ userResponse }),
    }),

  getAdminExercises: () => request<AdminExerciseDTO[]>('/admin/exercises'),

  getAdminExercise: (id: string) =>
    request<{
      id: string
      title: string
      description: string
      duration: number
      difficulty: string
      type: string
      languages: string[]
      tags: string[]
      topics: string[]
      status: string
      variations: Array<{ id: string; ownerRole: string; ownerContext: string }>
    }>(`/admin/exercises/${id}`),

  updateExercise: (id: string, data: {
    title: string
    description: string
    duration: number
    difficulty: string
    type: string
    languages: string[]
    tags: string[]
    topics: string[]
    variations: Array<{ ownerRole: string; ownerContext: string }>
  }) =>
    request<{ ok: boolean }>(`/admin/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createExercise: (data: {
    title: string
    description: string
    duration: number
    difficulty: string
    type: string
    languages: string[]
    tags: string[]
    topics: string[]
    variations: Array<{ ownerRole: string; ownerContext: string }>
  }) =>
    request<{ id: string }>('/admin/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getHistory: (page = 1) =>
    request<{
      sessions: Array<{
        id: string
        status: string
        exerciseTitle: string
        exerciseType: string
        difficulty: string
        verdict: string | null
        startedAt: string
        completedAt: string | null
      }>
      total: number
      page: number
      totalPages: number
    }>(`/history?page=${page}`),

  createInvitation: () =>
    request<{ id: string; token: string; url: string; expiresAt: string }>('/admin/invitations', {
      method: 'POST',
    }),

  getInvitations: () =>
    request<Array<{
      id: string
      token: string
      status: 'pending' | 'used' | 'expired'
      usedBy: string | null
      expiresAt: string
      createdAt: string
    }>>('/admin/invitations'),

  logout: () => request<{ ok: boolean }>('/auth/session', { method: 'DELETE' }),
}
