/** A message the embedding page received from the scroll frame. */
export interface RawMessage {
  origin: string
  data: unknown
  /** Milliseconds since the page opened. */
  at: number
}

/** Who sends a message to the scroll: the host page itself, a frame on another origin, or a frame on the host origin that is not the host window. */
export type Sender = 'host' | 'other-origin' | 'other-window'

export interface FramedPage {
  /** Origin of the page that embeds the scroll. */
  readonly hostOrigin: string
  /** An origin different from `hostOrigin`, where forged messages can come from. */
  readonly otherOrigin: string
  readonly scrollOrigin: string
  /** What a `--drive` module receives: the Playwright page of the host. */
  readonly hostPage: unknown
  onMessage(listener: (message: RawMessage) => void): void
  post(message: unknown, from: Sender): Promise<void>
  now(): number
  close(): Promise<void>
}

export interface StandalonePage {
  readonly messages: readonly RawMessage[]
  readonly errors: readonly string[]
  close(): Promise<void>
}

export interface FramedOptions {
  scrollUrl: string
  /** Which origin serves the page that embeds the scroll. */
  parent: 'host' | 'third'
  /** The `host` query parameter handed to the scroll, or null to leave it out. */
  hostParam: string | null
}

/** The thin layer over a browser; everything else in the suite runs without one. */
export interface BrowserDriver {
  readonly origins: { host: string; third: string }
  start(): Promise<void>
  openFramed(options: FramedOptions): Promise<FramedPage>
  /** Loads the scroll as a top-level page, with no host. */
  openStandalone(scrollUrl: string): Promise<StandalonePage>
  stop(): Promise<void>
}

export type DriveFunction = (hostPage: unknown) => Promise<void>

export function withHostParam(scrollUrl: string, hostOrigin: string): string {
  const url = new URL(scrollUrl)
  url.searchParams.set('host', hostOrigin)
  return url.toString()
}
