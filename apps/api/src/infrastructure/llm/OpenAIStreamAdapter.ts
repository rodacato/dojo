import type { ConversationTurn, LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import type { EvaluationStreamParser } from './evaluation-parser'
import { buildSessionBodyPrompt, buildNudgePrompt, buildAskSenseiPrompt } from '../../prompts/sensei'
import type { Rubric } from '@dojo/shared'
import { config } from '../../config'
import { runEvaluation, type SenseiMessage } from './sensei-evaluation'

export class OpenAIStreamAdapter implements LLMPort {
  private readonly baseURL: string
  private readonly apiKey: string

  constructor(apiKey: string, baseURL: string) {
    this.apiKey = apiKey
    this.baseURL = baseURL.replace(/\/$/, '')
  }

  async *evaluate(params: {
    ownerRole: string
    ownerContext: string
    kataTitle: string
    sessionBody: string
    userResponse: string
    history: ConversationTurn[]
    category?: string
    rubric?: Rubric
  }): AsyncIterable<EvaluationToken> {
    yield* runEvaluation(params, (messages, parser) =>
      config.LLM_STREAM ? this.evaluateStreaming(messages, parser) : this.evaluateOnce(messages, parser),
    )
  }

  private async *evaluateStreaming(
    messages: SenseiMessage[],
    parser: EvaluationStreamParser,
  ): AsyncIterable<EvaluationToken> {
    const response = await this.chatCompletion({ max_tokens: 2048, stream: true, messages })

    for await (const chunk of parseSSEStream(response)) {
      const content = chunk.choices?.[0]?.delta?.content
      if (!content) continue
      const prose = parser.push(content)
      if (prose) {
        yield { chunk: prose, isFinal: false, result: null }
      }
    }
  }

  private async *evaluateOnce(
    messages: SenseiMessage[],
    parser: EvaluationStreamParser,
  ): AsyncIterable<EvaluationToken> {
    const response = await this.chatCompletion({ max_tokens: 2048, messages })

    const data = (await response.json()) as OpenAIResponse
    const text = data.choices?.[0]?.message?.content ?? ''
    const prose = parser.push(text)
    if (prose) {
      yield { chunk: prose, isFinal: false, result: null }
    }
  }

  private async chatCompletion(body: Record<string, unknown>): Promise<Response> {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: config.LLM_MODEL, ...body }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OpenAI-compatible API error ${response.status}: ${text}`)
    }

    return response
  }

  async generateSessionBody(params: {
    ownerRole: string
    ownerContext: string
    kataDescription: string
  }): Promise<string> {
    const prompt = buildSessionBodyPrompt(params)

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config.LLM_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`OpenAI-compatible API error ${response.status}: ${body}`)
    }

    const data = (await response.json()) as OpenAIResponse
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Unexpected response from OpenAI-compatible API')
    }

    return content
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
    const baseURL = this.baseURL
    const apiKey = this.apiKey

    let resolveUsage: (u: { inputTokens: number | null; outputTokens: number | null }) => void = () => {}
    let rejectUsage: (e: unknown) => void = () => {}
    const usage = new Promise<{ inputTokens: number | null; outputTokens: number | null }>((res, rej) => {
      resolveUsage = res
      rejectUsage = rej
    })

    async function* generator(): AsyncIterable<string> {
      try {
        const response = await fetch(`${baseURL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: config.LLM_MODEL,
            max_tokens: 512,
            stream: true,
            stream_options: { include_usage: true },
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!response.ok) {
          const body = await response.text()
          throw new Error(`OpenAI-compatible API error ${response.status}: ${body}`)
        }

        let inputTokens: number | null = null
        let outputTokens: number | null = null

        for await (const chunk of parseSSEStream(response)) {
          const content = chunk.choices?.[0]?.delta?.content
          if (content) yield content
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens ?? null
            outputTokens = chunk.usage.completion_tokens ?? null
          }
        }

        resolveUsage({ inputTokens, outputTokens })
      } catch (err) {
        rejectUsage(err)
        throw err
      }
    }

    return { stream: generator(), usage }
  }

  async *generateSessionBodyStream(params: {
    ownerRole: string
    ownerContext: string
    kataDescription: string
  }): AsyncIterable<string> {
    const prompt = buildSessionBodyPrompt(params)

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config.LLM_MODEL,
        max_tokens: 1024,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`OpenAI-compatible API error ${response.status}: ${body}`)
    }

    for await (const chunk of parseSSEStream(response)) {
      const content = chunk.choices?.[0]?.delta?.content
      if (content) yield content
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
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config.LLM_MODEL,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`OpenAI-compatible API error ${response.status}: ${body}`)
    }
    const data = (await response.json()) as OpenAIResponse
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Unexpected response from OpenAI-compatible API')
    }
    return content.trim()
  }
}

interface OpenAIChunk {
  choices?: { index: number; delta: { role?: string; content?: string }; finish_reason: string | null }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

interface OpenAIResponse {
  choices?: { message: { content: string } }[]
}

async function* parseSSEStream(response: Response): AsyncGenerator<OpenAIChunk> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return
      try {
        yield JSON.parse(data)
      } catch {
        // skip malformed chunks
      }
    }
  }
}
