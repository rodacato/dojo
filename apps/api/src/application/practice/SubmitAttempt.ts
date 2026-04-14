import { SessionNotFoundError } from '../../domain/shared/errors'
import type { SessionId } from '../../domain/shared/types'
import { Attempt } from '../../domain/practice/attempt'
import type { ConversationTurn, EventBusPort, LLMPort, SessionRepositoryPort } from '../../domain/practice/ports'
import type { EvaluationToken } from '../../domain/practice/values'

interface Deps {
  sessionRepo: SessionRepositoryPort
  llm: LLMPort
  eventBus: EventBusPort
}

export class SubmitAttempt {
  constructor(private readonly deps: Deps) {}

  async *execute(params: {
    sessionId: SessionId
    userResponse: string
    ownerRole: string
    ownerContext: string
    executionContext?: string // test results injected before LLM evaluation
    category?: string // exercise.category — shapes sensei prompt (e.g. debugging)
  }): AsyncIterable<EvaluationToken> {
    const session = await this.deps.sessionRepo.findById(params.sessionId)
    if (!session) throw new SessionNotFoundError(params.sessionId)

    const history: ConversationTurn[] = session.attempts
      .filter((a) => a.evaluationResult !== null)
      .map((a) => ({
        userResponse: a.userResponse,
        llmResponse: a.evaluationResult?.analysis ?? '',
      }))

    let finalToken: EvaluationToken | null = null

    // Append execution results to user response so the sensei sees them
    const userResponseWithContext = params.executionContext
      ? `${params.userResponse}\n\n${params.executionContext}`
      : params.userResponse

    for await (const token of this.deps.llm.evaluate({
      ownerRole: params.ownerRole,
      ownerContext: params.ownerContext,
      sessionBody: session.body,
      userResponse: userResponseWithContext,
      history,
      category: params.category,
    })) {
      yield token
      if (token.isFinal) {
        finalToken = token
      }
    }

    if (finalToken?.result) {
      const attempt = Attempt.create({
        sessionId: params.sessionId,
        userResponse: params.userResponse,
        evaluationResult: finalToken.result,
        isFinalEvaluation: finalToken.result.isFinalEvaluation,
      })

      session.addAttempt(attempt)
      await this.deps.sessionRepo.save(session)

      for (const event of session.pullEvents()) {
        await this.deps.eventBus.publish(event)
      }
    }
  }
}
