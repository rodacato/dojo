import { asc, eq } from 'drizzle-orm'
import { practitionerLookSchema, type PieceId, type PractitionerLook } from '@dojo/shared'
import type { EarnedPiece, PractitionerRepositoryPort } from '../../domain/recognition/practitioner'
import type { UserId } from '../../domain/shared/types'
import type { DB } from './drizzle/client'
import { practitionerLooks, userPieces } from './drizzle/schema'

export class PostgresPractitionerRepository implements PractitionerRepositoryPort {
  constructor(private readonly db: DB) {}

  async earnedPieces(userId: UserId): Promise<EarnedPiece[]> {
    const rows = await this.db
      .select({ pieceId: userPieces.pieceId, earnedAt: userPieces.earnedAt, sessionId: userPieces.sessionId })
      .from(userPieces)
      .where(eq(userPieces.userId, userId))
      .orderBy(asc(userPieces.earnedAt))
    return rows.map((row) => ({ ...row, pieceId: row.pieceId as PieceId }))
  }

  async award(userId: UserId, pieceIds: readonly PieceId[], sessionId: string): Promise<PieceId[]> {
    if (pieceIds.length === 0) return []
    const inserted = await this.db
      .insert(userPieces)
      .values(pieceIds.map((pieceId) => ({ userId, pieceId, sessionId })))
      .onConflictDoNothing({ target: [userPieces.userId, userPieces.pieceId] })
      .returning({ pieceId: userPieces.pieceId })
    return inserted.map((row) => row.pieceId as PieceId)
  }

  async piecesEarnedInSession(sessionId: string): Promise<PieceId[]> {
    const rows = await this.db
      .select({ pieceId: userPieces.pieceId })
      .from(userPieces)
      .where(eq(userPieces.sessionId, sessionId))
      .orderBy(asc(userPieces.earnedAt))
    return rows.map((row) => row.pieceId as PieceId)
  }

  async findLook(userId: UserId): Promise<PractitionerLook | null> {
    const row = await this.db.query.practitionerLooks.findFirst({ where: eq(practitionerLooks.userId, userId) })
    if (!row) return null
    const parsed = practitionerLookSchema.safeParse(row.look)
    return parsed.success ? parsed.data : null
  }

  async saveLook(userId: UserId, look: PractitionerLook): Promise<void> {
    await this.db
      .insert(practitionerLooks)
      .values({ userId, look, updatedAt: new Date() })
      .onConflictDoUpdate({ target: practitionerLooks.userId, set: { look, updatedAt: new Date() } })
  }
}
