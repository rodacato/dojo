import type { LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'

export class MockLLMAdapter implements LLMPort {
  async generateSessionBody(_params: unknown): Promise<string> {
    return 'Mock session body for testing purposes.'
  }

  async *evaluate(_params: unknown): AsyncIterable<EvaluationToken> {
    yield { chunk: 'Mock evaluation ', isFinal: false, result: null }
    yield {
      chunk: 'complete.',
      isFinal: true,
      result: {
        verdict: 'passed',
        analysis: 'Mock analysis: good reasoning demonstrated.',
        topicsToReview: [],
        followUpQuestion: null,
      },
    }
  }
}
