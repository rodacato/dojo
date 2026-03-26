import { eq } from 'drizzle-orm'
import type { UserId } from '../../domain/shared/types'
import type { UserPreferences, UserPreferencesPort } from '../../domain/identity/ports'
import type { DB } from './drizzle/client'
import { userPreferences } from './drizzle/schema'

export class PostgresPreferencesRepository implements UserPreferencesPort {
  constructor(private readonly db: DB) {}

  async findByUserId(userId: UserId): Promise<UserPreferences | null> {
    const row = await this.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    })
    if (!row) return null
    return {
      level: row.level as UserPreferences['level'],
      interests: row.interests ?? [],
      randomness: row.randomness,
    }
  }
}
