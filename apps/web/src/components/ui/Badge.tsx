import type { ExerciseType, Difficulty, Verdict } from '@dojo/shared'

const TYPE_STYLES: Record<ExerciseType, string> = {
  code: 'bg-type-code text-primary',
  chat: 'bg-type-chat text-primary',
  whiteboard: 'bg-type-whiteboard text-primary',
  // Review kata (PRD 027) — uses the accent colour to distinguish it as a
  // prose-evaluated format without needing a new design token.
  review: 'bg-accent/20 text-accent border border-accent/30',
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: 'text-success border border-success',
  medium: 'text-warning border border-warning',
  hard: 'text-danger border border-danger',
}

const VERDICT_STYLES: Record<Verdict, string> = {
  passed: 'bg-success/10 text-success border border-success/30',
  passed_with_notes: 'bg-warning/10 text-warning border border-warning/30',
  needs_work: 'bg-danger/10 text-danger border border-danger/30',
}

const VERDICT_LABELS: Record<Verdict, string> = {
  passed: 'PASSED',
  passed_with_notes: 'PASSED WITH NOTES',
  needs_work: 'NEEDS WORK',
}

export function TypeBadge({ type }: { type: ExerciseType }) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${TYPE_STYLES[type]}`}>
      {type.toUpperCase()}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${DIFFICULTY_STYLES[difficulty]}`}>
      {difficulty.toUpperCase()}
    </span>
  )
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`font-mono text-sm px-3 py-1 rounded-sm ${VERDICT_STYLES[verdict]}`}>
      {VERDICT_LABELS[verdict]}
    </span>
  )
}
