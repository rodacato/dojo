import Anthropic from '@anthropic-ai/sdk'
import type { ConversationTurn, LLMPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import { EvaluationStreamParser } from './evaluation-parser'
import { buildPrompt, buildFollowUpPrompt, buildSessionBodyPrompt } from '../../prompts/sensei'
import { config } from '../../config'

export class AnthropicStreamAdapter implements LLMPort {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      ...(config.LLM_BASE_URL ? { baseURL: config.LLM_BASE_URL } : {}),
    })
  }

  async *evaluate(params: {
    ownerRole: string
    ownerContext: string
    sessionBody: string
    userResponse: string
    history: ConversationTurn[]
  }): AsyncIterable<EvaluationToken> {
    const messages = buildMessages(params)
    const parser = new EvaluationStreamParser()

    const stream = this.client.messages.stream({
      model: config.LLM_MODEL,
      max_tokens: 2048,
      messages,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const prose = parser.push(event.delta.text)
        if (prose) {
          yield { chunk: prose, isFinal: false, result: null }
        }
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

    const response = await this.client.messages.create({
      model: config.LLM_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }

    return block.text
  }
}

export class LLMParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LLMParseError'
  }
}

function buildMessages(params: {
  ownerRole: string
  ownerContext: string
  sessionBody: string
  userResponse: string
  history: ConversationTurn[]
}): Anthropic.Messages.MessageParam[] {
  const messages: Anthropic.Messages.MessageParam[] = []

  if (params.history.length === 0) {
    // First evaluation — single user message with the full prompt
    messages.push({
      role: 'user',
      content: buildPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        exerciseTitle: '', // TODO: pass exerciseTitle through params in Phase 1
        exerciseDescription: params.sessionBody,
        userResponse: params.userResponse,
      }),
    })
  } else {
    // Follow-up exchange — reconstruct the conversation
    const firstTurn = params.history[0]!
    messages.push({
      role: 'user',
      content: buildPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        exerciseTitle: '',
        exerciseDescription: params.sessionBody,
        userResponse: firstTurn.userResponse,
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
