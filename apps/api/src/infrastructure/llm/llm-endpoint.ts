// A proxy like SheLLM queues behind a CLI process and can exceed 30s p50 on a
// session body. 90s covers typical p99 without letting a dead upstream keep
// the background task alive forever.
export const REQUEST_TIMEOUT_MS = 90_000

// Both adapters append `/v1/...` themselves; provider docs show base URLs that already end in it.
export function normalizeBaseURL(url: string): string {
  return url.replace(/\/+$/, '').replace(/\/v1$/, '')
}

export class LLMHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'LLMHttpError'
  }
}

export async function httpErrorFrom(response: Response): Promise<LLMHttpError> {
  const body = await response.text()
  return new LLMHttpError(
    response.status,
    `OpenAI-compatible API error ${response.status}: ${messageFromBody(body)}`,
  )
}

function messageFromBody(body: string): string {
  try {
    const message = (JSON.parse(body) as { error?: { message?: unknown } }).error?.message
    if (typeof message === 'string' && message) return message
  } catch {
    // not JSON — fall through to the raw text
  }
  return body.slice(0, 500)
}
