import type { ScrollManifest } from '@dojo/shared'

export type TraceDirection = 'scroll-to-host' | 'host-to-scroll'

/** One message between a host and a scroll, as its receiver saw it. */
export interface TraceEvent {
  direction: TraceDirection
  /** The `origin` the receiver of the message saw. */
  origin: string
  /** The raw payload, not yet validated. */
  data: unknown
  /** Milliseconds since the frame started loading. */
  timestamp: number
}

export type Trace = readonly TraceEvent[]

/** What the trace was recorded in: a host embedding the scroll, a host that is not the one the scroll was told about, or no host. */
export type TraceKind = 'embedded' | 'foreign-parent' | 'standalone'

/** An `init` the reference host forged on purpose: from another origin, from another window, with the wrong nonce, or a second one. */
export type SpoofKind = 'origin' | 'source' | 'nonce' | 'replay'

export interface TraceContext {
  manifest: ScrollManifest
  hostOrigin: string
  kind?: TraceKind
  spoof?: SpoofKind
  /** Sessions carried by the forged `init` messages; a scroll that uses one adopted a message it should have ignored. */
  forgedSessions?: readonly string[]
  helloTimeoutMs?: number
  /** Uncaught errors the page reported; only read for the standalone kind. */
  pageErrors?: readonly string[]
}

export interface Violation {
  rule: string
  section: string
  message: string
  /** Index of the offending event in the trace, or null when the problem is something that never happened. */
  eventIndex: number | null
}
