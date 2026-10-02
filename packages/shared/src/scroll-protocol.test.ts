import { describe, expect, it } from 'vitest'
import {
  MAX_STATE_BYTES,
  RESERVED_MESSAGE_TYPES,
  hostToScrollMessageSchema,
  scrollManifestSchema,
  scrollToHostMessageSchema,
} from './scroll-protocol'

const envelope = { dojo: 'scroll', v: 0 }
const nonce = 'a'.repeat(24)
const session = 'sess-1'

const hello = {
  ...envelope,
  type: 'hello',
  scroll: { id: 'pattern-circuit', version: '0.1.0' },
  nonce,
  capabilities: ['progress'],
}
const progress = { ...envelope, type: 'progress', session, unitId: 'u1', completed: true, state: { a: [1] } }
const complete = { ...envelope, type: 'complete', session, unitId: 'u1' }
const resize = { ...envelope, type: 'resize', session, height: 640 }
const error = { ...envelope, type: 'error', session, code: 'bad-state', message: 'oops' }

const init = {
  ...envelope,
  type: 'init',
  nonce,
  session,
  locale: 'es-MX',
  theme: { '--bg': '#000' },
  progress: { u1: { completed: false, state: { step: 2 } } },
  capabilities: ['progress'],
  userRef: 'ref-123',
  authenticated: false,
}
const setLocale = { ...envelope, type: 'setLocale', session, locale: 'en' }
const setTheme = { ...envelope, type: 'setTheme', session, theme: { '--bg': '#fff' } }

const manifest = {
  id: 'pattern-circuit',
  version: '0.1.0',
  protocol: 0,
  entry: 'https://example.org/pattern-circuit/',
  locales: ['en', 'es'],
  title: { en: 'Pattern Circuit', es: 'Circuito de patrones' },
  description: { en: 'Learn patterns', es: 'Aprende patrones' },
  programmingLanguages: ['ruby'],
  units: [{ id: 'u1', title: { en: 'One' } }, { id: 'u2' }],
  capabilities: ['progress'],
}

function without(obj: Record<string, unknown>, key: string) {
  const copy = { ...obj }
  delete copy[key]
  return copy
}

describe('scroll -> host messages', () => {
  it.each([hello, progress, complete, resize, error])('accepts a valid $type', (message) => {
    expect(scrollToHostMessageSchema.safeParse(message).success).toBe(true)
  })

  it.each([
    [hello, 'scroll'],
    [hello, 'nonce'],
    [hello, 'capabilities'],
    [progress, 'session'],
    [progress, 'unitId'],
    [complete, 'session'],
    [resize, 'session'],
    [resize, 'height'],
    [error, 'code'],
    [error, 'message'],
    [progress, 'dojo'],
    [progress, 'v'],
  ])('rejects a %#: %j without %s', (message, field) => {
    expect(scrollToHostMessageSchema.safeParse(without(message, field)).success).toBe(false)
  })

  it('accepts hello without a session and error without a session', () => {
    expect(scrollToHostMessageSchema.safeParse(without(error, 'session')).success).toBe(true)
  })

  it('rejects another protocol version, another envelope and unknown types', () => {
    expect(scrollToHostMessageSchema.safeParse({ ...progress, v: 1 }).success).toBe(false)
    expect(scrollToHostMessageSchema.safeParse({ ...progress, dojo: 'other' }).success).toBe(false)
    expect(scrollToHostMessageSchema.safeParse({ ...progress, type: 'nope' }).success).toBe(false)
  })

  it.each(RESERVED_MESSAGE_TYPES)('rejects the reserved type %s', (type) => {
    expect(scrollToHostMessageSchema.safeParse({ ...envelope, type, session }).success).toBe(false)
  })

  it('rejects malformed values', () => {
    expect(scrollToHostMessageSchema.safeParse({ ...hello, nonce: 'short' }).success).toBe(false)
    expect(scrollToHostMessageSchema.safeParse({ ...hello, capabilities: ['root'] }).success).toBe(false)
    expect(scrollToHostMessageSchema.safeParse({ ...progress, unitId: '../x' }).success).toBe(false)
    expect(scrollToHostMessageSchema.safeParse({ ...resize, height: -1 }).success).toBe(false)
    expect(scrollToHostMessageSchema.safeParse({ ...resize, height: 1.5 }).success).toBe(false)
    expect(scrollToHostMessageSchema.safeParse({ ...error, code: 'Bad Code' }).success).toBe(false)
    expect(scrollToHostMessageSchema.safeParse('hello').success).toBe(false)
  })

  it('caps the size of opaque state', () => {
    const big = { ...progress, state: 'x'.repeat(MAX_STATE_BYTES) }
    expect(scrollToHostMessageSchema.safeParse(big).success).toBe(false)
    const fits = { ...progress, state: 'x'.repeat(MAX_STATE_BYTES - 2) }
    expect(scrollToHostMessageSchema.safeParse(fits).success).toBe(true)
  })
})

