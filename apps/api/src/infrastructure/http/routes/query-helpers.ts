import { sql } from 'drizzle-orm'
import { attempts, sessions } from '../../persistence/drizzle/schema'

/**
 * Verdict subquery — extracts the verdict string from the final evaluated attempt.
 * Use as a select field: `verdict: verdictSubquery()`
 */
export function verdictSubquery() {
  return sql<string | null>`(
    SELECT ${attempts.llmResponse}::jsonb->>'verdict'
    FROM ${attempts}
    WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
    LIMIT 1
  )`
}

/**
 * Calculate the current streak (consecutive days with sessions) from a list of date strings.
 * Looks backwards from today; if no session today, starts from yesterday.
 */
export function calculateStreak(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0

  const dateSet = new Set(sessionDates)
  const today = new Date().toISOString().slice(0, 10)
  let streak = 0
  const current = new Date()

  // Start from today; if no session today, start from yesterday
  if (!dateSet.has(today)) {
    current.setDate(current.getDate() - 1)
  }

  while (true) {
    const dateStr = current.toISOString().slice(0, 10)
    if (!dateSet.has(dateStr)) break
    streak++
    current.setDate(current.getDate() - 1)
  }

  return streak
}
