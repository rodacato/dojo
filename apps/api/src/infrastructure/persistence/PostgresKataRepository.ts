import { and, asc, eq, gte, sql } from 'drizzle-orm'
import { Kata } from '../../domain/content/kata'
import type { Variation } from '../../domain/content/kata'
import type { KataFilters, KataRepositoryPort } from '../../domain/content/ports'
import { MICRO_KATA_MAX_MINUTES, type DailyKataCandidatesPort, type DailyPool } from '../../domain/practice/daily-kata'
import type { Difficulty, KataStatus, KataType } from '../../domain/content/values'
import { KataId, UserId, VariationId } from '../../domain/shared/types'
import type { DB } from './drizzle/client'
import { katas, sessions, variations } from './drizzle/schema'
import type { Rubric } from '@dojo/shared'

type RawTimestamp = Date | string | null

function toDate(value: RawTimestamp): Date | null {
  return value === null ? null : new Date(value)
}

type EligibleRow = {
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
  test_code: string | null
  starter_code: string | null
  rubric: Rubric | null
  version: number
  admin_notes: string | null
  created_by: string
  created_at: Date
  updated_at: Date | null
  variation_id: string
  v_owner_role: string
  v_owner_context: string
  v_created_at: Date
}

export class PostgresKataRepository implements KataRepositoryPort, DailyKataCandidatesPort {
  constructor(private readonly db: DB) {}

  async findById(id: KataId): Promise<Kata | null> {
    const row = await this.db.query.katas.findFirst({
      where: eq(katas.id, id),
      with: { variations: true },
    })
    if (!row) return null
    return this.toKata(row)
  }

  async findEligible(userId: UserId, filters: KataFilters): Promise<Kata[]> {
    return this.groupRowsToKatas(await this.findEligibleRows(userId, filters))
  }

  private async findEligibleRows(userId: UserId, filters: KataFilters): Promise<EligibleRow[]> {
    const maxDurationClause = filters.maxDuration
      ? sql`AND e.duration <= ${filters.maxDuration}`
      : sql``
    const typeClause = filters.type ? sql`AND e.type = ${filters.type}` : sql``
    const languageClause = filters.language
      ? sql`AND e.language @> ${JSON.stringify([filters.language])}::jsonb`
      : sql``
    const excludeClause = filters.excludeKataId ? sql`AND e.id <> ${filters.excludeKataId}` : sql``

    // Interest-based ordering: weight katas matching user interests
    const randomness = filters.randomness ?? 1
    // Cast: next to `ELSE 0` Postgres types a bare parameter as integer and rejects 0.25.
    const focusWeight = sql`${1 - randomness}::float8`

    const interestParams = (filters.interests ?? []).map((interest) => sql`${interest}`)
    const interestList = sql.join(interestParams, sql`, `)
    const interestClause = interestParams.length > 0
      ? sql`CASE WHEN e.category IN (${interestList}) THEN ${focusWeight} ELSE 0 END`
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

    // Kata not practiced in six months come first; repeats only fill the slots they leave.
    const fresh = sql`e.id NOT IN (
      SELECT exercise_id FROM sessions
      WHERE user_id = ${userId}
        AND started_at > NOW() - INTERVAL '6 months'
    )`

    // Three distinct kata first, then their variations: a limit on joined rows let one kata fill several slots.
    return this.db.execute<EligibleRow>(sql`
      WITH picked AS (
        SELECT e.id, ${fresh} AS fresh, (${interestClause} + ${levelClause}) AS fit, RANDOM() AS roll
        FROM exercises e
        WHERE e.status = 'published'
          AND EXISTS (SELECT 1 FROM variations pv WHERE pv.exercise_id = e.id)
          ${maxDurationClause}
          ${typeClause}
          ${languageClause}
          ${excludeClause}
        ORDER BY fresh DESC, fit DESC, roll
        LIMIT 3
      )
      SELECT
        e.id, e.title, e.description, e.duration, e.difficulty,
        e.category, e.type, e.status, e.language, e.tags, e.topics,
        e.owner_role, e.owner_context, e.test_code, e.starter_code,
        e.rubric, e.version, e.admin_notes, e.created_by, e.created_at,
        e.updated_at,
        v.id as variation_id, v.owner_role as v_owner_role,
        v.owner_context as v_owner_context, v.created_at as v_created_at
      FROM picked p
      JOIN exercises e ON e.id = p.id
      JOIN variations v ON v.exercise_id = e.id
      ORDER BY p.fresh DESC, p.fit DESC, p.roll
    `)
  }

