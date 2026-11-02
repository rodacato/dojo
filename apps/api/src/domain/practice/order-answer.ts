import type { Rubric } from '@dojo/shared'
import { codeLines } from './point-answer'

export interface OrderContext {
  lines: string[]
  accepted: number[][]
  ordered: number[]
  matches: boolean
  distractorsUsed: number[]
  missing: number[]
  divergesAt: number | null
  why: string
}

const STORED_ANSWER = /^Ordered lines: ([\d, ]+)\n\n([\s\S]+)$/

export function isValidOrder(code: string, order: number[]): boolean {
  const count = codeLines(code).length
  return (
    order.length > 0 &&
    new Set(order).size === order.length &&
    order.every((line) => Number.isInteger(line) && line >= 1 && line <= count)
  )
}

// Stored as plain text so results, retries and history read it like any other answer.
export function composeOrderAnswer(order: number[], why: string): string {
  return `Ordered lines: ${order.join(', ')}\n\n${why.trim()}`
}

export function parseOrderAnswer(stored: string): { order: number[]; why: string } | null {
  const match = STORED_ANSWER.exec(stored)
  if (!match) return null
  return { order: match[1]!.split(', ').map(Number), why: match[2]!.trim() }
}

function sharedPrefix(a: number[], b: number[]): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

// The facts the sensei grades against: computed here so it never has to work them out.
export function compareOrder(lineCount: number, accepted: number[][], ordered: number[]) {
  const matches = accepted.some((order) => order.length === ordered.length && sharedPrefix(order, ordered) === order.length)
  const used = new Set(accepted.flat())
  const closest = accepted.reduce((best, order) => (sharedPrefix(order, ordered) > sharedPrefix(best, ordered) ? order : best))
  const distractorsUsed = ordered.filter((line) => !used.has(line))
  const missing = Array.from({ length: lineCount }, (_, i) => i + 1).filter(
    (line) => accepted.every((order) => order.includes(line)) && !ordered.includes(line),
  )
  return { matches, distractorsUsed, missing, divergesAt: matches ? null : sharedPrefix(closest, ordered) + 1 }
}

export function orderContextFor(
  starterCode: string | null,
  rubric: Rubric | null,
  stored: string,
): OrderContext | undefined {
  const accepted = rubric?.answer?.shape === 'order' ? rubric.answer.accepted : undefined
  if (!starterCode || !accepted?.length) return undefined
  const answer = parseOrderAnswer(stored)
  if (!answer) return undefined
  const lines = codeLines(starterCode)
  return { lines, accepted, ordered: answer.order, why: answer.why, ...compareOrder(lines.length, accepted, answer.order) }
}
