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
