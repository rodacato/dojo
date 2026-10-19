import { SessionNotFoundError } from '../../domain/shared/errors'
import { AttemptId, SessionId } from '../../domain/shared/types'
import { Attempt } from '../../domain/practice/attempt'
import type { ConversationTurn, LLMPort, SessionRepositoryPort } from '../../domain/practice/ports'
import type { EventBusPort } from '../../domain/shared/events'
import type { EvaluationToken } from '../../domain/practice/values'
import type { PointContext } from '../../domain/practice/point-answer'
import type { Rubric } from '@dojo/shared'

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
    kataTitle: string
    executionContext?: string // test results injected before LLM evaluation
    category?: string // kata.category — shapes sensei prompt (e.g. debugging)
    rubric?: Rubric // review kata rubric — switches the adapter to the review prompt
    point?: PointContext // point kata: the line tapped vs the correct one
  }): AsyncIterable<EvaluationToken> {
    const session = await this.deps.sessionRepo.findById(params.sessionId)
    if (!session) throw new SessionNotFoundError(params.sessionId)

    const history: ConversationTurn[] = session.attempts
      .filter((a) => a.evaluationResult !== null)
      .map((a) => ({
        userResponse: a.userResponse,
        llmResponse: a.evaluationResult?.analysis ?? '',
        followUpQuestion: a.evaluationResult?.followUpQuestion ?? null,
      }))

    // Append execution results to user response so the sensei sees them
    const userResponseWithContext = params.executionContext
      ? `${params.userResponse}\n\n${params.executionContext}`
      : params.userResponse

    for await (const token of this.deps.llm.evaluate({
      ownerRole: params.ownerRole,
      ownerContext: params.ownerContext,
      kataTitle: params.kataTitle,
      sessionBody: session.body,
      userResponse: userResponseWithContext,
      history,
      category: params.category,
      rubric: params.rubric,
      point: params.point,
    })) {
      // Saved before the final token goes out: the client reads the session and posts feedback as soon as it lands.
      if (token.isFinal && token.result) {
        const attempt = Attempt.create({
          sessionId: params.sessionId,
          userResponse: params.userResponse,
          evaluationResult: token.result,
          isFinalEvaluation: token.result.isFinalEvaluation,
        })

        session.addAttempt(attempt)
        await this.deps.sessionRepo.save(session)

        for (const event of session.pullEvents()) {
          await this.deps.eventBus.publish(event)
        }
      }
      yield token
    }
  }

  /** Persist a partial attempt when the LLM stream errors mid-response. */
  async recordIncompleteAttempt(params: {
    attemptId: string
    sessionId: string
    userResponse: string
    llmResponse: string
  }): Promise<void> {
    await this.deps.sessionRepo.saveIncompleteAttempt({
      attemptId: AttemptId(params.attemptId),
      sessionId: SessionId(params.sessionId),
      userResponse: params.userResponse,
      llmResponse: params.llmResponse,
    })
  }
}
