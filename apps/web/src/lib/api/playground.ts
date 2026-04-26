import { API_URL } from '../config'
import { getToken } from '../auth-token'
import { request, ApiError } from './client'

export interface PlaygroundRunRequest {
  language: string
  version: string
  code: string
  turnstileToken?: string
}

export interface PlaygroundRunResponse {
  stdout: string
  stderr: string
  exitCode: number
  runtimeMs: number
  timedOut: boolean
}

export interface AskSenseiRequest {
  question: string
  code?: string
  language?: string
}

// Streams the sensei's answer over SSE. Yields plain-text chunks as they
// arrive. Throws ApiError on non-2xx response or `error` event so the
// caller can render quota / network failures cleanly. Returns when the
// server emits `done`. Bearer auth is required server-side — we cannot
// use EventSource here because it does not carry custom headers.
async function* askSensei(body: AskSenseiRequest): AsyncGenerator<string> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/playground/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body) {
    let errMessage = res.statusText
    try {
      const j = (await res.json()) as { error?: string }
      if (j.error) errMessage = j.error
    } catch {
      // empty body / not JSON — keep statusText
    }
    throw new ApiError(res.status, errMessage)
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

export const playground = {
  // credentials:'include' is required: the server issues
  // `dojo_playground_session` as a cookie for the per-session rate
  // limiter. Without it the cookie never makes it back on the next
  // cross-origin fetch and every call looks like a new browser.
  run: (body: PlaygroundRunRequest): Promise<PlaygroundRunResponse> =>
    request<PlaygroundRunResponse>('/playground/run', {
      method: 'POST',
      body: JSON.stringify(body),
      credentials: 'include',
    }),

  askSensei,
}
