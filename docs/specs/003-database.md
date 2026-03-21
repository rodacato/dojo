# Spec 003 — Database

**Expert:** Tomás Ríos
**Depends on:** Phase 2 (DDD scaffold — port interfaces must exist)
**Blocks:** Phase 5 (security, needs UserRepository), Phase 6 (OAuth, needs user_sessions table)

## What and Why

Wire the domain's repository ports to real PostgreSQL implementations using Drizzle ORM. Phase 2 left stub repositories in `container.ts` — this phase replaces them with adapters that talk to the devcontainer PostgreSQL.

Drizzle is TypeScript-first, generates SQL migration files (not programmatic migrations), and has no runtime overhead. The schema lives in infrastructure — the domain never touches it.

## Scope

**In:** Drizzle schema, client, `drizzle.config.ts`, initial migration, three repository adapters, updated `container.ts`, `post-install.sh` migration step, `db:*` scripts
**Out:** `user_sessions` table (Phase 6), seed data, test database setup (integration tests are out of scope for CI)

---

## Packages

Add to `apps/api/package.json`:

```json
"dependencies": {
  "drizzle-orm": "^0.38.0",
  "postgres": "^3.0.0"
},
"devDependencies": {
  "drizzle-kit": "^0.29.0"
}
```

---

## Files to Create

### `apps/api/drizzle.config.ts`

```ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/infrastructure/persistence/drizzle/schema.ts',
  out: './src/infrastructure/persistence/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
} satisfies Config
```

---

### `apps/api/src/infrastructure/persistence/drizzle/schema.ts`

Five tables. All UUIDs generated in the application layer (`crypto.randomUUID()`) except where `gen_random_uuid()` is a fallback default.

```ts
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  githubId:  varchar('github_id', { length: 255 }).unique().notNull(),
  username:  varchar('username', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const exercises = pgTable('exercises', {
  id:           uuid('id').primaryKey(),
  title:        varchar('title', { length: 500 }).notNull(),
  description:  text('description').notNull(),
  duration:     integer('duration').notNull(),              // minutes
  difficulty:   varchar('difficulty', { length: 20 }).notNull(),
  category:     varchar('category', { length: 255 }).notNull(),
  type:         varchar('type', { length: 50 }).notNull(),
  status:       varchar('status', { length: 50 }).notNull().default('draft'),
  language:     jsonb('language').notNull().default('[]'),  // string[]
  tags:         jsonb('tags').notNull().default('[]'),      // string[]
  topics:       jsonb('topics').notNull().default('[]'),    // string[]
  ownerRole:    text('owner_role').notNull(),
  ownerContext: text('owner_context').notNull(),
  createdBy:    uuid('created_by').notNull().references(() => users.id),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
})

export const variations = pgTable('variations', {
  id:           uuid('id').primaryKey(),
  exerciseId:   uuid('exercise_id').notNull().references(() => exercises.id),
  ownerRole:    text('owner_role').notNull(),
  ownerContext: text('owner_context').notNull(),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id:          uuid('id').primaryKey(),
  userId:      uuid('user_id').notNull().references(() => users.id),
  exerciseId:  uuid('exercise_id').notNull().references(() => exercises.id),
  variationId: uuid('variation_id').notNull().references(() => variations.id),
  body:        text('body').notNull(),
  status:      varchar('status', { length: 50 }).notNull().default('active'),
  startedAt:   timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const attempts = pgTable('attempts', {
  id:                 uuid('id').primaryKey(),
  sessionId:          uuid('session_id').notNull().references(() => sessions.id),
  userResponse:       text('user_response').notNull(),
  llmResponse:        text('llm_response').notNull(),  // full EvaluationResult as JSON string
  isFinalEvaluation:  boolean('is_final_evaluation').notNull().default(false),
  submittedAt:        timestamp('submitted_at').defaultNow().notNull(),
})

// Relations (for relational query API)
export const exercisesRelations = relations(exercises, ({ many }) => ({
  variations: many(variations),
}))

export const sessionsRelations = relations(sessions, ({ many, one }) => ({
  attempts: many(attempts),
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const attemptsRelations = relations(attempts, ({ one }) => ({
  session: one(sessions, { fields: [attempts.sessionId], references: [sessions.id] }),
}))
```

> `llm_response` stores the full `EvaluationResult` as a JSON string. The repository adapter parses it back when mapping to the `Attempt` entity. This avoids adding jsonb columns for every field of `EvaluationResult` — the structure can evolve without migrations.

---

### `apps/api/src/infrastructure/persistence/drizzle/client.ts`

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../../../config'
import * as schema from './schema'

