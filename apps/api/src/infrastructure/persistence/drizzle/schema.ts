import { relations } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: varchar('github_id', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url').notNull(),
  email: varchar('email', { length: 255 }),
  reminderEnabled: boolean('reminder_enabled').notNull().default(false),
  reminderHour: integer('reminder_hour').notNull().default(9),
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
  testCode: text('test_code'), // predefined tests for code execution
  starterCode: text('starter_code'), // pre-filled code for fix-the-bug / scaffold exercises
  rubric: jsonb('rubric'), // null for everything except type='review'; hidden from the learner until pass
  version: integer('version').notNull().default(1),
  adminNotes: text('admin_notes'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
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
  executionResult: jsonb('execution_result'), // ExecutionResult JSON when code was executed
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

export const kataFeedback = pgTable('kata_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .unique()
    .references(() => sessions.id),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  variationId: uuid('variation_id')
    .notNull()
    .references(() => variations.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  clarity: varchar('clarity', { length: 20 }),    // 'clear' | 'somewhat_unclear' | 'confusing' | null
  timing: varchar('timing', { length: 20 }),      // 'too_short' | 'about_right' | 'too_long' | null
  evaluation: varchar('evaluation', { length: 30 }), // 'fair_and_relevant' | 'too_generic' | 'missed_the_point' | null
  note: text('note'),                              // max 280 chars, nullable
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
})

export const kataFeedbackRelations = relations(kataFeedback, ({ one }) => ({
  session: one(sessions, { fields: [kataFeedback.sessionId], references: [sessions.id] }),
  exercise: one(exercises, { fields: [kataFeedback.exerciseId], references: [exercises.id] }),
  variation: one(variations, { fields: [kataFeedback.variationId], references: [variations.id] }),
  user: one(users, { fields: [kataFeedback.userId], references: [users.id] }),
}))

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  level: varchar('level', { length: 20 }).notNull().default('mid'),
  interests: text('interests').array().notNull().default([]),
  randomness: real('randomness').notNull().default(0.3),
  goalWeeklyTarget: integer('goal_weekly_target').notNull().default(3),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}))

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

// ── Learning (Courses) ──────────────────────────────────────────────

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  language: varchar('language', { length: 50 }).notNull(),
  accentColor: varchar('accent_color', { length: 20 }).notNull().default('#6366F1'),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  isPublic: boolean('is_public').notNull().default(false),
  externalReferences: jsonb('external_references').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  order: integer('order').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
})

export const steps = pgTable('steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id),
  order: integer('order').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('exercise'),
  title: text('title'),
  instruction: text('instruction').notNull(),
  starterCode: text('starter_code'),
  testCode: text('test_code'),
  hint: text('hint'),
  solution: text('solution'),
  alternativeApproach: text('alternative_approach'),
})

export const courseProgress = pgTable('course_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  anonymousSessionId: text('anonymous_session_id'),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  completedSteps: jsonb('completed_steps').notNull().default([]),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).defaultNow().notNull(),
})

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
}))

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  steps: many(steps),
}))

export const stepsRelations = relations(steps, ({ one }) => ({
  lesson: one(lessons, { fields: [steps.lessonId], references: [lessons.id] }),
}))

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
  course: one(courses, { fields: [courseProgress.courseId], references: [courses.id] }),
  user: one(users, { fields: [courseProgress.userId], references: [users.id] }),
}))

// "Ask the sensei" nudges (PRD 026). Logged so we can iterate the nudge
// prompt against real usage without instrumenting the LLM adapter.
export const stepNudges = pgTable('step_nudges', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: uuid('user_id').references(() => users.id),
  stepId: uuid('step_id').notNull().references(() => steps.id),
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  feedback: varchar('feedback', { length: 8 }),
})

// Error reports captured by the ErrorReporterPort Postgres adapter (ADR 017).
// Not a domain concept — this table exists to give us a durable local
// fallback when Sentry is down or quota is exhausted.
export const errors = pgTable('errors', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  source: varchar('source', { length: 10 }).notNull(),
  status: integer('status'),
  route: text('route'),
  method: varchar('method', { length: 10 }),
  message: text('message').notNull(),
  stack: text('stack'),
  requestId: uuid('request_id'),
  userId: uuid('user_id'),
  context: jsonb('context'),
})

// Abuse-detection log for the anonymous /playground surface (S022 §4.2,
// PRD 029). Deliberately NOT a telemetry table: no source code, no
// stdout/stderr, no user id. Only the metadata needed to identify
// abusive traffic patterns (burst by ip_hash, session_hash rotation)
// and to enforce per-IP / per-session rate limits. Purged at 30 days
// by the same cron mechanism as the `errors` table (see /cron/cleanup-errors).
export const playgroundRuns = pgTable('playground_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ipHash: text('ip_hash').notNull(),
  sessionHash: text('session_hash').notNull(),
  language: text('language').notNull(),
  version: text('version').notNull(),
  exitCode: integer('exit_code'),
  runtimeMs: integer('runtime_ms'),
})

// Cost / quota log for ask-sensei (S022 Part 5, PRD 029 v1). Lightweight
// shape — not the full LLM telemetry table from the backlog. Only what
// the daily quota check and a future cost rollup need: who, when, model,
// token counts. Question text and answer text are NOT persisted: the
// product surface is "free exploration", not graded practice, and we do
// not want to retain free-form learner input.
export const llmRequestsLog = pgTable('llm_requests_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  askedAt: timestamp('asked_at').defaultNow().notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
})
