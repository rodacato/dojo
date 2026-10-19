import { createHash } from 'node:crypto'
import type { KataId, UserId } from '../shared/types'

export const MICRO_KATA_MAX_MINUTES = 5

const FRESH_AFTER_DAYS = 180

export interface DailyCandidate {
  kataId: KataId
  durationMinutes: number
  lastPracticedAt: Date | null
}

export interface DailyKataCandidatesPort {
  findDailyCandidates(userId: UserId): Promise<DailyCandidate[]>
}

function startOfDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function dayKey(now: Date): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

function practicedSince(candidate: DailyCandidate, since: Date): boolean {
  return candidate.lastPracticedAt !== null && candidate.lastPracticedAt >= since
}

function preferFresh(candidates: DailyCandidate[], now: Date): DailyCandidate[] {
  const freshBefore = new Date(now.getTime() - FRESH_AFTER_DAYS * 24 * 60 * 60 * 1000)
  const fresh = candidates.filter((c) => !practicedSince(c, freshBefore))
  return fresh.length > 0 ? fresh : candidates
}

// Same learner and day, same kata: the pick is fixed before the tap, so there is no reroll (D53).
export function pickTodaysKata(candidates: DailyCandidate[], userId: UserId, now: Date): DailyCandidate | null {
  const pool = preferFresh(candidates, now)
  if (pool.length === 0) return null
  const hash = createHash('sha256').update(`${userId}:${dayKey(now)}`).digest()
  return pool[hash.readUInt32BE(0) % pool.length]!
}

// After a micro kata today, another surprise one, never one already practiced today (D54).
export function pickOneMore(
  candidates: DailyCandidate[],
  now: Date,
  random: () => number = Math.random,
): DailyCandidate | null {
  const notToday = candidates.filter((c) => !practicedSince(c, startOfDay(now)))
  const pool = preferFresh(notToday.length > 0 ? notToday : candidates, now)
  if (pool.length === 0) return null
  return pool[Math.floor(random() * pool.length)]!
}

export function pickDailyKata(candidates: DailyCandidate[], userId: UserId, now: Date): DailyCandidate | null {
  const practicedToday = candidates.some((c) => practicedSince(c, startOfDay(now)))
  return practicedToday ? pickOneMore(candidates, now) : pickTodaysKata(candidates, userId, now)
}
