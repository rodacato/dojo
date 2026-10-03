import { createHmac } from 'node:crypto'
import { ownerId, type ProgressOwner } from '../../domain/scrolls/progress'

export function deriveUserRef(secret: string, scrollId: string, owner: ProgressOwner): string {
  return createHmac('sha256', secret).update(`scroll:${scrollId}:${ownerId(owner)}`).digest('base64url')
}
