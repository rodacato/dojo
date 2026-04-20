import { eq, sql } from 'drizzle-orm'
import { Exercise } from '../../domain/content/exercise'
import type { Variation } from '../../domain/content/exercise'
import type { ExerciseFilters, ExerciseRepositoryPort } from '../../domain/content/ports'
import type { Difficulty, ExerciseStatus, ExerciseType } from '../../domain/content/values'
import { ExerciseId, UserId, VariationId } from '../../domain/shared/types'
import type { DB } from './drizzle/client'
import { exercises, variations } from './drizzle/schema'
import type { Rubric } from '@dojo/shared'

export class PostgresExerciseRepository implements ExerciseRepositoryPort {
  constructor(private readonly db: DB) {}

  async findById(id: ExerciseId): Promise<Exercise | null> {
    const row = await this.db.query.exercises.findFirst({
      where: eq(exercises.id, id),
      with: { variations: true },
    })
    if (!row) return null
    return this.toExercise(row)
  }

  async findEligible(userId: UserId, filters: ExerciseFilters): Promise<Exercise[]> {
    const maxDurationClause = filters.maxDuration
      ? sql`AND e.duration <= ${filters.maxDuration}`
      : sql``

    // Interest-based ordering: weight exercises matching user interests
    const randomness = filters.randomness ?? 1.0
    const focusWeight = 1 - randomness

    const interestClause = filters.interests && filters.interests.length > 0
      ? sql`CASE WHEN e.category = ANY(${filters.interests}) THEN ${focusWeight} ELSE 0 END`
      : sql`0`

    // Level-based ordering: prefer matching difficulty
    const levelClause = filters.userLevel
      ? (() => {
          switch (filters.userLevel) {
            case 'junior':
              return sql`CASE WHEN e.difficulty IN ('easy', 'medium') THEN ${focusWeight} ELSE 0 END`
            case 'mid':
              return sql`CASE WHEN e.difficulty IN ('medium', 'hard') THEN ${focusWeight} ELSE 0 END`
            case 'senior':
              return sql`CASE WHEN e.difficulty = 'hard' THEN ${focusWeight} ELSE 0 END`
            default:
              return sql`0`
          }
        })()
      : sql`0`

    const orderClause = sql`(${interestClause} + ${levelClause}) DESC, RANDOM()`

    const rows = await this.db.execute<{
      id: string
      title: string
      description: string
      duration: number
      difficulty: string
      category: string
      type: string
      status: string
      language: string[]
      tags: string[]
      topics: string[]
      owner_role: string
      owner_context: string
      created_by: string
      created_at: Date
      variation_id: string
      v_owner_role: string
      v_owner_context: string
      v_created_at: Date
    }>(sql`
      SELECT
        e.id, e.title, e.description, e.duration, e.difficulty,
        e.category, e.type, e.status, e.language, e.tags, e.topics,
        e.owner_role, e.owner_context, e.created_by, e.created_at,
        v.id as variation_id, v.owner_role as v_owner_role,
        v.owner_context as v_owner_context, v.created_at as v_created_at
      FROM exercises e
      JOIN variations v ON v.exercise_id = e.id
      WHERE e.status = 'published'
        AND e.id NOT IN (
          SELECT exercise_id FROM sessions
          WHERE user_id = ${userId}
            AND started_at > NOW() - INTERVAL '6 months'
        )
        ${maxDurationClause}
      ORDER BY ${orderClause}
      LIMIT 3
    `)

    // Fallback: if all exercises exhausted within 6 months, allow repeats
    if (rows.length === 0) {
      const fallbackRows = await this.db.execute<{
        id: string; title: string; description: string; duration: number;
        difficulty: string; category: string; type: string; status: string;
        language: string[]; tags: string[]; topics: string[];
        owner_role: string; owner_context: string; created_by: string; created_at: Date;
        variation_id: string; v_owner_role: string; v_owner_context: string; v_created_at: Date;
      }>(sql`
        SELECT
          e.id, e.title, e.description, e.duration, e.difficulty,
          e.category, e.type, e.status, e.language, e.tags, e.topics,
          e.owner_role, e.owner_context, e.created_by, e.created_at,
          v.id as variation_id, v.owner_role as v_owner_role,
          v.owner_context as v_owner_context, v.created_at as v_created_at
        FROM exercises e
        JOIN variations v ON v.exercise_id = e.id
        WHERE e.status = 'published'
          ${maxDurationClause}
        ORDER BY ${orderClause}
        LIMIT 3
      `)
      return this.groupRowsToExercises(fallbackRows)
    }

    return this.groupRowsToExercises(rows)
  }

