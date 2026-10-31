import type { Verdict } from '@dojo/shared'

export const VERDICT_LABELS: Record<Verdict, string> = {
  passed: 'PASSED',
  passed_with_notes: 'PASSED WITH NOTES',
  needs_work: 'NEEDS WORK',
}

export const VERDICT_TEXT: Record<Verdict, string> = {
  passed: 'text-success-text',
  passed_with_notes: 'text-warning-text',
  needs_work: 'text-danger-text',
}

export const VERDICT_STROKE: Record<Verdict, string> = {
  passed: 'text-success',
  passed_with_notes: 'text-warning',
  needs_work: 'text-danger',
}

export const VERDICT_PILL: Record<Verdict, string> = {
  passed: 'text-success-text border-success/40 bg-success/10',
  passed_with_notes: 'text-warning-text border-warning/40 bg-warning/10',
  needs_work: 'text-danger-text border-danger/40 bg-danger/10',
}

export function isVerdict(value: string | null): value is Verdict {
  return value !== null && Object.keys(VERDICT_LABELS).includes(value)
}
