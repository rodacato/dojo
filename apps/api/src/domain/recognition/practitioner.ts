import { findPiece, PRACTITIONER_PIECES, type PieceId, type PieceProgress, type PractitionerLook, type SeasonWindow } from '@dojo/shared'
import type { UserId } from '../shared/types'

export interface PracticeMoment {
  startedAt: Date
}

export interface PracticeFacts {
  practiceDays: number
  longestDaysAway: number
  kataInSeason: (season: SeasonWindow) => number
}

const DAY_MS = 86_400_000
const DAYS_AWAY_FOR_RETURN = 7

const utcDay = (date: Date) => Math.floor(date.getTime() / DAY_MS)
const monthDay = (date: Date) => date.toISOString().slice(5, 10)

function inSeason(date: Date, season: SeasonWindow): boolean {
  const md = monthDay(date)
  return season.from <= season.to ? md >= season.from && md <= season.to : md >= season.from || md <= season.to
}

export function practiceFacts(history: readonly PracticeMoment[]): PracticeFacts {
  const days = [...new Set(history.map((entry) => utcDay(entry.startedAt)))].sort((a, b) => a - b)
  let longestDaysAway = 0
  for (let i = 1; i < days.length; i++) longestDaysAway = Math.max(longestDaysAway, days[i]! - days[i - 1]! - 1)
  return {
    practiceDays: days.length,
    longestDaysAway,
    kataInSeason: (season) => history.filter((entry) => inSeason(entry.startedAt, season)).length,
  }
}

const upTo = (current: number, target: number): PieceProgress => ({ current: Math.min(current, target), target })
const seasonOf = (id: PieceId) => findPiece(id)!.season!

const RULES: Record<PieceId, (facts: PracticeFacts) => PieceProgress> = {
  hachimaki: (f) => upTo(f.practiceDays, 1),
  kasa: (f) => upTo(f.practiceDays, 3),
  scarf: (f) => upTo(f.practiceDays, 7),
  happi: (f) => upTo(f.longestDaysAway >= DAYS_AWAY_FOR_RETURN ? 1 : 0, 1),
  'cempasuchil-crown': (f) => upTo(f.kataInSeason(seasonOf('cempasuchil-crown')), 1),
  calavera: (f) => upTo(f.kataInSeason(seasonOf('calavera')), 3),
}

export function pieceProgress(history: readonly PracticeMoment[]): Record<PieceId, PieceProgress> {
  const facts = practiceFacts(history)
  return Object.fromEntries(PRACTITIONER_PIECES.map(({ id }) => [id, RULES[id](facts)])) as Record<PieceId, PieceProgress>
}

export function earnedPieceIds(history: readonly PracticeMoment[]): PieceId[] {
  return Object.entries(pieceProgress(history))
    .filter(([, progress]) => progress.current >= progress.target)
    .map(([id]) => id as PieceId)
}

export interface EarnedPiece {
  pieceId: PieceId
  earnedAt: Date
  sessionId: string | null
}

export interface PractitionerRepositoryPort {
  earnedPieces(userId: UserId): Promise<EarnedPiece[]>
  /** Inserts what is not yet held and returns only those, so a replayed event awards nothing twice. */
  award(userId: UserId, pieceIds: readonly PieceId[], sessionId: string): Promise<PieceId[]>
  piecesEarnedInSession(sessionId: string): Promise<PieceId[]>
  findLook(userId: UserId): Promise<PractitionerLook | null>
  saveLook(userId: UserId, look: PractitionerLook): Promise<void>
}
