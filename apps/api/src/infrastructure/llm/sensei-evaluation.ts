import type { ConversationTurn } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'
import type { Rubric } from '@dojo/shared'
import { EvaluationStreamParser } from './evaluation-parser'
import { buildPrompt, buildFollowUpPrompt, buildReviewPrompt } from '../../prompts/sensei'

// Transport-agnostic chat message. Structurally a subtype of both the OpenAI
// chat shape and Anthropic's MessageParam (content as a plain string), so the
// same array feeds either SDK without a per-adapter copy of this logic.
export interface SenseiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BuildMessagesParams {
  ownerRole: string
  ownerContext: string
  kataTitle: string
  sessionBody: string
  userResponse: string
  history: ConversationTurn[]
  category?: string
  rubric?: Rubric
}

export class LLMParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LLMParseError'
  }
}

export function buildMessages(params: BuildMessagesParams): SenseiMessage[] {
  const messages: SenseiMessage[] = []

  // Review kata: rubric presence switches the whole prompt. No history is
  // expected — review kata don't have follow-ups.
  if (params.rubric) {
    messages.push({
      role: 'user',
      content: buildReviewPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        kataTitle: params.kataTitle,
        diff: params.sessionBody,
        review: params.userResponse,
        rubric: params.rubric,
      }),
    })
    return messages
  }

  if (params.history.length === 0) {
    // First evaluation — single user message with the full prompt
    messages.push({
      role: 'user',
      content: buildPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        kataTitle: params.kataTitle,
        kataDescription: params.sessionBody,
        userResponse: params.userResponse,
        category: params.category,
      }),
    })
  } else {
    // Follow-up exchange — reconstruct the conversation
    const firstTurn = params.history[0]
    messages.push({
      role: 'user',
      content: buildPrompt({
        ownerRole: params.ownerRole,
        ownerContext: params.ownerContext,
        kataTitle: params.kataTitle,
        kataDescription: params.sessionBody,
        userResponse: firstTurn.userResponse,
        category: params.category,
      }),
    })
    messages.push(
      { role: 'assistant', content: firstTurn.llmResponse },
      {
        role: 'user',
        content: buildFollowUpPrompt({
          followUpResponse: params.userResponse,
          originalFollowUpQuestion: extractFollowUpQuestion(firstTurn.llmResponse),
        }),
      },
    )
  }

  return messages
}

const FOLLOW_UP_QUESTION = /"followUpQuestion"\s*:\s*"([^"]+)"/

export function extractFollowUpQuestion(llmResponse: string): string {
  try {
    const match = FOLLOW_UP_QUESTION.exec(llmResponse)
    return match?.[1] ?? 'Can you elaborate on your approach?'
  } catch {
    return 'Can you elaborate on your approach?'
  }
}

// Shared evaluation orchestration: build the prompt messages, drive the
// adapter's transport, then finalize the parser. `tokensFor` is the only
// transport-specific piece — each adapter decides stream-vs-once and how to
// reach its SDK.
export async function* runEvaluation(
  params: BuildMessagesParams,
  tokensFor: (messages: SenseiMessage[], parser: EvaluationStreamParser) => AsyncIterable<EvaluationToken>,
): AsyncIterable<EvaluationToken> {
  const messages = buildMessages(params)
  const parser = new EvaluationStreamParser()

  for await (const token of tokensFor(messages, parser)) {
    yield token
  }

  const { result, error } = parser.finalize()

  if (error || !result) {
    throw new LLMParseError(error ?? 'Unknown parse error')
  }

  yield { chunk: '', isFinal: true, result }
}
