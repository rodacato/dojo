import { describe, expect, it } from 'vitest'
import { ScrollOriginNotAllowedError } from '../shared/errors'
import { assertEntryOriginAllowed, originOfEntry, parseFrameOrigins } from './origins'

describe('parseFrameOrigins', () => {
  it('accepts an empty value', () => {
    expect(parseFrameOrigins('', true)).toEqual({ origins: [], problems: [] })
    expect(parseFrameOrigins('  ,  ', true)).toEqual({ origins: [], problems: [] })
  })

  it('trims, splits and de-duplicates', () => {
    const { origins, problems } = parseFrameOrigins(
      ' https://a.example.org , https://b.example.org:8443,https://a.example.org',
      true,
    )
    expect(problems).toEqual([])
    expect(origins).toEqual(['https://a.example.org', 'https://b.example.org:8443'])
  })

  it.each([
    'https://a.example.org/',
    'https://a.example.org/path',
    'https://*.example.org',
    '*',
    'https:',
    'a.example.org',
    'ftp://a.example.org',
    'javascript:alert(1)',
  ])('rejects %j and names the variable', (value) => {
    const { origins, problems } = parseFrameOrigins(value, false)
    expect(origins).toEqual([])
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('SCROLL_FRAME_ORIGINS')
  })

  it('rejects plain http for a public host', () => {
    expect(parseFrameOrigins('http://a.example.org', false).problems).toHaveLength(1)
  })

  it('allows http on loopback hosts with any port outside production', () => {
    const { origins, problems } = parseFrameOrigins('http://localhost:5174,http://127.0.0.1', false)
    expect(problems).toEqual([])
    expect(origins).toEqual(['http://localhost:5174', 'http://127.0.0.1'])
  })

  it('rejects http on loopback hosts in production', () => {
    expect(parseFrameOrigins('http://localhost:5174', true).problems).toHaveLength(1)
  })

  it('keeps valid origins and reports the invalid ones', () => {
    const { origins, problems } = parseFrameOrigins('https://ok.example.org,https://bad.example.org/x', true)
    expect(origins).toEqual(['https://ok.example.org'])
    expect(problems).toHaveLength(1)
  })
})

describe('originOfEntry', () => {
  it('derives the origin of an absolute https url', () => {
    expect(originOfEntry('https://a.example.org:8443/x/y?z=1', true)).toEqual({
      ok: true,
      origin: 'https://a.example.org:8443',
    })
  })

  it.each([
    ['/relative/path', true],
    ['not a url', true],
    ['http://a.example.org/', false],
    ['http://localhost:5174/', true],
    ['https://user:pass@a.example.org/', true],
    ['javascript:alert(1)', false],
  ])('rejects %j (production=%s)', (entry, isProduction) => {
    expect(originOfEntry(entry, isProduction).ok).toBe(false)
  })

  it('accepts loopback http outside production', () => {
    expect(originOfEntry('http://localhost:5174/scroll/', false)).toEqual({
      ok: true,
      origin: 'http://localhost:5174',
    })
  })
})

describe('assertEntryOriginAllowed', () => {
  const policy = { allowedOrigins: ['https://a.example.org'], isProduction: true }

  it('passes for a listed origin', () => {
    expect(() => assertEntryOriginAllowed('https://a.example.org/s/', policy)).not.toThrow()
  })

  it('rejects an origin that is not listed, including look-alikes', () => {
    for (const entry of [
      'https://b.example.org/',
      'https://a.example.org.evil.test/',
      'https://a.example.org:8443/',
      'http://a.example.org/',
    ]) {
      expect(() => assertEntryOriginAllowed(entry, policy)).toThrow(ScrollOriginNotAllowedError)
    }
  })

  it('rejects everything when the list is empty', () => {
    expect(() =>
      assertEntryOriginAllowed('https://a.example.org/', { allowedOrigins: [], isProduction: true }),
    ).toThrow(ScrollOriginNotAllowedError)
  })
})
