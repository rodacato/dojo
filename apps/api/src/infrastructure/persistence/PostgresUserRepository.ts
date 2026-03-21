import { eq } from 'drizzle-orm'
import { User } from '../../domain/identity/user'
import type { UserRepositoryPort } from '../../domain/identity/ports'
import { UserId } from '../../domain/shared/types'
import type { DB } from './drizzle/client'
import { users } from './drizzle/schema'

export class PostgresUserRepository implements UserRepositoryPort {
  constructor(private readonly db: DB) {}

  async findByGithubId(githubId: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.githubId, githubId),
    })
    if (!row) return null
    return this.toUser(row)
  }

  async save(user: User): Promise<void> {
    const row = {
      id: user.id,
      githubId: user.githubId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    }
    await this.db
      .insert(users)
      .values(row)
      .onConflictDoUpdate({
        target: users.githubId,
        set: { username: row.username, avatarUrl: row.avatarUrl },
      })
  }

  private toUser(row: typeof users.$inferSelect): User {
    return new User({
      id: UserId(row.id),
      githubId: row.githubId,
      username: row.username,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
    })
  }
}
