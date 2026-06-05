import type { KataId, UserId } from '../shared/types'
import type { Kata } from './kata'

export interface KataFilters {
  mood?: 'focused' | 'regular' | 'low_energy'
  maxDuration?: number // minutes
  userLevel?: 'junior' | 'mid' | 'senior'
  interests?: string[]
  randomness?: number // 0.0–1.0
}

export interface KataRepositoryPort {
  findEligible(userId: UserId, filters: KataFilters): Promise<Kata[]>
  findById(id: KataId): Promise<Kata | null>
  save(kata: Kata): Promise<void>
}
