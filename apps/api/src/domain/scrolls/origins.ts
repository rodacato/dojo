import { ScrollOriginNotAllowedError } from '../shared/errors'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1'])

function schemeAllowed(url: URL, isProduction: boolean): boolean {
  if (url.protocol === 'https:') return true
  return url.protocol === 'http:' && !isProduction && LOOPBACK_HOSTS.has(url.hostname)
}

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

export function parseFrameOrigins(
  raw: string,
  isProduction: boolean,
): { origins: string[]; problems: string[] } {
  const origins = new Set<string>()
  const problems: string[] = []

  for (const item of raw.split(/[\s,]+/).filter(Boolean)) {
    const url = tryParseUrl(item)
    if (!url || url.origin === 'null' || url.origin !== item || item.includes('*')) {
      problems.push(`SCROLL_FRAME_ORIGINS: "${item}" must be an exact origin like https://scrolls.example.org (no path, no wildcard)`)
    } else if (!schemeAllowed(url, isProduction)) {
      problems.push(`SCROLL_FRAME_ORIGINS: "${item}" must use https (http only for localhost outside production)`)
    } else {
      origins.add(url.origin)
    }
  }

  return { origins: [...origins], problems }
}

export interface OriginPolicy {
  allowedOrigins: readonly string[]
  isProduction: boolean
}

export function assertEntryOriginAllowed(entry: string, policy: OriginPolicy): void {
  const result = originOfEntry(entry, policy.isProduction)
  if (!result.ok) throw new ScrollOriginNotAllowedError(result.reason)
  if (!policy.allowedOrigins.includes(result.origin)) {
    throw new ScrollOriginNotAllowedError(`entry origin ${result.origin} is not in SCROLL_FRAME_ORIGINS`)
  }
}

type EntryOrigin ={ ok: true; origin: string } | { ok: false; reason: string }

export function originOfEntry(entry: string, isProduction: boolean): EntryOrigin {
  const url = tryParseUrl(entry)
  if (!url || url.origin === 'null') return { ok: false, reason: 'entry must be an absolute URL' }
  if (url.username || url.password) return { ok: false, reason: 'entry must not contain credentials' }
  if (!schemeAllowed(url, isProduction)) return { ok: false, reason: 'entry must use https' }
  return { ok: true, origin: url.origin }
}
