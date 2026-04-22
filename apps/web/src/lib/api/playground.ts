import { request } from './client'

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
}
