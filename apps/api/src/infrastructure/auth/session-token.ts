import { createHash, randomBytes } from 'node:crypto'

// Covers a 43-char token and the uuids issued before ADR 037; anything longer is never hashed.
const TOKEN_MAX_LENGTH = 64

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function issueSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashSessionToken(token) }
}

export function isSessionTokenShape(token: string): boolean {
  return token.length > 0 && token.length <= TOKEN_MAX_LENGTH
}
