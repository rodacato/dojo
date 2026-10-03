import { RULES, type Rule } from './rules.js'
import type { ScenarioRun } from './scenarios.js'
import type { Violation } from './trace.js'
import { evaluateTrace, type RuleStatus } from './validate.js'

export interface ReportedViolation extends Violation {
  scenario: string
}

export interface RuleReport {
  id: string
  section: string
  summary: string
  status: RuleStatus
  violations: ReportedViolation[]
  /** Why the rule was skipped. */
  reason?: string
}

export interface ScenarioReport {
  name: string
  status: 'ran' | 'skipped'
  events?: number
  reason?: string
  error?: string
}

export interface ConformanceReport {
  scroll: { id: string; version: string; url: string }
  passed: boolean
  counts: Record<RuleStatus, number>
  rules: RuleReport[]
  scenarios: ScenarioReport[]
}

function skippedBecauseNotRun(rule: Rule, runs: readonly ScenarioRun[]): string {
  const wanted = rule.spoof ? `spoofed-init:${rule.spoof}` : undefined
  const missing = runs.find((run) => run.status === 'skipped' && run.name === wanted)
  return missing?.status === 'skipped' ? `scenario ${missing.name} did not run: ${missing.reason}` : 'no scenario exercised this rule'
}

function reportRule(rule: Rule, runs: readonly ScenarioRun[]): RuleReport {
  const evaluations = runs.flatMap((run) =>
    run.status === 'ran'
      ? evaluateTrace(run.trace, run.context)
          .filter((evaluation) => evaluation.rule.id === rule.id)
          .map((evaluation) => ({ evaluation, scenario: run.name }))
      : [],
  )
  const base = { id: rule.id, section: rule.section, summary: rule.summary }
  const violations = evaluations.flatMap(({ evaluation, scenario }) =>
    evaluation.violations.map((violation) => ({ ...violation, scenario })),
  )
  if (violations.length > 0) return { ...base, status: 'fail', violations }
  if (evaluations.some(({ evaluation }) => evaluation.status === 'pass')) return { ...base, status: 'pass', violations }
  const reason = evaluations[0]?.evaluation.reason ?? skippedBecauseNotRun(rule, runs)
  return { ...base, status: 'skipped', violations, reason }
}

export function buildReport(
  scroll: ConformanceReport['scroll'],
  runs: readonly ScenarioRun[],
): ConformanceReport {
  const rules = RULES.map((rule) => reportRule(rule, runs))
  const counts: Record<RuleStatus, number> = { pass: 0, fail: 0, skipped: 0 }
  rules.forEach((rule) => (counts[rule.status] += 1))
  const scenarios = runs.map((run): ScenarioReport =>
    run.status === 'ran'
      ? { name: run.name, status: 'ran', events: run.trace.length, ...(run.error ? { error: run.error } : {}) }
      : { name: run.name, status: 'skipped', reason: run.reason },
  )
  const passed = counts.fail === 0 && scenarios.every((scenario) => scenario.error === undefined)
  return { scroll, passed, counts, rules, scenarios }
}

/** 1 when a rule failed, 2 when the suite could not finish, 0 otherwise. */
export function exitCodeFor(report: ConformanceReport): 0 | 1 | 2 {
  if (report.counts.fail > 0) return 1
  return report.passed ? 0 : 2
}

const LABEL: Record<RuleStatus, string> = { pass: 'PASS', fail: 'FAIL', skipped: 'SKIP' }

export function formatTextReport(report: ConformanceReport): string {
  const width = Math.max(...report.rules.map((rule) => rule.id.length))
  const lines = [`${report.scroll.id}@${report.scroll.version}  ${report.scroll.url}`, '']
  for (const rule of report.rules) {
    lines.push(`${LABEL[rule.status]}  ${rule.id.padEnd(width)}  PROTOCOL ${rule.section}`)
    if (rule.reason) lines.push(`      ${rule.reason}`)
    for (const violation of rule.violations) {
      const at = violation.eventIndex === null ? '' : ` (event ${violation.eventIndex})`
      lines.push(`      [${violation.scenario}] ${violation.message}${at}`)
    }
  }
  const errors = report.scenarios.filter((scenario) => scenario.error)
  if (errors.length > 0) {
    lines.push('', 'Scenario errors:')
    errors.forEach((scenario) => lines.push(`  ${scenario.name}: ${scenario.error}`))
  }
  const { pass, fail, skipped } = report.counts
  lines.push('', `${report.rules.length} rules: ${pass} passed, ${fail} failed, ${skipped} skipped`)
  return lines.join('\n')
}
