import type { Rubric } from '@dojo/shared'

export interface PointContext {
  code: string
  correctLine: number
  pointedLine: number
  why: string
}

const STORED_ANSWER = /^Line (\d+): [^\n]*\n\n([\s\S]+)$/

export function codeLines(code: string): string[] {
  return code.replace(/\n+$/, '').split('\n')
}

export function isLineInCode(code: string, line: number): boolean {
  return Number.isInteger(line) && line >= 1 && line <= codeLines(code).length
}

// Stored as plain text so results, retries and history read it like any other answer.
export function composePointAnswer(code: string, line: number, why: string): string {
  return `Line ${line}: ${codeLines(code)[line - 1]!.trim()}\n\n${why.trim()}`
}

export function parsePointAnswer(stored: string): { line: number; why: string } | null {
  const match = STORED_ANSWER.exec(stored)
  if (!match) return null
  return { line: Number(match[1]), why: match[2]!.trim() }
}

export function pointContextFor(
  starterCode: string | null,
  rubric: Rubric | null,
  stored: string,
): PointContext | undefined {
  const correctLine = rubric?.answer?.line
  if (!starterCode || !correctLine) return undefined
  const answer = parsePointAnswer(stored)
  if (!answer) return undefined
  return { code: starterCode, correctLine, pointedLine: answer.line, why: answer.why }
}
