import {
  SCROLL_PROTOCOL_VERSION,
  scrollToHostMessageSchema,
  type ScrollCapability,
  type ScrollManifest,
} from '@dojo/shared'
import type { RawMessage, Sender } from './browser.js'

export interface ReferenceHostOptions {
  manifest: ScrollManifest
  scrollOrigin: string
  send: (message: unknown, from: Sender) => Promise<void>
  /** Answer `hello` with `init` on its own; scenarios that forge messages answer by hand. */
  autoInit: boolean
  createSessionId?: () => string
}

const envelope = { dojo: 'scroll', v: SCROLL_PROTOCOL_VERSION } as const

/** The host side of the protocol as the spec describes it, independent of the Dojo web app. */
export class ReferenceHost {
  private session: string | undefined
  private helloNonce: string | undefined
  private readonly granted: ScrollCapability[]
  private readonly createSessionId: () => string

  constructor(private readonly options: ReferenceHostOptions) {
    this.granted = options.manifest.capabilities.filter((capability) => capability !== 'llm')
    this.createSessionId = options.createSessionId ?? (() => crypto.randomUUID())
  }

  /** The nonce of the scroll's hello; empty until one arrives. */
  get nonce(): string {
    return this.helloNonce ?? ''
  }

  async handle(raw: RawMessage): Promise<void> {
    if (raw.origin !== this.options.scrollOrigin) return
    const parsed = scrollToHostMessageSchema.safeParse(raw.data)
    if (!parsed.success) return
    const message = parsed.data

    if (message.type === 'hello') {
      if (this.session || this.helloNonce) return
      this.helloNonce = message.nonce
      if (this.options.autoInit) await this.answerHello()
    } else if (message.type === 'run' && message.session === this.session) {
      await this.answerRun(message.id)
    }
  }

  /** The real `init`: echoes the nonce of the hello and issues the session. */
  async answerHello(): Promise<string> {
    const session = this.createSessionId()
    this.session = session
    await this.options.send(this.initMessage(this.nonce, session), 'host')
    return session
  }

  /** An `init` that should not be accepted. */
  async forgeInit(options: { from: Sender; nonce: string; session: string }): Promise<void> {
    await this.options.send(this.initMessage(options.nonce, options.session), options.from)
  }

  private initMessage(nonce: string, session: string) {
    return {
      ...envelope,
      type: 'init',
      nonce,
      session,
      locale: this.options.manifest.locales[0],
      theme: {},
      progress: {},
      capabilities: this.granted,
      userRef: this.granted.includes('progress') ? 'conformance-user-ref' : null,
      authenticated: true,
    }
  }

  private async answerRun(id: string): Promise<void> {
    const common = { ...envelope, session: this.session, id }
    if (this.granted.includes('run')) {
      await this.options.send(
        { ...common, type: 'result', kind: 'ok', exitCode: 0, stdout: 'conformance\n', stderr: '', durationMs: 1 },
        'host',
      )
    } else {
      await this.options.send(
        { ...common, type: 'error', code: 'capability-denied', message: 'The run capability was not granted.' },
        'host',
      )
    }
  }
}
