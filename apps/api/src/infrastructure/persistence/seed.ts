import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './drizzle/schema'
import { katas as katasTable, variations as variationsTable, users as usersTable } from './drizzle/schema'
import { KATAS, uuidv5 } from './katas'
import type { SeedKata } from './katas'

// ---------------------------------------------------------------------------
// System user — required by katas.created_by FK
// ---------------------------------------------------------------------------

const SYSTEM_USER_ID = uuidv5('dojo-system-user')

const SYSTEM_USER = {
  id: SYSTEM_USER_ID,
  githubId: 'dojo-system',
  username: 'dojo-system',
  avatarUrl: '',
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateKatas(katas: SeedKata[]): void {
  const errors: string[] = []

  for (const ex of katas) {
    if (!ex.title.trim()) errors.push(`${ex.id}: empty title`)
    if (!ex.description.trim()) errors.push(`${ex.id}: empty description`)
    if (ex.duration <= 0) errors.push(`${ex.id}: invalid duration ${ex.duration}`)
    if (ex.variations.length < 1) errors.push(`${ex.id}: no variations`)
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

    console.log('Inserting system user...')
    await db.insert(usersTable).values(SYSTEM_USER).onConflictDoNothing()

    console.log(`Inserting ${KATAS.length} katas...`)
    for (const kata of KATAS) {
      await db
        .insert(katasTable)
        .values({
          id: kata.id,
          title: kata.title,
          description: kata.description,
          duration: kata.duration,
          difficulty: kata.difficulty,
          category: kata.category,
          type: kata.type,
          status: 'published',
          language: kata.languages,
          tags: kata.tags,
          topics: kata.topics,
          ownerRole: kata.variations[0]!.ownerRole,
          ownerContext: kata.variations[0]!.ownerContext,
          testCode: kata.testCode ?? null,
          starterCode: kata.starterCode ?? null,
          rubric: kata.rubric ?? null,
          createdBy: SYSTEM_USER_ID,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        })
        .onConflictDoUpdate({
          target: katasTable.id,
          set: {
            title: kata.title,
            description: kata.description,
            testCode: kata.testCode ?? null,
            starterCode: kata.starterCode ?? null,
            rubric: kata.rubric ?? null,
            status: 'published',
          },
        })

      for (let i = 0; i < kata.variations.length; i++) {
        const variation = kata.variations[i]!
        const variationId = uuidv5(`variation-${kata.id}-${i}`)

        await db
          .insert(variationsTable)
          .values({
            id: variationId,
            kataId: kata.id,
            ownerRole: variation.ownerRole,
            ownerContext: variation.ownerContext,
            createdAt: new Date('2026-01-01T00:00:00Z'),
          })
          .onConflictDoNothing()
      }

      console.log(`  \u2713 ${kata.title}`)
    }

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
