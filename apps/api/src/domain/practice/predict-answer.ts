import { PREDICTED_OUTPUT_MAX, type Rubric } from '@dojo/shared'

export interface PredictContext {
  code: string
  expected: string
  predicted: string
  matches: boolean
  why: string
}

const STORED_ANSWER = /^Predicted output:\n```\n([\s\S]*?)\n```\n\n([\s\S]+)$/

// Line endings, whitespace at line ends and trailing newlines never decide a prediction.
export function normalizeOutput(output: string): string {
  return output
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}

export function isValidPrediction(output: string): boolean {
  return normalizeOutput(output).length > 0 && output.length <= PREDICTED_OUTPUT_MAX && !output.includes('```')
}

// Stored as plain text so results, retries and history read it like any other answer.
export function composePredictAnswer(output: string, why: string): string {
  return `Predicted output:\n\`\`\`\n${normalizeOutput(output)}\n\`\`\`\n\n${why.trim()}`
}

export function parsePredictAnswer(stored: string): { output: string; why: string } | null {
  const match = STORED_ANSWER.exec(stored)
  if (!match) return null
  return { output: match[1]!, why: match[2]!.trim() }
}

export function predictContextFor(
  starterCode: string | null,
  rubric: Rubric | null,
  stored: string,
): PredictContext | undefined {
  const expected = rubric?.answer?.shape === 'predict' ? rubric.answer.output : undefined
  if (!starterCode || expected === undefined) return undefined
  const answer = parsePredictAnswer(stored)
  if (!answer) return undefined
  return {
    code: starterCode,
    expected: normalizeOutput(expected),
    predicted: answer.output,
    matches: answer.output === normalizeOutput(expected),
    why: answer.why,
  }
}
