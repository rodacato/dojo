import { scrollManifestSchema } from '@dojo/shared'
import type { Trace, TraceContext, TraceEvent } from '../trace.js'

export const HOST = 'http://host.test'
export const OTHER = 'http://other.test'
export const SCROLL = 'http://scroll.test'
export const NONCE = 'abcdef0123456789abcdef'
export const SESSION = 'session-1'

export const manifest = scrollManifestSchema.parse({
  id: 'sample',
  version: '1.2.3',
  protocol: 0,
  entry: 'index.html',
  locales: ['en'],
  title: { en: 'Sample' },
  description: { en: 'A sample scroll.' },
  programmingLanguages: ['ruby'],
  units: [{ id: 'unit-1' }, { id: 'unit-2' }],
  capabilities: ['progress', 'run'],
})

export const embedded: TraceContext = { manifest, hostOrigin: HOST }

const envelope = { dojo: 'scroll', v: 0 }

export function fromScroll(data: unknown, timestamp = 10): TraceEvent {
  return { direction: 'scroll-to-host', origin: SCROLL, data, timestamp }
}

export function fromHost(data: unknown, origin = HOST, timestamp = 20): TraceEvent {
  return { direction: 'host-to-scroll', origin, data, timestamp }
}

export function hello(overrides: Record<string, unknown> = {}) {
  return {
    ...envelope,
    type: 'hello',
    scroll: { id: manifest.id, version: manifest.version },
    nonce: NONCE,
    capabilities: ['progress'],
    ...overrides,
  }
}

export function init(session = SESSION, overrides: Record<string, unknown> = {}) {
  return {
    ...envelope,
    type: 'init',
    nonce: NONCE,
    session,
    locale: 'en',
    theme: {},
    progress: {},
    capabilities: ['progress', 'run'],
    userRef: 'user-ref',
    authenticated: true,
    ...overrides,
  }
}

export function message(type: string, fields: Record<string, unknown> = {}, session: string | null = SESSION) {
  return { ...envelope, type, ...(session === null ? {} : { session }), ...fields }
}

export const progress = (unitId = 'unit-1') => message('progress', { unitId, state: { step: 1 } })
export const complete = (unitId?: string) => message('complete', unitId === undefined ? {} : { unitId })
const resize = () => message('resize', { height: 400 })
export const run = (language = 'ruby') =>
  message('run', { id: 'run-1', language, files: [{ name: 'main.rb', content: 'puts 1' }] })

/** A conforming conversation that exercises every rule that needs interaction. */
export function cleanTrace(): Trace {
  return [
    fromScroll(hello()),
    fromHost(init()),
    fromScroll(progress()),
    fromScroll(complete('unit-1')),
    fromScroll(resize()),
    fromScroll(run()),
  ]
}

/** Replaces one event of the clean trace. */
export function withEvent(index: number, event: TraceEvent): Trace {
  return cleanTrace().map((existing, at) => (at === index ? event : existing))
}

export function withEventsAfterInit(...events: TraceEvent[]): Trace {
  return [fromScroll(hello()), fromHost(init()), ...events]
}
