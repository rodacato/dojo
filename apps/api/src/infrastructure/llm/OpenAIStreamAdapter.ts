import type { ConversationTurn, LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import { EvaluationStreamParser } from './evaluation-parser'
import { buildPrompt, buildFollowUpPrompt, buildSessionBodyPrompt, buildNudgePrompt, buildReviewPrompt } from '../../prompts/sensei'
import type { Rubric } from '@dojo/shared'
import { config } from '../../config'
import { LLMParseError } from './AnthropicStreamAdapter'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export class OpenAIStreamAdapter implements LLMPort {
  private baseURL: string
  private apiKey: string

  constructor(apiKey: string, baseURL: string) {
    this.apiKey = apiKey
    this.baseURL = baseURL.replace(/\/$/, '')
  }

  async *evaluate(params: {
    ownerRole: string
    ownerContext: string
    sessionBody: string
    userResponse: string
    history: ConversationTurn[]
    category?: string
    rubric?: Rubric
  }): AsyncIterable<EvaluationToken> {
    const messages = buildMessages(params)
    const parser = new EvaluationStreamParser()

    if (config.LLM_STREAM) {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: config.LLM_MODEL,
          max_tokens: 2048,
          stream: true,
          messages,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`OpenAI-compatible API error ${response.status}: ${body}`)
      }

      for await (const chunk of parseSSEStream(response)) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          const prose = parser.push(content)
          if (prose) {
            yield { chunk: prose, isFinal: false, result: null }
          }
        }
      }
    } else {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: config.LLM_MODEL,
          max_tokens: 2048,
          messages,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`OpenAI-compatible API error ${response.status}: ${body}`)
      }

      const data = (await response.json()) as OpenAIResponse
      const text = data.choices?.[0]?.message?.content ?? ''
      const prose = parser.push(text)
      if (prose) {
        yield { chunk: prose, isFinal: false, result: null }
      }
    }

    const { result, error } = parser.finalize()

    if (error || !result) {
      throw new LLMParseError(error ?? 'Unknown parse error')
    }

    yield { chunk: '', isFinal: true, result }
  }

  async generateSessionBody(params: {
    ownerRole: string
    ownerContext: string
    exerciseDescription: string
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

  async *generateSessionBodyStream(params: {
    ownerRole: string
    ownerContext: string
    exerciseDescription: string
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

function buildMessages(params: {
  ownerRole: string
  ownerContext: string
  sessionBody: string
  userResponse: string
  history: ConversationTurn[]
  category?: string
  rubric?: Rubric
}): ChatMessage[] {
  const messages: ChatMessage[] = []

  // Review kata short-circuit — same rule as the Anthropic adapter.
  if (params.rubric) {
    messages.push({
      role: 'user',
      content: buildReviewPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        exerciseTitle: '',
        diff: params.sessionBody,
        review: params.userResponse,
        rubric: params.rubric,
      }),
    })
    return messages
  }

  if (params.history.length === 0) {
    messages.push({
      role: 'user',
      content: buildPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        exerciseTitle: '',
        exerciseDescription: params.sessionBody,
        userResponse: params.userResponse,
        category: params.category,
      }),
    })
  } else {
    const firstTurn = params.history[0]!
    messages.push({
      role: 'user',
      content: buildPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        exerciseTitle: '',
        exerciseDescription: params.sessionBody,
        userResponse: firstTurn.userResponse,
        category: params.category,
      }),
    })
    messages.push({ role: 'assistant', content: firstTurn.llmResponse })
    messages.push({
      role: 'user',
      content: buildFollowUpPrompt({
        followUpResponse: params.userResponse,
        originalFollowUpQuestion: extractFollowUpQuestion(firstTurn.llmResponse),
      }),
    })
  }

  return messages
}

function extractFollowUpQuestion(llmResponse: string): string {
  try {
    const match = llmResponse.match(/"followUpQuestion"\s*:\s*"([^"]+)"/)
    return match?.[1] ?? 'Can you elaborate on your approach?'
  } catch {
    return 'Can you elaborate on your approach?'
  }
}

interface OpenAIChunk {
  choices?: { index: number; delta: { role?: string; content?: string }; finish_reason: string | null }[]
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
