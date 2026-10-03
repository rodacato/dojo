import { RULES, analyze, type Rule } from './rules.js'
import type { Trace, TraceContext, Violation } from './trace.js'

export type RuleStatus = 'pass' | 'fail' | 'skipped'

export interface RuleEvaluation {
  rule: Pick<Rule, 'id' | 'section' | 'summary'>
  status: RuleStatus
  violations: Violation[]
  /** Why the rule was skipped. */
  reason?: string
}

function appliesTo(rule: Rule, context: TraceContext): boolean {
  if (!rule.kinds.includes(context.kind ?? 'embedded')) return false
  return rule.spoof === undefined || rule.spoof === context.spoof
}

/** Status of every rule that applies to this kind of trace. */
export function evaluateTrace(trace: Trace, context: TraceContext): RuleEvaluation[] {
  const analysis = analyze(trace, context)
  return RULES.filter((rule) => appliesTo(rule, context)).map((rule) => {
    const { id, section, summary } = rule
    const violations = rule.check(analysis).map((finding) => ({ rule: id, section, ...finding }))
    if (violations.length > 0) return { rule: { id, section, summary }, status: 'fail', violations }
    const reason = rule.skip?.(analysis)
    if (reason) return { rule: { id, section, summary }, status: 'skipped', violations, reason }
    return { rule: { id, section, summary }, status: 'pass', violations }
  })
}

/** The rules a trace breaks, and nothing else. A clean trace returns an empty list. */
export function validateTrace(trace: Trace, context: TraceContext): Violation[] {
  return evaluateTrace(trace, context).flatMap((evaluation) => evaluation.violations)
}
