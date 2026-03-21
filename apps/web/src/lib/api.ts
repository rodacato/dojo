import type { UserDTO, ExerciseDTO, AttemptDTO } from '@dojo/shared'

export interface DashboardData {
  streak: number
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

export interface SessionWithExercise {
  id: string
  body: string
  status: string
  startedAt: string
  completedAt: string | null
  exercise: ExerciseDTO
  variationId: string
  ownerRole: string
}

export interface StartSessionResponse {
  sessionId: string
}

export interface SubmitAttemptResponse {
  attemptId: string
}

export { type AttemptDTO }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthenticated')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
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
}
