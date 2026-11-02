import type { Rubric } from '@dojo/shared'
import { normalizeOutput } from './predict-answer'

export type RevealedAnswer =
  | { shape: 'point'; line: number; title: string; why: string }
  | { shape: 'predict'; output: string; title: string; why: string }

// Shown only once the sensei has delivered the final verdict, never while the kata can still be answered.
export function revealedAnswer(rubric: Rubric | null | undefined): RevealedAnswer | null {
  const answer = rubric?.answer
  const issue = rubric?.expectedIssues[0]
  if (!answer || !issue) return null
  return answer.shape === 'point'
    ? { shape: 'point', line: answer.line, title: issue.title, why: issue.why }
    : { shape: 'predict', output: normalizeOutput(answer.output), title: issue.title, why: issue.why }
}