  async findDailyCandidates(userId: UserId, todayStart: Date): Promise<DailyPool> {
    const [rows, [daily]] = await Promise.all([
      this.findDailyCandidateRows(userId, todayStart),
      this.db
        .select({ kataId: sessions.kataId })
        .from(sessions)
        .where(and(eq(sessions.userId, userId), eq(sessions.isDaily, true), gte(sessions.startedAt, todayStart)))
        .orderBy(asc(sessions.startedAt))
        .limit(1),
    ])
    return {
      todaysDailyKataId: daily ? KataId(daily.kataId) : null,
      candidates: rows.map((r) => ({
        kataId: KataId(r.id),
        durationMinutes: r.duration,
        category: r.category,
        difficulty: r.difficulty,
        lastPracticedAt: toDate(r.last_practiced_at),
        lastPracticedBeforeToday: toDate(r.last_practiced_before_today),
      })),
    }
  }

  private findDailyCandidateRows(userId: UserId, todayStart: Date) {
    return this.db.execute<{
      id: string
      duration: number
      category: string
      difficulty: Difficulty
      last_practiced_at: RawTimestamp
      last_practiced_before_today: RawTimestamp
    }>(sql`
      SELECT e.id, e.duration, e.category, e.difficulty, MAX(s.started_at) AS last_practiced_at,
        MAX(s.started_at) FILTER (WHERE s.started_at < ${todayStart.toISOString()}::timestamp) AS last_practiced_before_today
      FROM exercises e
      LEFT JOIN sessions s ON s.exercise_id = e.id AND s.user_id = ${userId}
      WHERE e.status = 'published'
        AND e.duration <= ${MICRO_KATA_MAX_MINUTES}
        AND EXISTS (SELECT 1 FROM variations v WHERE v.exercise_id = e.id)
      GROUP BY e.id, e.duration, e.category, e.difficulty
      ORDER BY e.id
    `)
  }

  async save(kata: Kata): Promise<void> {
    const exerciseRow = {
      id: kata.id,
      title: kata.title,
      description: kata.description,
      duration: kata.durationMinutes,
      difficulty: kata.difficulty,
      category: kata.category,
      type: kata.type,
      status: kata.status,
      language: kata.languages,
      tags: kata.tags,
      topics: kata.topics,
      ownerRole: kata.variations[0]?.ownerRole ?? '',
      ownerContext: kata.variations[0]?.ownerContext ?? '',
      createdBy: kata.createdBy,
      createdAt: kata.createdAt,
    }

    await this.db
      .insert(katas)
      .values(exerciseRow)
      .onConflictDoUpdate({
        target: katas.id,
        set: { status: exerciseRow.status, title: exerciseRow.title },
      })

    for (const variation of kata.variations) {
      await this.db
        .insert(variations)
        .values({
          id: variation.id,
          kataId: variation.kataId,
          ownerRole: variation.ownerRole,
          ownerContext: variation.ownerContext,
          createdAt: variation.createdAt,
        })
        .onConflictDoNothing()
    }
  }

  private toKata(
    row: typeof katas.$inferSelect & { variations: (typeof variations.$inferSelect)[] },
  ): Kata {
    const domainVariations: Variation[] = row.variations.map((v) => ({
      id: VariationId(v.id),
      kataId: KataId(v.kataId),
      ownerRole: v.ownerRole,
      ownerContext: v.ownerContext,
      createdAt: v.createdAt,
    }))

    return new Kata({
      id: KataId(row.id),
      title: row.title,
      description: row.description,
      durationMinutes: row.duration,
      difficulty: row.difficulty as Difficulty,
      category: row.category,
      type: row.type as KataType,
      status: row.status as KataStatus,
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

  private groupRowsToKatas(rows: EligibleRow[]): Kata[] {
    const map = new Map<string, { row: EligibleRow; variations: Variation[] }>()

    for (const row of rows) {
      const existing = map.get(row.id)
      const variation: Variation = {
        id: VariationId(row.variation_id),
        kataId: KataId(row.id),
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
      new Kata({
        id: KataId(row.id),
        title: row.title,
        description: row.description,
        durationMinutes: row.duration,
        difficulty: row.difficulty as Difficulty,
        category: row.category,
        type: row.type as KataType,
        status: row.status as KataStatus,
        languages: row.language,
        tags: row.tags,
        topics: row.topics,
        testCode: row.test_code ?? null,
        starterCode: row.starter_code ?? null,
        rubric: row.rubric ?? null,
        variations: domainVariations,
        version: row.version ?? 1,
        adminNotes: row.admin_notes ?? null,
        createdBy: UserId(row.created_by),
        createdAt: row.created_at,
        updatedAt: row.updated_at ?? null,
      }),
    )
  }
}
