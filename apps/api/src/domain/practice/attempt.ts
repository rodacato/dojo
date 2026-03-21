import { AttemptId } from '../shared/types'
import type { SessionId } from '../shared/types'
import type { EvaluationResult } from './values'

export interface AttemptProps {
  id: AttemptId
  sessionId: SessionId
  userResponse: string
  evaluationResult: EvaluationResult | null
  isFinalEvaluation: boolean
  submittedAt: Date
}

export class Attempt {
  readonly id: AttemptId
  readonly sessionId: SessionId
  readonly userResponse: string
  readonly evaluationResult: EvaluationResult | null
  readonly isFinalEvaluation: boolean
  readonly submittedAt: Date

  constructor(props: AttemptProps) {
    this.id = props.id
    this.sessionId = props.sessionId
    this.userResponse = props.userResponse
    this.evaluationResult = props.evaluationResult
    this.isFinalEvaluation = props.isFinalEvaluation
    this.submittedAt = props.submittedAt
  }

  static create(params: {
    sessionId: SessionId
    userResponse: string
    evaluationResult: EvaluationResult
    isFinalEvaluation: boolean
  }): Attempt {
    return new Attempt({
      id: AttemptId(crypto.randomUUID()),
      sessionId: params.sessionId,
      userResponse: params.userResponse,
      evaluationResult: params.evaluationResult,
      isFinalEvaluation: params.isFinalEvaluation,
      submittedAt: new Date(),
    })
  }
}
