import { User } from '../../domain/identity/user'
import type { UserRepositoryPort } from '../../domain/identity/ports'

interface Deps {
  userRepo: UserRepositoryPort
}

export class UpsertUser {
  constructor(private readonly deps: Deps) {}

  async execute(params: { githubId: string; username: string; avatarUrl: string }): Promise<User> {
    const existing = await this.deps.userRepo.findByGithubId(params.githubId)
    if (existing) return existing

    const user = User.create(params)
    await this.deps.userRepo.save(user)
    return user
  }
}
