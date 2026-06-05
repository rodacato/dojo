import type { Milestone, MilestoneRepositoryPort } from '../../domain/recognition/milestone'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  milestoneRepo: MilestoneRepositoryPort
}

export class ListUserMilestones {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId): Promise<Milestone[]> {
    return this.deps.milestoneRepo.findByUser(userId)
  }
}
