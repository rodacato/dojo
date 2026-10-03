import { scrollHelloSchema, type ScrollManifest } from '@dojo/shared'
import type { BrowserDriver, DriveFunction, FramedPage, RawMessage, Sender } from './browser.js'
import { ReferenceHost } from './reference-host.js'
import type { SpoofKind, Trace, TraceContext, TraceEvent } from './trace.js'

export interface ScenarioInput {
  driver: BrowserDriver
  manifest: ScrollManifest
  scrollUrl: string
  drive?: DriveFunction
  /** How long to wait for `hello`; also the handshake timeout the trace is judged against. */
  timeoutMs: number
  /** How long to watch a page after the last thing happened. */
  settleMs: number
  createSessionId?: () => string
}

export type ScenarioRun =
  | { name: string; status: 'ran'; trace: Trace; context: TraceContext; error?: string }
  | { name: string; status: 'skipped'; reason: string }

export const SPOOF_KINDS: readonly SpoofKind[] = ['origin', 'source', 'nonce', 'replay']

const FORGED_NONCE = '0'.repeat(32)
const MAX_SPOOF_GAP_MS = 250

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function isHelloEvent(event: TraceEvent): boolean {
  return event.direction === 'scroll-to-host' && scrollHelloSchema.safeParse(event.data).success
}

/** Collects what the scroll sends and what the host sends back, in the order it happened. */
class Recording {
  readonly events: TraceEvent[] = []
  private readonly watchers = new Set<() => void>()

  constructor(private readonly page: FramedPage) {}

  fromScroll(raw: RawMessage): void {
    this.events.push({ direction: 'scroll-to-host', origin: raw.origin, data: raw.data, timestamp: raw.at })
    this.watchers.forEach((notify) => notify())
  }

  async toScroll(message: unknown, from: Sender): Promise<void> {
    const origin = from === 'other-origin' ? this.page.otherOrigin : this.page.hostOrigin
    this.events.push({ direction: 'host-to-scroll', origin, data: message, timestamp: this.page.now() })
    await this.page.post(message, from)
  }

  waitForHello(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const finish = (seen: boolean) => {
        clearTimeout(timer)
        this.watchers.delete(check)
        resolve(seen)
      }
      const check = () => {
        if (this.events.some(isHelloEvent)) finish(true)
      }
      const timer = setTimeout(() => finish(false), timeoutMs)
      this.watchers.add(check)
      check()
    })
  }
}

interface EmbeddedOptions {
  spoof?: SpoofKind
  drive: boolean
}

async function runEmbedded(
  input: ScenarioInput,
  name: string,
  options: EmbeddedOptions,
): Promise<{ run: ScenarioRun; sawHello: boolean }> {
  const { driver, manifest, scrollUrl, settleMs } = input
  const page = await driver.openFramed({ scrollUrl, parent: 'host', hostParam: driver.origins.host })
  const recording = new Recording(page)
  const pending: Promise<void>[] = []
  const host = new ReferenceHost({
    manifest,
    scrollOrigin: page.scrollOrigin,
    autoInit: options.spoof === undefined,
    createSessionId: input.createSessionId,
    send: (message, from) => recording.toScroll(message, from),
  })
  page.onMessage((raw) => {
    recording.fromScroll(raw)
    pending.push(host.handle(raw))
  })

  const forgedSessions: string[] = []
  let error: string | undefined
  try {
    const sawHello = await recording.waitForHello(input.timeoutMs)
    if (sawHello) {
      if (options.spoof) {
        forgedSessions.push(forgedSessionOf(options.spoof))
        await runSpoof(host, options.spoof, Math.min(settleMs, MAX_SPOOF_GAP_MS))
      }
      await sleep(settleMs)
      if (options.drive && input.drive) {
        try {
          await input.drive(page.hostPage)
        } catch (failure) {
          error = `the --drive module failed: ${failure instanceof Error ? failure.message : String(failure)}`
        }
      }
      await sleep(settleMs)
    }
    await Promise.all(pending)
    const context: TraceContext = {
      manifest,
      hostOrigin: page.hostOrigin,
      kind: 'embedded',
      spoof: options.spoof,
      forgedSessions,
      helloTimeoutMs: input.timeoutMs,
    }
    return { run: { name, status: 'ran', trace: recording.events, context, error }, sawHello }
  } finally {
    await page.close()
  }
}

const forgedSessionOf = (spoof: SpoofKind) => `forged-${spoof}`

/** Sends the forged `init` of one variant and answers the hello for real. */
async function runSpoof(host: ReferenceHost, spoof: SpoofKind, gapMs: number): Promise<void> {
  const session = forgedSessionOf(spoof)
  const { nonce } = host
  const forge = (from: Sender, withNonce = nonce) => host.forgeInit({ from, nonce: withNonce, session })
  if (spoof === 'replay') {
    await host.answerHello()
    await sleep(gapMs)
    await forge('host')
    return
  }
  if (spoof === 'origin') await forge('other-origin')
  if (spoof === 'source') await forge('other-window')
  if (spoof === 'nonce') await forge('host', FORGED_NONCE)
  await sleep(gapMs)
  await host.answerHello()
}

async function runForeignParent(input: ScenarioInput): Promise<ScenarioRun> {
  const { driver, manifest, scrollUrl } = input
  const page = await driver.openFramed({ scrollUrl, parent: 'third', hostParam: driver.origins.host })
  const recording = new Recording(page)
  page.onMessage((raw) => recording.fromScroll(raw))
  try {
    await sleep(input.settleMs)
    const context: TraceContext = { manifest, hostOrigin: driver.origins.host, kind: 'foreign-parent' }
    return { name: 'foreign-parent', status: 'ran', trace: recording.events, context }
  } finally {
    await page.close()
  }
}

async function runStandalone(input: ScenarioInput): Promise<ScenarioRun> {
  const { driver, manifest, scrollUrl } = input
  const unframed = await driver.openStandalone(scrollUrl)
  const framed = await driver.openFramed({ scrollUrl, parent: 'host', hostParam: null })
  const recording = new Recording(framed)
  framed.onMessage((raw) => recording.fromScroll(raw))
  try {
    await sleep(input.settleMs)
    unframed.messages.forEach((raw) => recording.fromScroll(raw))
    const context: TraceContext = {
      manifest,
      hostOrigin: driver.origins.host,
      kind: 'standalone',
      pageErrors: unframed.errors,
    }
    return { name: 'standalone', status: 'ran', trace: recording.events, context }
  } finally {
    await framed.close()
    await unframed.close()
  }
}

export async function runScenarios(input: ScenarioInput): Promise<ScenarioRun[]> {
  const runs: ScenarioRun[] = []
  const handshake = await runEmbedded(input, 'handshake', { drive: false })
  runs.push(handshake.run)

  const spoofNames = SPOOF_KINDS.map((spoof) => `spoofed-init:${spoof}`)
  if (handshake.sawHello) {
    if (input.drive) {
      runs.push((await runEmbedded(input, 'interaction', { drive: true })).run)
    } else {
      runs.push({ name: 'interaction', status: 'skipped', reason: 'no --drive module to interact with the scroll' })
    }
    for (const spoof of SPOOF_KINDS) {
      runs.push((await runEmbedded(input, `spoofed-init:${spoof}`, { spoof, drive: true })).run)
    }
  } else {
    const reason = 'the scroll never sent a valid hello'
    runs.push({ name: 'interaction', status: 'skipped', reason })
    spoofNames.forEach((name) => runs.push({ name, status: 'skipped', reason }))
  }

  runs.push(await runForeignParent(input))
  runs.push(await runStandalone(input))
  return runs
}
