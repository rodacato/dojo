import type { NudgeFeedback, NudgeRepositoryPort } from '../../domain/learning/ports'

interface Deps {
  nudgeRepo: NudgeRepositoryPort
}

export class SubmitNudgeFeedback {
  constructor(private readonly deps: Deps) {}

  async execute(params: { id: string; feedback: NudgeFeedback }): Promise<void> {
    await this.deps.nudgeRepo.setFeedback(params.id, params.feedback)
  }
}
