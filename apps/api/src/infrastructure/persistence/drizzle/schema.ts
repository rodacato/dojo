import { relations } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: varchar('github_id', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  duration: integer('duration').notNull(), // minutes
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  category: varchar('category', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  language: jsonb('language').notNull().default('[]'), // string[]
  tags: jsonb('tags').notNull().default('[]'), // string[]
  topics: jsonb('topics').notNull().default('[]'), // string[]
  ownerRole: text('owner_role').notNull(),
  ownerContext: text('owner_context').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const variations = pgTable('variations', {
  id: uuid('id').primaryKey(),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  ownerRole: text('owner_role').notNull(),
  ownerContext: text('owner_context').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  variationId: uuid('variation_id')
    .notNull()
    .references(() => variations.id),
  body: text('body').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id),
  userResponse: text('user_response').notNull(),
  llmResponse: text('llm_response').notNull(), // full EvaluationResult as JSON string
  isFinalEvaluation: boolean('is_final_evaluation').notNull().default(false),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
})

// Relations (for relational query API)
export const exercisesRelations = relations(exercises, ({ many }) => ({
  variations: many(variations),
}))

export const variationsRelations = relations(variations, ({ one }) => ({
  exercise: one(exercises, { fields: [variations.exerciseId], references: [exercises.id] }),
}))

export const sessionsRelations = relations(sessions, ({ many, one }) => ({
  attempts: many(attempts),
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const attemptsRelations = relations(attempts, ({ one }) => ({
  session: one(sessions, { fields: [attempts.sessionId], references: [sessions.id] }),
}))

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  usedBy: uuid('used_by').references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const invitationsRelations = relations(invitations, ({ one }) => ({
  creator: one(users, { fields: [invitations.createdBy], references: [users.id] }),
}))

export const badgeDefinitions = pgTable('badge_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'practice' | 'consistency' | 'mastery'
  isPrestige: boolean('is_prestige').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userBadges = pgTable('user_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  badgeSlug: varchar('badge_slug', { length: 100 })
    .notNull()
    .references(() => badgeDefinitions.slug),
  sessionId: uuid('session_id').references(() => sessions.id),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
})

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, { fields: [userSessions.userId], references: [users.id] }),
}))
