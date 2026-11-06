import { afterEach, describe, expect, it, vi } from 'vitest'
import { issueWsTicket, redeemWsTicket } from './ws-tickets'

describe('WebSocket tickets', () => {
  afterEach(() => vi.useRealTimers())

  it('redeems to the user it was issued for, on the session it was issued for', () => {
    const ticket = issueWsTicket('user-1', 'sess-1')
    expect(redeemWsTicket(ticket, 'sess-1')).toBe('user-1')
  })

  it('works only once', () => {
    const ticket = issueWsTicket('user-1', 'sess-1')
    redeemWsTicket(ticket, 'sess-1')
    expect(redeemWsTicket(ticket, 'sess-1')).toBeUndefined()
  })

  it('is spent by a redemption for the wrong session too', () => {
    const ticket = issueWsTicket('user-1', 'sess-1')
    expect(redeemWsTicket(ticket, 'sess-2')).toBeUndefined()
    expect(redeemWsTicket(ticket, 'sess-1')).toBeUndefined()
  })

  it('expires 30 seconds after it was issued', () => {
    vi.useFakeTimers()
    const fresh = issueWsTicket('user-1', 'sess-1')
    const stale = issueWsTicket('user-1', 'sess-1')
    vi.advanceTimersByTime(29_999)
    expect(redeemWsTicket(fresh, 'sess-1')).toBe('user-1')
    vi.advanceTimersByTime(1)
    expect(redeemWsTicket(stale, 'sess-1')).toBeUndefined()
  })

  it('never issues the same ticket twice', () => {
    expect(issueWsTicket('user-1', 'sess-1')).not.toBe(issueWsTicket('user-1', 'sess-1'))
  })
})
