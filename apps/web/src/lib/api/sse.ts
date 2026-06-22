import { ApiError } from './client'

interface SseFrame {
  event: string
  data: string
}

// Parses an SSE response body, yielding the data of each `token` frame.
// Returns on `done`; throws ApiError(500) on `error`. EventSource isn't
// usable here because it can't carry the bearer token (no custom headers).
export async function* streamSseTokens(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let event = 'message'
  let dataLines: string[] = []

  function flush(): SseFrame | null {
    if (dataLines.length === 0) return null
    const out = { event, data: dataLines.join('\n') }
    event = 'message'
    dataLines = []
    return out
  }

  function parseLine(raw: string): SseFrame | null {
    const line = raw.replace(/\r$/, '')
    if (line === '') return flush()
    if (line.startsWith(':')) return null
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
    return null
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const raw of lines) {
      const frame = parseLine(raw)
      if (!frame) continue
      if (frame.event === 'token') yield frame.data
      else if (frame.event === 'done') return
      else if (frame.event === 'error') throw new ApiError(500, frame.data || 'stream_error')
    }
  }
}
