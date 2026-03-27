import type { ExerciseDTO } from '@dojo/shared'
import { request } from './client'
import type { DashboardData, SessionWithExercise, StartSessionResponse, SubmitAttemptResponse } from './types'

export const practice = {
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

  retryEvaluation: (sessionId: string) =>
    request<SubmitAttemptResponse>(`/sessions/${sessionId}/retry-evaluation`, {
      method: 'POST',
    }),

  submitFeedback: (sessionId: string, feedback: {
    clarity: string | null
    timing: string | null
    evaluation: string | null
    note: string | null
  }) =>
    request<{ ok: boolean }>(`/sessions/${sessionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    }),

  getFeedback: (sessionId: string) =>
    request<{ submitted: boolean }>(`/sessions/${sessionId}/feedback`),

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
}
