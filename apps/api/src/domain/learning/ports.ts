import type { Course } from './course'

export interface CourseRepositoryPort {
  findBySlug(slug: string): Promise<Course | null>
  findAllPublished(): Promise<Course[]>
}

export interface CourseProgress {
  userId: string | null
  courseId: string
  completedSteps: string[]
  lastAccessedAt: Date
}

export interface CourseProgressPort {
  findByUserAndCourse(userId: string, courseId: string): Promise<CourseProgress | null>
  save(progress: CourseProgress): Promise<void>
}
