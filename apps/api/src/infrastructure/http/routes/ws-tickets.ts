import { randomBytes } from 'node:crypto'

// Lets a WebSocket authenticate without the 30-day bearer token in its URL (ADR 037).
const TICKET_TTL_MS = 30_000

const tickets = new Map<string, { userId: string; sessionId: string; expiresAt: number }>()

export function issueWsTicket(userId: string, sessionId: string): string {
  const now = Date.now()
  for (const [ticket, entry] of tickets) {
    if (entry.expiresAt <= now) tickets.delete(ticket)
  }
  const ticket = randomBytes(32).toString('base64url')
  tickets.set(ticket, { userId, sessionId, expiresAt: now + TICKET_TTL_MS })
  return ticket
}

// Spent on the first redemption, valid or not, so a ticket that leaked from a log is already used.
export function redeemWsTicket(ticket: string, sessionId: string): string | undefined {
  const entry = tickets.get(ticket)
  tickets.delete(ticket)
  if (!entry || entry.sessionId !== sessionId || entry.expiresAt <= Date.now()) return undefined
  return entry.userId
}
