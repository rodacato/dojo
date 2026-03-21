export type SessionStatus = 'active' | 'completed' | 'failed'
export type Verdict = 'passed' | 'passed_with_notes' | 'needs_work'

export interface EvaluationResult {
  readonly verdict: Verdict
  readonly analysis: string
  readonly topicsToReview: string[]
  readonly followUpQuestion: string | null // null on final evaluation
  readonly isFinalEvaluation: boolean
}

export interface EvaluationToken {
  readonly chunk: string // streamed text fragment
  readonly isFinal: boolean // true on the last token
  readonly result: EvaluationResult | null // only present when isFinal=true
}
