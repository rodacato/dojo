import { sql } from 'drizzle-orm'
import { attempts, sessions } from './drizzle/schema'

// Status cannot define practice: `failed` covers both NEEDS WORK and a timeout with no evaluation.
export function isEligiblePractice() {
  return sql<boolean>`EXISTS (
    SELECT 1 FROM ${attempts}
    WHERE ${attempts.sessionId} = ${sessions.id}
      AND ${attempts.isFinalEvaluation} = true
      AND ${attempts.llmResponse} != ''
  )`
}
