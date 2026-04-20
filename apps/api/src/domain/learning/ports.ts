import type { Course } from './course'

export interface CourseRepositoryPort {
  findById(id: string): Promise<Course | null>
  findBySlug(slug: string): Promise<Course | null>
  findAllPublished(): Promise<Course[]>
  findAllPublic(): Promise<Course[]>
}

export type ProgressOwner =
  | { kind: 'user'; userId: string }
  | { kind: 'anonymous'; sessionId: string }

export interface CourseProgress {
  owner: ProgressOwner
  courseId: string
  completedSteps: string[]
  lastAccessedAt: Date
}

export interface CourseProgressPort {
  findByOwnerAndCourse(owner: ProgressOwner, courseId: string): Promise<CourseProgress | null>
  findAllForAnonymous(sessionId: string): Promise<CourseProgress[]>
  save(progress: CourseProgress): Promise<void>
  deleteAnonymous(sessionId: string): Promise<void>
}

export type NudgeFeedback = 'up' | 'down'

export interface NudgeRepositoryPort {
  // Returns the inserted nudge's id so the caller can expose it to the
  // client for later feedback calls.
  create(params: {
    userId: string | null
    stepId: string
    prompt: string
    response: string
  }): Promise<string>

  setFeedback(id: string, feedback: NudgeFeedback): Promise<void>
}
