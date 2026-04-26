import type { LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import { config } from '../../config'

export class MockLLMAdapter implements LLMPort {
  async generateSessionBody(_params: unknown): Promise<string> {
    return 'Mock session body for testing purposes.'
  }

  async *generateSessionBodyStream(_params: unknown): AsyncIterable<string> {
    const delayMs = config.MOCK_LLM_STREAM_DELAY_MS
    const words = 'Mock session body for testing purposes.'.split(' ')
    for (let i = 0; i < words.length; i++) {
      if (delayMs > 0) await sleep(delayMs)
      yield words[i] + (i < words.length - 1 ? ' ' : '')
    }
  }

  askSensei(_params: { question: string; code?: string; language?: string }): {
    stream: AsyncIterable<string>
    usage: Promise<{ inputTokens: number | null; outputTokens: number | null }>
  } {
    let resolveUsage: (u: { inputTokens: number | null; outputTokens: number | null }) => void = () => {}
    const usage = new Promise<{ inputTokens: number | null; outputTokens: number | null }>((res) => {
      resolveUsage = res
    })

    const delayMs = config.MOCK_LLM_STREAM_DELAY_MS
    const words = 'Mock sensei answer: focused exploration goes farther than rushed iteration.'.split(' ')

    async function* generator(): AsyncIterable<string> {
      for (let i = 0; i < words.length; i++) {
        if (delayMs > 0) await sleep(delayMs)
        yield words[i] + (i < words.length - 1 ? ' ' : '')
      }
      resolveUsage({ inputTokens: 50, outputTokens: words.length })
    }

    return { stream: generator(), usage }
  }

  async nudge(_params: unknown): Promise<string> {
    return 'Take another look at the part of your code that handles the value you return. Compare it to what the step is asking for — there is a small mismatch there worth re-examining.'
  }

  async *evaluate(params: { rubric?: unknown }): AsyncIterable<EvaluationToken> {
    const delayMs = config.MOCK_LLM_STREAM_DELAY_MS
    const verdict = config.MOCK_LLM_VERDICT
    const tokenCount = config.MOCK_LLM_RESPONSE_TOKENS
    // Review kata always produce a final evaluation — no follow-ups apply
    // to prose-only katas. Match that in the mock so dev/test flows stay
    // faithful.
    const isReview = !!params.rubric
    const withFollowUp = isReview ? false : config.MOCK_LLM_FOLLOW_UP

    const words = isReview
      ? 'Mock review evaluation: you caught the race condition and the null check; you missed the weak error message.'.split(' ')
      : 'Mock evaluation: your answer demonstrates understanding of the core concept. However, there are areas worth reviewing in more detail.'.split(' ')

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
        analysis: isReview
          ? 'Mock review analysis: caught the two high-severity issues, missed one medium.'
          : 'Mock analysis: demonstrated core understanding with some gaps in edge case handling.',
        topicsToReview: verdict === 'needs_work' ? ['error handling', 'edge cases'] : [],
        followUpQuestion: withFollowUp ? 'Can you explain how you would handle the error case?' : null,
        isFinalEvaluation: !withFollowUp,
      },
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
