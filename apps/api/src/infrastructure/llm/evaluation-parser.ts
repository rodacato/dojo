import type { EvaluationResult, Verdict } from '../../domain/practice/values'

const EVALUATION_OPEN = '<evaluation>'
const EVALUATION_CLOSE = '</evaluation>'

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

    if (!this.inEvaluation) {
      const openIdx = this.buffer.indexOf(EVALUATION_OPEN)
      if (openIdx === -1) {
        // No evaluation block yet — everything is prose
        const prose = this.buffer
        this.buffer = ''
        this.proseChunks.push(prose)
        return prose
      } else {
        // Prose up to the opening tag
        const prose = this.buffer.slice(0, openIdx)
        if (prose) this.proseChunks.push(prose)
        this.evalBuffer = this.buffer.slice(openIdx + EVALUATION_OPEN.length)
        this.buffer = ''
        this.inEvaluation = true
        return prose
      }
    } else {
      // Accumulate evaluation block — don't forward to client
      this.evalBuffer += chunk
      this.buffer = ''
      return ''
    }
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
      const raw = JSON.parse(jsonStr) as Record<string, unknown>
      return { result: validateEvaluationResult(raw), error: null }
    } catch (e) {
      return {
        result: null,
        error: `Failed to parse <evaluation> JSON: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }
}

const VALID_VERDICTS: Verdict[] = ['passed', 'passed_with_notes', 'needs_work']

function validateEvaluationResult(raw: Record<string, unknown>): EvaluationResult {
  const verdict = raw['verdict']
  if (!VALID_VERDICTS.includes(verdict as Verdict)) {
    throw new Error(`Invalid verdict: ${String(verdict)}`)
  }

  const analysis = raw['analysis']
  if (typeof analysis !== 'string' || !analysis.trim()) {
    throw new Error('Missing or empty analysis')
  }

  const topicsToReview = raw['topicsToReview']
  if (!Array.isArray(topicsToReview)) {
    throw new Error('topicsToReview must be an array')
  }

  const followUpQuestion = raw['followUpQuestion']
  if (followUpQuestion !== null && typeof followUpQuestion !== 'string') {
    throw new Error('followUpQuestion must be a string or null')
  }

  const isFinalEvaluation = raw['isFinalEvaluation']
  if (typeof isFinalEvaluation !== 'boolean') {
    throw new Error('isFinalEvaluation must be a boolean')
  }

  return {
    verdict: verdict as Verdict,
    analysis,
    topicsToReview: topicsToReview.filter((t): t is string => typeof t === 'string'),
    followUpQuestion: typeof followUpQuestion === 'string' ? followUpQuestion : null,
    isFinalEvaluation,
  }
}