  async save(exercise: Exercise): Promise<void> {
    const exerciseRow = {
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      duration: exercise.durationMinutes,
      difficulty: exercise.difficulty,
      category: exercise.category,
      type: exercise.type,
      status: exercise.status,
      language: exercise.languages,
      tags: exercise.tags,
      topics: exercise.topics,
      ownerRole: exercise.variations[0]?.ownerRole ?? '',
      ownerContext: exercise.variations[0]?.ownerContext ?? '',
      createdBy: exercise.createdBy,
      createdAt: exercise.createdAt,
    }

    await this.db
      .insert(exercises)
      .values(exerciseRow)
      .onConflictDoUpdate({
        target: exercises.id,
        set: { status: exerciseRow.status, title: exerciseRow.title },
      })

    for (const variation of exercise.variations) {
      await this.db
        .insert(variations)
        .values({
          id: variation.id,
          exerciseId: variation.exerciseId,
          ownerRole: variation.ownerRole,
          ownerContext: variation.ownerContext,
          createdAt: variation.createdAt,
        })
        .onConflictDoNothing()
    }
  }

  private toExercise(
    row: typeof exercises.$inferSelect & { variations: (typeof variations.$inferSelect)[] },
  ): Exercise {
    const domainVariations: Variation[] = row.variations.map((v) => ({
      id: VariationId(v.id),
      exerciseId: ExerciseId(v.exerciseId),
      ownerRole: v.ownerRole,
      ownerContext: v.ownerContext,
      createdAt: v.createdAt,
    }))

    return new Exercise({
      id: ExerciseId(row.id),
      title: row.title,
      description: row.description,
      durationMinutes: row.duration,
      difficulty: row.difficulty as Difficulty,
      category: row.category,
      type: row.type as ExerciseType,
      status: row.status as ExerciseStatus,
      languages: row.language as string[],
      tags: row.tags as string[],
      topics: row.topics as string[],
      testCode: row.testCode ?? null,
      starterCode: row.starterCode ?? null,
      rubric: (row.rubric as Rubric | null) ?? null,
      variations: domainVariations,
      version: row.version ?? 1,
      adminNotes: row.adminNotes ?? null,
      createdBy: UserId(row.createdBy),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
    })
  }

  private groupRowsToExercises(
    rows: Array<{
      id: string
      title: string
      description: string
      duration: number
      difficulty: string
      category: string
      type: string
      status: string
      language: string[]
      tags: string[]
      topics: string[]
      owner_role: string
      owner_context: string
      created_by: string
      created_at: Date
      variation_id: string
      v_owner_role: string
      v_owner_context: string
      v_created_at: Date
    }>,
  ): Exercise[] {
    const map = new Map<string, { row: (typeof rows)[0]; variations: Variation[] }>()

    for (const row of rows) {
      const existing = map.get(row.id)
      const variation: Variation = {
        id: VariationId(row.variation_id),
        exerciseId: ExerciseId(row.id),
        ownerRole: row.v_owner_role,
        ownerContext: row.v_owner_context,
        createdAt: row.v_created_at,
      }
      if (existing) {
        existing.variations.push(variation)
      } else {
        map.set(row.id, { row, variations: [variation] })
      }
    }

    return Array.from(map.values()).map(({ row, variations: domainVariations }) =>
      new Exercise({
        id: ExerciseId(row.id),
        title: row.title,
        description: row.description,
        durationMinutes: row.duration,
        difficulty: row.difficulty as Difficulty,
        category: row.category,
        type: row.type as ExerciseType,
        status: row.status as ExerciseStatus,
        languages: row.language,
        tags: row.tags,
        topics: row.topics,
        testCode: (row as Record<string, unknown>).test_code as string | null ?? null,
        starterCode: (row as Record<string, unknown>).starter_code as string | null ?? null,
        rubric: ((row as Record<string, unknown>).rubric as Rubric | null) ?? null,
        variations: domainVariations,
        version: (row as Record<string, unknown>).version as number ?? 1,
        adminNotes: (row as Record<string, unknown>).admin_notes as string | null ?? null,
        createdBy: UserId(row.created_by),
        createdAt: row.created_at,
        updatedAt: (row as Record<string, unknown>).updated_at as Date | null ?? null,
      }),
    )
  }
}