describe('host -> scroll messages', () => {
  it.each([init, setLocale, setTheme])('accepts a valid $type', (message) => {
    expect(hostToScrollMessageSchema.safeParse(message).success).toBe(true)
  })

  it('accepts a null userRef', () => {
    expect(hostToScrollMessageSchema.safeParse({ ...init, userRef: null }).success).toBe(true)
  })

  it.each([
    [init, 'nonce'],
    [init, 'session'],
    [init, 'locale'],
    [init, 'theme'],
    [init, 'progress'],
    [init, 'capabilities'],
    [init, 'userRef'],
    [init, 'authenticated'],
    [setLocale, 'session'],
    [setLocale, 'locale'],
    [setTheme, 'session'],
    [setTheme, 'theme'],
  ])('rejects a %#: %j without %s', (message, field) => {
    expect(hostToScrollMessageSchema.safeParse(without(message, field)).success).toBe(false)
  })

  it('rejects malformed values', () => {
    expect(hostToScrollMessageSchema.safeParse({ ...init, locale: 'EN_us' }).success).toBe(false)
    expect(hostToScrollMessageSchema.safeParse({ ...init, authenticated: 'yes' }).success).toBe(false)
    expect(hostToScrollMessageSchema.safeParse({ ...init, progress: { u1: {} } }).success).toBe(false)
  })
})

describe('scroll manifest', () => {
  it('accepts a valid manifest and defaults capabilities to none', () => {
    expect(scrollManifestSchema.safeParse(manifest).success).toBe(true)
    const parsed = scrollManifestSchema.parse(without(manifest, 'capabilities'))
    expect(parsed.capabilities).toEqual([])
  })

  it.each(['id', 'version', 'protocol', 'entry', 'locales', 'title', 'description', 'programmingLanguages', 'units'])(
    'rejects a manifest without %s',
    (field) => {
      expect(scrollManifestSchema.safeParse(without(manifest, field)).success).toBe(false)
    },
  )

  it('rejects malformed values', () => {
    expect(scrollManifestSchema.safeParse({ ...manifest, id: 'Bad Id' }).success).toBe(false)
    expect(scrollManifestSchema.safeParse({ ...manifest, version: 'v1' }).success).toBe(false)
    expect(scrollManifestSchema.safeParse({ ...manifest, protocol: 1 }).success).toBe(false)
    expect(scrollManifestSchema.safeParse({ ...manifest, locales: [] }).success).toBe(false)
    expect(scrollManifestSchema.safeParse({ ...manifest, units: [] }).success).toBe(false)
  })

  it('rejects duplicate units and duplicate locales', () => {
    const dupUnits = { ...manifest, units: [{ id: 'u1' }, { id: 'u1' }] }
    expect(scrollManifestSchema.safeParse(dupUnits).success).toBe(false)
    const dupLocales = { ...manifest, locales: ['en', 'en', 'es'] }
    expect(scrollManifestSchema.safeParse(dupLocales).success).toBe(false)
  })

  it('requires a title and description for every supported locale', () => {
    expect(scrollManifestSchema.safeParse({ ...manifest, title: { en: 'Only English' } }).success).toBe(false)
    expect(scrollManifestSchema.safeParse({ ...manifest, description: { es: 'Solo español' } }).success).toBe(false)
  })
})
