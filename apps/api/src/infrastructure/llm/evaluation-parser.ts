import { verdictSchema } from '@dojo/shared'
import { z } from 'zod'
import type { EvaluationResult } from '../../domain/practice/values'

const EVALUATION_OPEN = '<evaluation>'
const EVALUATION_CLOSE = '</evaluation>'

// A chunk boundary can fall inside the opening tag, so a trailing prefix of it is held back.
function partialOpenTagLength(text: string): number {
  for (let n = Math.min(text.length, EVALUATION_OPEN.length - 1); n > 0; n--) {
    if (EVALUATION_OPEN.startsWith(text.slice(-n))) return n
  }
  return 0
}

/**
 * Incrementally accumulates stream chunks and detects the <evaluation> block.
 * Call `push(chunk)` for each streamed token, then `finalize()` when the
 * stream ends to get the parsed result.
 */
export class EvaluationStreamParser {
  private buffer = ''
  private inEvaluation = false
  private evalBuffer = ''
  private done = false

  readonly proseChunks: string[] = []

  /**
   * Push a new chunk from the stream.
   * Returns the prose fragment to forward to the client (if any).
   */
  push(chunk: string): string {
    if (this.done) return ''

    this.buffer += chunk

    if (this.inEvaluation) {
      // Accumulate evaluation block — don't forward to client
      this.evalBuffer += chunk
      this.buffer = ''
      return ''
    }

    const openIdx = this.buffer.indexOf(EVALUATION_OPEN)
    if (openIdx === -1) {
      const held = partialOpenTagLength(this.buffer)
      const prose = this.buffer.slice(0, this.buffer.length - held)
      this.buffer = this.buffer.slice(this.buffer.length - held)
      if (prose) this.proseChunks.push(prose)
      return prose
    }

    // Prose up to the opening tag
    const prose = this.buffer.slice(0, openIdx)
    if (prose) this.proseChunks.push(prose)
    this.evalBuffer = this.buffer.slice(openIdx + EVALUATION_OPEN.length)
    this.buffer = ''
    this.inEvaluation = true
    return prose
  }

  /**
   * Call when the stream ends. Returns the parsed EvaluationResult.
   */
  finalize(): { result: EvaluationResult | null; error: string | null } {
    this.done = true

    if (!this.inEvaluation) {
      return { result: null, error: 'Stream ended without <evaluation> block' }
    }

    const closeIdx = this.evalBuffer.indexOf(EVALUATION_CLOSE)
    if (closeIdx === -1) {
      return { result: null, error: 'Stream ended before </evaluation> closing tag' }
    }

    const jsonStr = this.evalBuffer.slice(0, closeIdx).trim()

    try {
      return { result: validateEvaluationResult(JSON.parse(jsonStr)), error: null }
    } catch (e) {
      return {
        result: null,
        error: `Failed to parse <evaluation> JSON: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }
}

const evaluationSchema = z.object({
  verdict: verdictSchema,
  analysis: z.string().refine((text) => text.trim().length > 0, 'Missing or empty analysis'),
  topicsToReview: z.array(z.unknown()).transform((topics) => topics.filter((t): t is string => typeof t === 'string')),
  followUpQuestion: z.string().nullable(),
  isFinalEvaluation: z.boolean(),
})

function validateEvaluationResult(raw: unknown): EvaluationResult {
  const parsed = evaluationSchema.safeParse(raw)
  if (!parsed.success) throw new Error(z.prettifyError(parsed.error))
  return parsed.data
}
