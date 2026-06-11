import type { StepDTO } from '@dojo/shared'

export function stepTypeLabel(type: StepDTO['type']): string {
  // Legacy DB value not present in the DTO union; seeds use it for katas.
  if ((type as string) === 'kata') return 'Kata'
  switch (type) {
    case 'read': return 'Read'
    case 'read+inline': return 'Read+'
    case 'challenge': return 'Challenge'
    case 'exercise': return 'Exercise'
    case 'code': return 'Code'
    case 'predict': return 'Predict'
  }
}

// Prefer the explicit step.title field (Sprint 018 schema). Fall back to
// pulling the first H1 from the instruction body for legacy steps that
// haven't been backfilled, and finally the step ordinal.
export function extractStepTitle(step: StepDTO): string {
  if (step.title && step.title.trim()) return step.title.trim()
  const match = step.instruction.match(/^#\s+(.+)$/m)
  if (match && match[1]) {
    return match[1].replace(/^(kata|challenge|read):\s*/i, '').trim()
  }
  if (step.type === 'read') return 'Read'
  return `Step ${step.order}`
}
