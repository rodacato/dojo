import { createHash } from 'node:crypto'
import type { KataId, UserId } from '../shared/types'
import type { Difficulty } from '../content/values'
import type { UserPreferences } from '../identity/ports'

export const MICRO_KATA_MAX_MINUTES = 5

const FRESH_AFTER_DAYS = 180

export interface DailyCandidate {
  kataId: KataId
  durationMinutes: number
  category: string
  difficulty: Difficulty
  lastPracticedAt: Date | null
  lastPracticedBeforeToday: Date | null
}

export interface DailyPool {
  candidates: DailyCandidate[]
  /** The first kata started from today's daily entry, which is today's kata once it exists. */
  todaysDailyKataId: KataId | null
}

export interface DailyKataCandidatesPort {
  findDailyCandidates(userId: UserId, todayStart: Date): Promise<DailyPool>
}

export function startOfDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function dayKey(now: Date): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

function practicedSince(candidate: DailyCandidate, since: Date): boolean {
  return candidate.lastPracticedAt !== null && candidate.lastPracticedAt >= since
}

function preferFresh(
  candidates: DailyCandidate[],
  now: Date,
  lastPracticed: (c: DailyCandidate) => Date | null = (c) => c.lastPracticedAt,
): DailyCandidate[] {
  const freshBefore = new Date(now.getTime() - FRESH_AFTER_DAYS * 24 * 60 * 60 * 1000)
  const fresh = candidates.filter((c) => {
    const at = lastPracticed(c)
    return at === null || at < freshBefore
  })
  return fresh.length > 0 ? fresh : candidates
}

const LEVEL_DIFFICULTIES: Record<UserPreferences['level'], Difficulty[]> = {
  junior: ['easy', 'medium'],
  mid: ['medium', 'hard'],
  senior: ['hard'],
}

function fit(candidate: DailyCandidate, prefs: UserPreferences): number {
  const focus = 1 - prefs.randomness
  const interest = prefs.interests.includes(candidate.category) ? focus : 0
  const level = LEVEL_DIFFICULTIES[prefs.level].includes(candidate.difficulty) ? focus : 0
  return interest + level
}

// The same weighting Advanced applies (D57): the best-fitting kata win, and randomness 1 weighs nothing.
function preferFitting(candidates: DailyCandidate[], prefs: UserPreferences | null): DailyCandidate[] {
  if (!prefs || candidates.length === 0) return candidates
  const best = Math.max(...candidates.map((c) => fit(c, prefs)))
  return candidates.filter((c) => fit(c, prefs) === best)
}

// Same learner and day, same kata: the pick is fixed before the tap, so there is no reroll (D53).
// It reads only practice before today, so a kata chosen today cannot move it.
export function pickTodaysKata(
  candidates: DailyCandidate[],
  userId: UserId,
  now: Date,
  prefs: UserPreferences | null = null,
): DailyCandidate | null {
  const pool = preferFitting(preferFresh(candidates, now, (c) => c.lastPracticedBeforeToday), prefs)
  if (pool.length === 0) return null
  const hash = createHash('sha256').update(`${userId}:${dayKey(now)}`).digest()
  return pool[hash.readUInt32BE(0) % pool.length]!
}

// After a micro kata today, another surprise one, never one already practiced today (D54).
export function pickOneMore(
  candidates: DailyCandidate[],
  now: Date,
  prefs: UserPreferences | null = null,
  random: () => number = Math.random,
): DailyCandidate | null {
  const notToday = candidates.filter((c) => !practicedSince(c, startOfDay(now)))
  const pool = preferFitting(preferFresh(notToday.length > 0 ? notToday : candidates, now), prefs)
  if (pool.length === 0) return null
  return pool[Math.floor(random() * pool.length)]!
}

// Only today's daily kata opens "one more"; a kata chosen in Choose a kata does not (ADR-034).
export function pickDailyKata(
  pool: DailyPool,
  userId: UserId,
  now: Date,
  prefs: UserPreferences | null = null,
): DailyCandidate | null {
  return pool.todaysDailyKataId
    ? pickOneMore(pool.candidates, now, prefs)
    : pickTodaysKata(pool.candidates, userId, now, prefs)
}

export function todaysKataId(
  pool: DailyPool,
  userId: UserId,
  now: Date,
  prefs: UserPreferences | null = null,
): KataId | null {
  return pool.todaysDailyKataId ?? pickTodaysKata(pool.candidates, userId, now, prefs)?.kataId ?? null
}
