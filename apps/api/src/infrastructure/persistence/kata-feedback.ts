import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { kataFeedback } from './drizzle/schema'

export type FeedbackFields = Partial<Pick<typeof kataFeedback.$inferInsert, 'clarity' | 'timing' | 'evaluation' | 'note'>>

interface FeedbackOwner {
  sessionId: string
  kataId: string
  variationId: string
  userId: string
}

// One row per session; each vote arrives on its own (D62), so a later call only overwrites the fields it carries.
export async function saveKataFeedback(
  db: Pick<PostgresJsDatabase, 'insert'>,
  owner: FeedbackOwner,
  fields: FeedbackFields,
): Promise<void> {
  const insert = db.insert(kataFeedback).values({ ...owner, ...fields })
  if (Object.keys(fields).length === 0) {
    await insert.onConflictDoNothing()
    return
  }
  await insert.onConflictDoUpdate({ target: kataFeedback.sessionId, set: fields })
}
