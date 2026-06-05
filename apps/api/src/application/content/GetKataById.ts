import type { KataRepositoryPort } from '../../domain/content/ports'
import type { Kata } from '../../domain/content/kata'
import type { KataId } from '../../domain/shared/types'

interface Deps {
  kataRepo: KataRepositoryPort
}

export class GetKataById {
  constructor(private readonly deps: Deps) {}

  async execute(kataId: KataId): Promise<Kata | null> {
    return this.deps.kataRepo.findById(kataId)
  }
}
