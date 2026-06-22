import Anthropic from '@anthropic-ai/sdk'
import type { LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import type { EvaluationStreamParser } from './evaluation-parser'
import { buildSessionBodyPrompt, buildNudgePrompt, buildAskSenseiPrompt } from '../../prompts/sensei'
import { config } from '../../config'
import { runEvaluation, type SenseiMessage, type BuildMessagesParams } from './sensei-evaluation'

export { LLMParseError } from './sensei-evaluation'

// Shellm and similar proxies frequently exceed 30s p50 for session-body
// generation. 90s covers typical p99 without letting a dead upstream keep
// the background task alive forever.
const REQUEST_TIMEOUT_MS = 90_000

export class AnthropicStreamAdapter implements LLMPort {
  private readonly client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 1,
      ...(config.LLM_BASE_URL ? { baseURL: config.LLM_BASE_URL } : {}),
    })
  }

  async *evaluate(params: BuildMessagesParams): AsyncIterable<EvaluationToken> {
    yield* runEvaluation(params, (messages, parser) =>
      config.LLM_STREAM ? this.evaluateStreaming(messages, parser) : this.evaluateOnce(messages, parser),
    )
  }

  private async *evaluateStreaming(
    messages: SenseiMessage[],
    parser: EvaluationStreamParser,
  ): AsyncIterable<EvaluationToken> {
    const stream = this.client.messages.stream({
      model: config.LLM_MODEL,
      max_tokens: 2048,
      messages,
    })

    for await (const event of stream) {
      if (event.type !== 'content_block_delta' || event.delta.type !== 'text_delta') continue
      const prose = parser.push(event.delta.text)
      if (prose) {
        yield { chunk: prose, isFinal: false, result: null }
      }
    }
  }

  private async *evaluateOnce(
    messages: SenseiMessage[],
    parser: EvaluationStreamParser,
  ): AsyncIterable<EvaluationToken> {
    const response = await this.client.messages.create({
      model: config.LLM_MODEL,
      max_tokens: 2048,
      messages,
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const prose = parser.push(text)
    if (prose) {
      yield { chunk: prose, isFinal: false, result: null }
    }
  }

  async generateSessionBody(params: {
    ownerRole: string
    ownerContext: string
    kataDescription: string
  }): Promise<string> {
    const prompt = buildSessionBodyPrompt(params)
    const reqId = crypto.randomUUID()
    const startedAt = Date.now()

    console.log(JSON.stringify({
      evt: 'llm.request',
      purpose: 'session_body',
      reqId,
      model: config.LLM_MODEL,
      baseUrl: config.LLM_BASE_URL ?? 'default',
      promptChars: prompt.length,
    }))

    try {
      const response = await this.client.messages.create({
        model: config.LLM_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const block = response.content[0]
      if (block?.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic')
      }

      console.log(JSON.stringify({
        evt: 'llm.response',
        purpose: 'session_body',
        reqId,
        latencyMs: Date.now() - startedAt,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        stopReason: response.stop_reason,
        responseChars: block.text.length,
      }))

      return block.text
    } catch (err) {
      console.error(JSON.stringify({
        evt: 'llm.error',
        purpose: 'session_body',
        reqId,
        latencyMs: Date.now() - startedAt,
        message: err instanceof Error ? err.message : String(err),
        status: (err as { status?: number })?.status,
        name: err instanceof Error ? err.name : undefined,
      }))
      throw err
    }
  }

  async *generateSessionBodyStream(params: {
    ownerRole: string
    ownerContext: string
    kataDescription: string
  }): AsyncIterable<string> {
    const prompt = buildSessionBodyPrompt(params)
    const reqId = crypto.randomUUID()
    const startedAt = Date.now()

    console.log(JSON.stringify({
      evt: 'llm.request',
      purpose: 'session_body_stream',
      reqId,
      model: config.LLM_MODEL,
      baseUrl: config.LLM_BASE_URL ?? 'default',
      promptChars: prompt.length,
    }))

    let chars = 0
    try {
      const stream = this.client.messages.stream({
        model: config.LLM_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text
          chars += chunk.length
          yield chunk
        }
      }

      console.log(JSON.stringify({
        evt: 'llm.response',
        purpose: 'session_body_stream',
        reqId,
        latencyMs: Date.now() - startedAt,
        responseChars: chars,
      }))
    } catch (err) {
      console.error(JSON.stringify({
        evt: 'llm.error',
        purpose: 'session_body_stream',
        reqId,
        latencyMs: Date.now() - startedAt,
        message: err instanceof Error ? err.message : String(err),
        status: (err as { status?: number })?.status,
        name: err instanceof Error ? err.name : undefined,
      }))
      throw err
    }
  }

  async nudge(params: {
    stepInstruction: string
    testCode: string | null
    userCode: string
    stdout?: string
    stderr?: string
  }): Promise<string> {
    const prompt = buildNudgePrompt(params)
    const response = await this.client.messages.create({
      model: config.LLM_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block?.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }
    return block.text.trim()
  }

  askSensei(params: {
    question: string
    code?: string
    language?: string
  }): {
    stream: AsyncIterable<string>
    usage: Promise<{ inputTokens: number | null; outputTokens: number | null }>
  } {
    const prompt = buildAskSenseiPrompt(params)
    const reqId = crypto.randomUUID()
    const startedAt = Date.now()

    let resolveUsage: (u: { inputTokens: number | null; outputTokens: number | null }) => void = () => {}
    let rejectUsage: (e: unknown) => void = () => {}
    const usage = new Promise<{ inputTokens: number | null; outputTokens: number | null }>((res, rej) => {
      resolveUsage = res
      rejectUsage = rej
    })

    const client = this.client

    async function* generator(): AsyncIterable<string> {
      console.log(JSON.stringify({
        evt: 'llm.request',
        purpose: 'ask_sensei',
        reqId,
        model: config.LLM_MODEL,
        promptChars: prompt.length,
      }))

      let inputTokens: number | null = null
      let outputTokens: number | null = null

      try {
        const sdkStream = client.messages.stream({
          model: config.LLM_MODEL,
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const event of sdkStream) {
          if (event.type === 'message_start') {
            inputTokens = event.message.usage?.input_tokens ?? null
          } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield event.delta.text
          } else if (event.type === 'message_delta') {
            outputTokens = event.usage?.output_tokens ?? null
          }
        }

        console.log(JSON.stringify({
          evt: 'llm.response',
          purpose: 'ask_sensei',
          reqId,
          latencyMs: Date.now() - startedAt,
          inputTokens,
          outputTokens,
        }))
        resolveUsage({ inputTokens, outputTokens })
      } catch (err) {
        console.error(JSON.stringify({
          evt: 'llm.error',
          purpose: 'ask_sensei',
          reqId,
          latencyMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : String(err),
          status: (err as { status?: number })?.status,
        }))
        rejectUsage(err)
        throw err
      }
    }

    return { stream: generator(), usage }
  }
}


