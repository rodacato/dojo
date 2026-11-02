import type { Rubric } from '@dojo/shared'
import { normalizeOutput } from './predict-answer'

export type RevealedAnswer =
  | { shape: 'point'; line: number; title: string; why: string }
  | { shape: 'predict'; output: string; title: string; why: string }
  | { shape: 'order'; lines: number[]; title: string; why: string }

// Shown only once the sensei has delivered the final verdict, never while the kata can still be answered.
export function revealedAnswer(rubric: Rubric | null | undefined): RevealedAnswer | null {
  const answer = rubric?.answer
  const issue = rubric?.expectedIssues[0]
  if (!answer || !issue) return null
  const { title, why } = issue
  if (answer.shape === 'point') return { shape: 'point', line: answer.line, title, why }
  if (answer.shape === 'predict') return { shape: 'predict', output: normalizeOutput(answer.output), title, why }
  return { shape: 'order', lines: answer.accepted[0]!, title, why }
}
