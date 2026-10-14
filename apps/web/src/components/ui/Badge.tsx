import type { KataType, Difficulty, Verdict } from '@dojo/shared'

const TYPE_STYLES: Record<KataType, string> = {
  code: 'bg-type-code text-primary',
  chat: 'bg-type-chat text-primary',
  whiteboard: 'bg-type-whiteboard text-primary',
  review: 'bg-type-review/20 text-primary border border-type-review/40',
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: 'text-success border border-success',
  medium: 'text-warning border border-warning',
  hard: 'text-danger-text border border-danger',
}

const VERDICT_STYLES: Record<Verdict, string> = {
  passed: 'bg-success/10 text-success border border-success/30',
  passed_with_notes: 'bg-warning/10 text-warning border border-warning/30',
  needs_work: 'bg-danger/10 text-danger-text border border-danger/30',
}

const VERDICT_LABELS: Record<Verdict, string> = {
  passed: 'PASSED',
  passed_with_notes: 'PASSED WITH NOTES',
  needs_work: 'NEEDS WORK',
}

export function TypeBadge({ type }: Readonly<{ type: KataType }>) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${TYPE_STYLES[type]}`}>
      {type.toUpperCase()}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: Readonly<{ difficulty: Difficulty }>) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${DIFFICULTY_STYLES[difficulty]}`}>
      {difficulty.toUpperCase()}
    </span>
  )
}

export function VerdictBadge({ verdict }: Readonly<{ verdict: Verdict }>) {
  return (
    <span className={`font-mono text-sm px-3 py-1 rounded-sm ${VERDICT_STYLES[verdict]}`}>
      {VERDICT_LABELS[verdict]}
    </span>
  )
}
