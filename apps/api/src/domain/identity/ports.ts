import type { User } from './user'

export interface UserRepositoryPort {
  findByGithubId(githubId: string): Promise<User | null>
  save(user: User): Promise<void>
}
