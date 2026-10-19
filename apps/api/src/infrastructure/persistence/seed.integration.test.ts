import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { katas, variations } from './drizzle/schema'
import { uuidv5, type SeedKata } from './katas'
import { seedKatas } from './seed'

// Opt-in with TEST_DATABASE_URL, like the repository integration tests.
const url = process.env['TEST_DATABASE_URL']
if (process.env['REQUIRE_DB_TESTS'] && !url) {
  throw new Error('REQUIRE_DB_TESTS is set but TEST_DATABASE_URL is not')
}

function seedKata(name: string, over: Partial<SeedKata> = {}): SeedKata {
  return {
    id: uuidv5(`seed-test-${name}-${randomUUID()}`),
    title: `Seed test ${name}`,
    description: 'A kata written by the seed.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['micro'],
    topics: ['debugging'],
    starterCode: 'const a = 1\n',
    variations: [{ ownerRole: 'Reviewer', ownerContext: 'Grade the why.' }],
    ...over,
  }
}

describe.skipIf(!url)('seedKatas against Postgres', () => {
  const client = postgres(url ?? '', { max: 2 })
  const db = drizzle(client)
  const written: string[] = []

  async function run(...list: SeedKata[]) {
    written.push(...list.map((k) => k.id))
    return seedKatas(db, list)
  }

  async function variationsOf(kataId: string) {
    return db.select().from(variations).where(eq(variations.kataId, kataId))
  }

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: join(__dirname, 'drizzle/migrations') })
  })

  afterAll(async () => {
    if (written.length > 0) {
      await db.delete(variations).where(inArray(variations.kataId, written))
      await db.delete(katas).where(inArray(katas.id, written))
    }
    await client.end()
  })

  it('carries every field of a changed seed kata to a row the operator never touched', async () => {
    const original = seedKata('changed')
    await run(original)

    await run({
      ...original,
      difficulty: 'hard',
      category: 'sql',
      tags: ['micro', 'joins'],
      variations: [{ ownerRole: 'Reviewer', ownerContext: 'Credit only the NULL reasoning.' }],
    })

    const [row] = await db.select().from(katas).where(eq(katas.id, original.id))
    expect(row).toMatchObject({ difficulty: 'hard', category: 'sql', tags: ['micro', 'joins'] })
    const rows = await variationsOf(original.id)
    expect(rows.map((v) => v.ownerContext)).toEqual(['Credit only the NULL reasoning.'])
  })

  it('leaves a kata the operator edited in admin as the operator left it, without re-adding seed variations', async () => {
    const kata = seedKata('edited')
    await run(kata)
    await db.update(katas).set({ title: 'Operator title', updatedAt: new Date() }).where(eq(katas.id, kata.id))
    await db.delete(variations).where(eq(variations.kataId, kata.id))
    await db.insert(variations).values({ id: randomUUID(), kataId: kata.id, ownerRole: 'Operator', ownerContext: 'Mine.' })

    const result = await run({ ...kata, title: 'Seed title v2' })

    const [row] = await db.select().from(katas).where(eq(katas.id, kata.id))
    expect(row?.title).toBe('Operator title')
    expect((await variationsOf(kata.id)).map((v) => v.ownerRole)).toEqual(['Operator'])
    expect(result.kept).toEqual(['Seed title v2'])
  })

  it('does not republish a kata the operator archived', async () => {
    const kata = seedKata('archived')
    await run(kata)
    await db.update(katas).set({ status: 'archived', updatedAt: new Date() }).where(eq(katas.id, kata.id))

    await run(kata)

    const [row] = await db.select().from(katas).where(eq(katas.id, kata.id))
    expect(row?.status).toBe('archived')
  })

  it('inserts a new kata as published with its variations', async () => {
    const kata = seedKata('new')
    const result = await run(kata)

    const [row] = await db.select().from(katas).where(eq(katas.id, kata.id))
    expect(row?.status).toBe('published')
    expect(await variationsOf(kata.id)).toHaveLength(1)
    expect(result.written).toBe(1)
  })
})
