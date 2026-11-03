import type { ExecutionResult } from './ports'
import type { EvaluationResult } from './values'

export interface TestGate {
  testsPassed: boolean
}

// A bug-fix kata ships broken starter code and tests that only a real fix passes; those tests gate the verdict.
export function isBugFixKata(kata: { type: string; category: string; testCode?: string | null }): boolean {
  return kata.type === 'code' && kata.category === 'debugging' && !!kata.testCode
}

export function testsPassed(result: ExecutionResult): boolean {
  return result.exitCode === 0 && !result.timedOut && !result.failure
}

// A fix whose tests fail is not a fix: the verdict and the end of the kata do not depend on the sensei agreeing.
export function gatedResult(result: EvaluationResult, gate?: TestGate): EvaluationResult {
  if (!gate || gate.testsPassed) return result
  return { ...result, verdict: 'needs_work', isFinalEvaluation: true, followUpQuestion: null }
}
