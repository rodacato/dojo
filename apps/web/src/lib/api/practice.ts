import type { KataDTO } from '@dojo/shared'
import { API_URL } from '../config'
import { getToken } from '../auth-token'
import { request, ApiError } from './client'
import { streamSseTokens } from './sse'
import type { DashboardData, SessionWithKata, StartSessionResponse, SubmitAttemptResponse } from './types'

// SSE stream of the kata-prep body — S022 Part 6. Yields plain text
// chunks as the model produces them, then resolves when the server
// emits the `done` event. Throws ApiError on `error` event or
// non-2xx response so the caller can fall back to polling.
//
// EventSource is not used because it can't carry the bearer token
// (no custom-header support) — fetch + manual SSE parsing it is.
async function* streamSessionBody(sessionId: string): AsyncGenerator<string> {
  const token = getToken()
  const headers: Record<string, string> = { Accept: 'text/event-stream' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/sessions/${sessionId}/body-stream`, { headers })
  if (!res.ok || !res.body) {
    throw new ApiError(res.status, res.statusText || 'stream_failed')
  }

  yield* streamSseTokens(res.body)
}

export const practice = {
  getDashboard: () => request<DashboardData>('/dashboard'),

  getKatas: (params: { mood?: string; maxDuration?: number }) => {
    const qs = new URLSearchParams()
    if (params.mood) qs.set('mood', params.mood)
    if (params.maxDuration) qs.set('maxDuration', String(params.maxDuration))
    return request<KataDTO[]>(`/katas?${qs}`)
  },

  startSession: (kataId: string) =>
    request<StartSessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ kataId }),
    }),

  getSession: (id: string) => request<SessionWithKata>(`/sessions/${id}`),

  streamSessionBody,

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
        kataTitle: string
        kataType: string
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
