import type { CourseStatus, StepType } from './values'

// Minimal types for the Course aggregate
export interface Step {
  id: string
  order: number
  type: StepType
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
}

export interface Lesson {
  id: string
  order: number
  title: string
  steps: Step[]
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  status: CourseStatus
  isPublic: boolean
  lessons: Lesson[]
}
