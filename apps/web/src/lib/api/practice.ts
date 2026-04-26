import type { ExerciseDTO } from '@dojo/shared'
import { API_URL } from '../config'
import { getToken } from '../auth-token'
import { request, ApiError } from './client'
import type { DashboardData, SessionWithExercise, StartSessionResponse, SubmitAttemptResponse } from './types'

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

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let event = 'message'
  let dataLines: string[] = []

  function flush(): { event: string; data: string } | null {
    if (dataLines.length === 0) return null
    const out = { event, data: dataLines.join('\n') }
    event = 'message'
    dataLines = []
    return out
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE frames are separated by blank lines. Keep the trailing
    // (possibly partial) frame in `buffer` for the next chunk.
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const raw of lines) {
      const line = raw.replace(/\r$/, '')
      if (line === '') {
        const evt = flush()
        if (!evt) continue
        if (evt.event === 'token') yield evt.data
        else if (evt.event === 'done') return
        else if (evt.event === 'error') throw new ApiError(500, evt.data || 'stream_error')
        continue
      }
      if (line.startsWith(':')) continue
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
    }
  }
}

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
