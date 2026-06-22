import { API_URL } from '../config'
import { getToken } from '../auth-token'
import { request, ApiError } from './client'
import { streamSseTokens } from './sse'

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
    throw new ApiError(res.status, await errorMessageFrom(res))
  }

  yield* streamSseTokens(res.body)
}

async function errorMessageFrom(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string }
    if (j.error) return j.error
  } catch {
    // empty body / not JSON — fall through to statusText
  }
  return res.statusText
}

export const playground = {
  // credentials:'include' is required: the server issues
  // `dojo_playground_session` as a cookie for the per-session rate
  // limiter. Without it the cookie never makes it back on the next
  // cross-origin fetch and every call looks like a new browser.
  run: (body: PlaygroundRunRequest): Promise<PlaygroundRunResponse> =>
    request<PlaygroundRunResponse>('/engawa/run', {
      method: 'POST',
      body: JSON.stringify(body),
      credentials: 'include',
    }),

  askSensei,
}
