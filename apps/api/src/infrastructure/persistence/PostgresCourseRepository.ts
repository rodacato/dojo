import { and, eq } from 'drizzle-orm'
import type { Course, Lesson, Step } from '../../domain/learning/course'
import type { CourseStatus, StepType } from '../../domain/learning/values'
import type { CourseRepositoryPort } from '../../domain/learning/ports'
import type { DB } from './drizzle/client'
import { courses } from './drizzle/schema'

type CourseRow = typeof courses.$inferSelect
type LessonRow = { id: string; courseId: string; order: number; title: string }
type StepRow = { id: string; lessonId: string; order: number; type: string; instruction: string; starterCode: string | null; testCode: string | null; hint: string | null }

type CourseWithRelations = CourseRow & {
  lessons: (LessonRow & { steps: StepRow[] })[]
}

export class PostgresCourseRepository implements CourseRepositoryPort {
  constructor(private readonly db: DB) {}

  async findAllPublished(): Promise<Course[]> {
    const rows = await this.db.query.courses.findMany({
      where: eq(courses.status, 'published'),
      with: {
        lessons: {
          with: { steps: true },
          orderBy: (l, { asc }) => [asc(l.order)],
        },
      },
    })
    return rows.map((r) => this.toCourse(r as CourseWithRelations))
  }

  async findAllPublic(): Promise<Course[]> {
    const rows = await this.db.query.courses.findMany({
      where: and(eq(courses.status, 'published'), eq(courses.isPublic, true)),
      with: {
        lessons: {
          with: { steps: true },
          orderBy: (l, { asc }) => [asc(l.order)],
        },
      },
    })
    return rows.map((r) => this.toCourse(r as CourseWithRelations))
  }

  async findBySlug(slug: string): Promise<Course | null> {
    const row = await this.db.query.courses.findFirst({
      where: eq(courses.slug, slug),
      with: {
        lessons: {
          with: { steps: true },
          orderBy: (l, { asc }) => [asc(l.order)],
        },
      },
    })
    if (!row) return null
    return this.toCourse(row as CourseWithRelations)
  }

  async findById(id: string): Promise<Course | null> {
    const row = await this.db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        lessons: {
          with: { steps: true },
          orderBy: (l, { asc }) => [asc(l.order)],
        },
      },
    })
    if (!row) return null
    return this.toCourse(row as CourseWithRelations)
  }

  private toCourse(row: CourseWithRelations): Course {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      language: row.language,
      accentColor: row.accentColor,
      status: row.status as CourseStatus,
      isPublic: row.isPublic,
      lessons: row.lessons
        .sort((a, b) => a.order - b.order)
        .map((l) => this.toLesson(l)),
    }
  }

  private toLesson(row: LessonRow & { steps: StepRow[] }): Lesson {
    return {
      id: row.id,
      order: row.order,
      title: row.title,
      steps: row.steps
        .sort((a, b) => a.order - b.order)
        .map((s) => this.toStep(s)),
    }
  }

  private toStep(row: StepRow): Step {
    return {
      id: row.id,
      order: row.order,
      type: row.type as StepType,
      instruction: row.instruction,
      starterCode: row.starterCode,
      testCode: row.testCode,
      hint: row.hint,
    }
  }
}