const sql = postgres(config.DATABASE_URL)
export const db = drizzle(sql, { schema })
export type DB = typeof db
```

Singleton. Import `db` wherever a repository adapter needs it.

---

### `apps/api/src/infrastructure/persistence/PostgresSessionRepository.ts`

Implements `SessionRepositoryPort`. Maps between Drizzle rows and `Session` aggregate.

Key methods:

**`save(session)`** — upsert: `db.insert(sessions).values(row).onConflictDoUpdate(...)`. Then upsert all attempts. After save, do NOT publish events here — the use case calls `session.pullEvents()` and publishes via the event bus.

**`findById(id)`** — use Drizzle relational query to eagerly load attempts:
```ts
db.query.sessions.findFirst({
  where: eq(schema.sessions.id, id),
  with: { attempts: true },
})
```
Map the result to a `Session` aggregate using a private `toSession()` function.

**`findActiveByUserId(userId)`** — same query with `where: and(eq(...userId), eq(...status, 'active'))`.

Mapping rule: the Drizzle row has `snake_case` columns; the domain uses `camelCase`. The mapping happens entirely inside the repository — domain types never leak into Drizzle types.

---

### `apps/api/src/infrastructure/persistence/PostgresExerciseRepository.ts`

Implements `ExerciseRepositoryPort`.

**`findEligible(userId, filters)`** — requires raw SQL for the 6-month exclusion window:

```ts
const rows = await db.execute(sql`
  SELECT e.*, v.id as variation_id, v.owner_role as v_owner_role, v.owner_context as v_owner_context
  FROM exercises e
  JOIN variations v ON v.exercise_id = e.id
  WHERE e.status = 'published'
    AND e.id NOT IN (
      SELECT exercise_id FROM sessions
      WHERE user_id = ${userId}
        AND started_at > NOW() - INTERVAL '6 months'
    )
    ${filters.maxDuration ? sql`AND e.duration <= ${filters.maxDuration}` : sql``}
  ORDER BY RANDOM()
  LIMIT 3
`)
```

Return mapped `Exercise[]`.

---

### `apps/api/src/infrastructure/persistence/PostgresUserRepository.ts`

Implements `UserRepositoryPort`. Straightforward upsert on `github_id`:

```ts
db.insert(users)
  .values(row)
  .onConflictDoUpdate({
    target: users.githubId,
    set: { username: row.username, avatarUrl: row.avatarUrl },
  })
```

---

## Files to Modify

### `apps/api/src/infrastructure/container.ts`

Replace the Phase 2 stubs with real Drizzle adapters:

```ts
import { db } from './persistence/drizzle/client'
import { PostgresSessionRepository } from './persistence/PostgresSessionRepository'
import { PostgresExerciseRepository } from './persistence/PostgresExerciseRepository'
import { PostgresUserRepository } from './persistence/PostgresUserRepository'
// ... LLM adapter (AnthropicStreamAdapter) remains a stub or use MockLLMAdapter for now

const sessionRepo = new PostgresSessionRepository(db)
const exerciseRepo = new PostgresExerciseRepository(db)
const userRepo = new PostgresUserRepository(db)
```

### `.devcontainer/post-install.sh`

Add after `pnpm install`:
```sh
echo "Running database migrations..."
pnpm --filter=@dojo/api db:migrate
echo "Migrations complete."
```

### `apps/api/package.json` scripts

```json
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:studio":   "drizzle-kit studio",
"db:push":     "drizzle-kit push"
```

> `db:push` is for local dev only (bypasses migration files). `db:migrate` is for production and CI.

---

## Migration Workflow

After schema changes:
1. `pnpm --filter=@dojo/api db:generate` — creates SQL file in `migrations/`
2. Review the SQL file in the PR
3. `pnpm --filter=@dojo/api db:migrate` — applies it
4. Commit both the schema change and the migration file together

---

## Acceptance Criteria

- [ ] `pnpm --filter=@dojo/api db:migrate` runs without error against the devcontainer PostgreSQL
- [ ] All five tables exist after migration
- [ ] `container.ts` uses real Drizzle adapters (no stubs for repos)
- [ ] `GET /health` still returns 200 after container wiring change
- [ ] `pnpm typecheck` passes — no type errors in repository files
- [ ] `pnpm lint` passes — no circular imports

## Out of Scope

- `user_sessions` table (Phase 6 — OAuth)
- Seed data (separate task before Phase 0 loop testing)
- Integration tests against real database (CI runs unit tests only)
- Read replicas, connection pooling, PgBouncer (post-Phase 0)
