import type { StepDTO } from '@dojo/shared'

// Shared contract for every step renderer. Completion is split in two
// callbacks on purpose: kata steps mark complete on pass but stay on the
// step so the Solution tab is reachable; read/predict chain both.
export type StepComponentProps = {
  step: StepDTO
  scrollSlug: string
  language: string
  isCompleted: boolean
  onMarkComplete: () => void
  onAdvance: () => void
}
