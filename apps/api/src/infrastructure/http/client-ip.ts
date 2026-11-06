import type { Context } from 'hono'
import { config } from '../../config'

type NodeBindings = { incoming?: { socket?: { remoteAddress?: string } } } | undefined

// Only the header the operator's own proxy writes is trusted; any other one is whatever the client sent.
function fromTrustedHeader(c: Context): string | undefined {
  switch (config.CLIENT_IP_SOURCE) {
    case 'cloudflare':
      return c.req.header('cf-connecting-ip')?.trim()
    case 'x-forwarded-for':
      // A proxy appends the address it saw, so the last entry is the only one the client did not write.
      return c.req.header('x-forwarded-for')?.split(',').at(-1)?.trim()
    case 'socket':
      return undefined
  }
}

export function clientIp(c: Context): string {
  return fromTrustedHeader(c) || ((c.env as NodeBindings)?.incoming?.socket?.remoteAddress ?? 'unknown')
}
