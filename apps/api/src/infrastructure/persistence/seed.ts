import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './drizzle/schema'
import { exercises as exercisesTable, variations as variationsTable, users as usersTable } from './drizzle/schema'
import { EXERCISES, uuidv5 } from './exercises'
import type { SeedExercise } from './exercises'

// ---------------------------------------------------------------------------
// System user — required by exercises.created_by FK
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

function validateExercises(exercises: SeedExercise[]): void {
  const errors: string[] = []

  for (const ex of exercises) {
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
    throw new Error(`Seed validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`)
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
    validateExercises(EXERCISES)

    console.log('Inserting system user...')
    await db.insert(usersTable).values(SYSTEM_USER).onConflictDoNothing()

    console.log(`Inserting ${EXERCISES.length} exercises...`)
    for (const exercise of EXERCISES) {
      await db
        .insert(exercisesTable)
        .values({
          id: exercise.id,
          title: exercise.title,
          description: exercise.description,
          duration: exercise.duration,
          difficulty: exercise.difficulty,
          category: exercise.category,
          type: exercise.type,
          status: 'published',
          language: exercise.languages,
          tags: exercise.tags,
          topics: exercise.topics,
          ownerRole: exercise.variations[0]!.ownerRole,
          ownerContext: exercise.variations[0]!.ownerContext,
          testCode: exercise.testCode ?? null,
          starterCode: exercise.starterCode ?? null,
          createdBy: SYSTEM_USER_ID,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        })
        .onConflictDoUpdate({
          target: exercisesTable.id,
          set: {
            title: exercise.title,
            description: exercise.description,
            testCode: exercise.testCode ?? null,
            starterCode: exercise.starterCode ?? null,
            status: 'published',
          },
        })

      for (let i = 0; i < exercise.variations.length; i++) {
        const variation = exercise.variations[i]!
        const variationId = uuidv5(`variation-${exercise.id}-${i}`)

        await db
          .insert(variationsTable)
          .values({
            id: variationId,
            exerciseId: exercise.id,
            ownerRole: variation.ownerRole,
            ownerContext: variation.ownerContext,
            createdAt: new Date('2026-01-01T00:00:00Z'),
          })
          .onConflictDoNothing()
      }

      console.log(`  \u2713 ${exercise.title}`)
    }

    console.log(`\nSeed complete. ${EXERCISES.length} exercises, ${EXERCISES.reduce((n, e) => n + e.variations.length, 0)} variations.`)
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
