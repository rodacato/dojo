import type { KataRepositoryPort } from '../../domain/content/ports'
import type { Difficulty, KataType } from '../../domain/content/values'
import { Kata } from '../../domain/content/kata'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  kataRepo: KataRepositoryPort
}

export class CreateKata {
  constructor(private readonly deps: Deps) {}

  async execute(params: {
    title: string
    description: string
    durationMinutes: number
    difficulty: Difficulty
    type: KataType
    languages: string[]
    tags: string[]
    topics: string[]
    createdBy: UserId
    variations: Array<{ ownerRole: string; ownerContext: string }>
  }): Promise<{ id: string }> {
    const kata = Kata.create({
      ...params,
      category: params.type,
    })
    await this.deps.kataRepo.save(kata)
    return { id: kata.id }
  }
}
