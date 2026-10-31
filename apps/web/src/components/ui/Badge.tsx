import type { KataType, Difficulty } from '@dojo/shared'

const TYPE_STYLES: Record<KataType, string> = {
  code: 'bg-type-code text-primary',
  chat: 'bg-type-chat text-primary',
  whiteboard: 'bg-type-whiteboard text-primary',
  review: 'bg-type-review/20 text-primary border border-type-review/40',
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: 'text-success-text border border-success',
  medium: 'text-warning-text border border-warning',
  hard: 'text-danger-text border border-danger',
}

export function TypeBadge({ type }: Readonly<{ type: KataType }>) {
  return (
    <span className={`font-mono text-xs font-medium px-2 py-0.5 rounded-sm ${TYPE_STYLES[type]}`}>
      {type.toUpperCase()}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: Readonly<{ difficulty: Difficulty }>) {
  return (
    <span className={`font-mono text-xs font-medium px-2 py-0.5 rounded-sm ${DIFFICULTY_STYLES[difficulty]}`}>
      {difficulty.toUpperCase()}
    </span>
  )
}
