import type { UserId } from '../shared/types'
import type { User } from './user'

export interface UserPreferences {
  level: 'junior' | 'mid' | 'senior'
  interests: string[]
  randomness: number
}

export interface UserRepositoryPort {
  findByGithubId(githubId: string): Promise<User | null>
  save(user: User): Promise<void>
}

export interface UserPreferencesPort {
  findByUserId(userId: UserId): Promise<UserPreferences | null>
}
