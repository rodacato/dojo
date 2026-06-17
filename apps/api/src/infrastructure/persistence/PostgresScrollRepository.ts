import { and, eq } from 'drizzle-orm'
import type { Scroll, Lesson, Step } from '../../domain/learning/scroll'
import type { ScrollStatus, StepType } from '../../domain/learning/values'
import type { ExternalReference, PredictData } from '@dojo/shared'
import type { ScrollRepositoryPort } from '../../domain/learning/ports'
import type { DB } from './drizzle/client'
import { scrolls } from './drizzle/schema'

type ScrollRow = typeof scrolls.$inferSelect
type LessonRow = { id: string; scrollId: string; order: number; title: string }
type StepRow = {
  id: string
  lessonId: string
  order: number
  type: string
  title: string | null
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
  hints: string[] | null
  solution: string | null
  alternativeApproach: string | null
  data: unknown
}

type ScrollWithRelations = ScrollRow & {
  lessons: (LessonRow & { steps: StepRow[] })[]
}

export class PostgresScrollRepository implements ScrollRepositoryPort {
  constructor(private readonly db: DB) {}

  async findAllPublished(): Promise<Scroll[]> {
    const rows = await this.db.query.scrolls.findMany({
      where: eq(scrolls.status, 'published'),
      with: {
        lessons: {
          with: { steps: true },
          orderBy: (l, { asc }) => [asc(l.order)],
        },
      },
    })
    return rows.map((r) => this.toScroll(r as ScrollWithRelations))
  }

  async findAllPublic(): Promise<Scroll[]> {
    const rows = await this.db.query.scrolls.findMany({
      where: and(eq(scrolls.status, 'published'), eq(scrolls.isPublic, true)),
      with: {
        lessons: {
          with: { steps: true },
          orderBy: (l, { asc }) => [asc(l.order)],
        },
      },
    })
    return rows.map((r) => this.toScroll(r as ScrollWithRelations))
  }

  async findBySlug(slug: string): Promise<Scroll | null> {
    const row = await this.db.query.scrolls.findFirst({
      where: eq(scrolls.slug, slug),
      with: {
        lessons: {
          with: { steps: true },
          orderBy: (l, { asc }) => [asc(l.order)],
        },
      },
    })
    if (!row) return null
    return this.toScroll(row as ScrollWithRelations)
  }

  async findById(id: string): Promise<Scroll | null> {
    const row = await this.db.query.scrolls.findFirst({
      where: eq(scrolls.id, id),
      with: {
        lessons: {
          with: { steps: true },
          orderBy: (l, { asc }) => [asc(l.order)],
        },
      },
    })
    if (!row) return null
    return this.toScroll(row as ScrollWithRelations)
  }

  private toScroll(row: ScrollWithRelations): Scroll {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      language: row.language,
      accentColor: row.accentColor,
      status: row.status as ScrollStatus,
      isPublic: row.isPublic,
      externalReferences: (row.externalReferences ?? []) as ExternalReference[],
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
      title: row.title,
      instruction: row.instruction,
      starterCode: row.starterCode,
      testCode: row.testCode,
      hint: row.hint,
      hints: (row.hints ?? null) as string[] | null,
      solution: row.solution,
      alternativeApproach: row.alternativeApproach,
      data: (row.data ?? null) as PredictData | null,
    }
  }
}
