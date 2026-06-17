import type { ScrollStatus, StepType } from './values'
import type { ExternalReference, PredictData } from '@dojo/shared'

// Minimal types for the Scroll aggregate
export interface Step {
  id: string
  order: number
  type: StepType
  title: string | null
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
  // Tier-ordered hints revealed progressively on repeated failure. Optional
  // because most steps carry none; the DTO coerces absence to null.
  hints?: string[] | null
  solution: string | null
  alternativeApproach: string | null
  // Variant-shaped data — currently only used by `predict` steps.
  data: PredictData | null
}

export interface Lesson {
  id: string
  order: number
  title: string
  steps: Step[]
}

export interface Scroll {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  status: ScrollStatus
  isPublic: boolean
  externalReferences: ExternalReference[]
  lessons: Lesson[]
}
