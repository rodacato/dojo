import { isNull } from 'drizzle-orm'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './drizzle/schema'
import { katas as katasTable, variations as variationsTable, users as usersTable } from './drizzle/schema'
import { KATAS, uuidv5 } from './katas'
import type { SeedKata } from './katas'
import { isLineInCode } from '../../domain/practice/point-answer'

// ---------------------------------------------------------------------------
// System user — required by katas.created_by FK
// ---------------------------------------------------------------------------

const SYSTEM_USER_ID = uuidv5('dojo-system-user')
const SEED_DATE = new Date('2026-01-01T00:00:00Z')

const SYSTEM_USER = {
  id: SYSTEM_USER_ID,
  githubId: 'dojo-system',
  username: 'dojo-system',
  avatarUrl: '',
  createdAt: SEED_DATE,
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateKatas(katas: SeedKata[]): void {
  const errors: string[] = []

  for (const ex of katas) {
    if (!ex.title.trim()) errors.push(`${ex.id}: empty title`)
    if (!ex.description.trim()) errors.push(`${ex.id}: empty description`)
    if (ex.duration <= 0) errors.push(`${ex.id}: invalid duration ${ex.duration}`)
    if (ex.variations.length < 1) errors.push(`${ex.id}: no variations`)
    const answer = ex.rubric?.answer
    if (answer && (ex.type !== 'review' || !ex.starterCode || !isLineInCode(ex.starterCode, answer.line))) {
      errors.push(`${ex.id}: point answer line ${answer.line} must be a line of the starter code of a review kata`)
    }
    for (const v of ex.variations) {
      if (!v.ownerRole.trim()) errors.push(`${ex.id}: empty ownerRole`)
      if (!v.ownerContext.trim()) errors.push(`${ex.id}: empty ownerContext`)
    }
  }

  if (errors.length > 0) {
    const details = errors.map((e) => `  - ${e}`).join('\n')
    throw new Error(`Seed validation failed:\n${details}`)
  }
}

// The seed owns a kata until the operator edits or archives it in admin, which
// sets updated_at; from then on the operator's copy wins, variations included.
export async function seedKatas(
  db: Pick<PostgresJsDatabase, 'insert'>,
  katas: SeedKata[],
): Promise<{ written: number; kept: string[] }> {
  await db.insert(usersTable).values(SYSTEM_USER).onConflictDoNothing()

  let written = 0
  const kept: string[] = []
  for (const kata of katas) {
    const content = {
      title: kata.title,
      description: kata.description,
      duration: kata.duration,
      difficulty: kata.difficulty,
      category: kata.category,
      type: kata.type,
      language: kata.languages,
      tags: kata.tags,
      topics: kata.topics,
      ownerRole: kata.variations[0]!.ownerRole,
      ownerContext: kata.variations[0]!.ownerContext,
      testCode: kata.testCode ?? null,
      starterCode: kata.starterCode ?? null,
      rubric: kata.rubric ?? null,
    }
    const owned = await db
      .insert(katasTable)
      .values({ id: kata.id, ...content, status: 'published', createdBy: SYSTEM_USER_ID, createdAt: SEED_DATE })
      .onConflictDoUpdate({ target: katasTable.id, set: content, setWhere: isNull(katasTable.updatedAt) })
      .returning({ id: katasTable.id })

    if (owned.length === 0) {
      kept.push(kata.title)
      continue
    }

    for (const [i, variation] of kata.variations.entries()) {
      await db
        .insert(variationsTable)
        .values({
          id: uuidv5(`variation-${kata.id}-${i}`),
          kataId: kata.id,
          ownerRole: variation.ownerRole,
          ownerContext: variation.ownerContext,
          createdAt: SEED_DATE,
        })
        .onConflictDoUpdate({
          target: variationsTable.id,
          set: { ownerRole: variation.ownerRole, ownerContext: variation.ownerContext },
        })
    }
    written++
  }
  return { written, kept }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function seed(): Promise<void> {
  const DATABASE_URL = process.env['DATABASE_URL']
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

  const sql = postgres(DATABASE_URL)
  const db = drizzle(sql, { schema })

  try {
    console.log('Validating seed data...')
    validateKatas(KATAS)

    console.log(`Seeding ${KATAS.length} katas...`)
    const { written, kept } = await seedKatas(db, KATAS)
    for (const title of kept) console.log(`  = ${title} (edited by the operator, left as is)`)
    console.log(`  \u2713 ${written} written from the seed`)

    console.log(`\nSeed complete. ${KATAS.length} katas, ${KATAS.reduce((n, e) => n + e.variations.length, 0)} variations.`)
  } finally {
    await sql.end()
  }
}

// Run when invoked directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
