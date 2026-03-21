import type { LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import { config } from '../../config'

export class MockLLMAdapter implements LLMPort {
  async generateSessionBody(_params: unknown): Promise<string> {
    return 'Mock session body for testing purposes.'
  }

  async *evaluate(_params: unknown): AsyncIterable<EvaluationToken> {
    const delayMs = config.MOCK_LLM_STREAM_DELAY_MS
    const verdict = config.MOCK_LLM_VERDICT
    const tokenCount = config.MOCK_LLM_RESPONSE_TOKENS
    const withFollowUp = config.MOCK_LLM_FOLLOW_UP

    const words =
      'Mock evaluation: your answer demonstrates understanding of the core concept. However, there are areas worth reviewing in more detail.'.split(
        ' ',
      )

    const limit = Math.min(tokenCount, words.length - 1)
    for (let i = 0; i < limit; i++) {
      if (delayMs > 0) await sleep(delayMs)
      yield { chunk: words[i] + ' ', isFinal: false, result: null }
    }

    if (delayMs > 0) await sleep(delayMs)
    yield {
      chunk: '',
      isFinal: true,
      result: {
        verdict,
        analysis: 'Mock analysis: demonstrated core understanding with some gaps in edge case handling.',
        topicsToReview: verdict === 'needs_work' ? ['error handling', 'edge cases'] : [],
        followUpQuestion: withFollowUp ? 'Can you explain how you would handle the error case?' : null,
      },
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
