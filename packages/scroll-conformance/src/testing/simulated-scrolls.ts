import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ScrollFactory, SimulatedEnv, SimulatedScroll } from './fake-driver.js'
import { manifest } from './traces.js'

export interface Behaviour {
  hello: boolean
  helloOverrides: Record<string, unknown>
  /** Posts everything to `*` instead of the host origin. */
  wildcard: boolean
  checkOrigin: boolean
  checkSource: boolean
  checkNonce: boolean
  adoptSecondInit: boolean
  sessionAfterInit: 'issued' | 'hardcoded' | 'missing'
  /** What the scroll sends by itself as soon as it has a session. */
  sendOnInit: 'nothing' | 'progress' | 'malformed'
  standalone: 'silent' | 'posts' | 'posts-anywhere' | 'throws'
}

export const CONFORMING: Behaviour = {
  hello: true,
  helloOverrides: {},
  wildcard: false,
  checkOrigin: true,
  checkSource: true,
  checkNonce: true,
  adoptSecondInit: false,
  sessionAfterInit: 'issued',
  sendOnInit: 'progress',
  standalone: 'silent',
}

const envelope = { dojo: 'scroll', v: 0 }

class SimulatedProtocolScroll implements SimulatedScroll {
  private env!: SimulatedEnv
  private host: string | null = null
  private nonce = randomBytes(16).toString('hex')
  private session: string | null = null

  constructor(private readonly behaviour: Behaviour) {}

  start(env: SimulatedEnv): void {
    this.env = env
    this.host = new URLSearchParams(env.search).get('host')
    if (!env.framed || this.host === null) {
      this.runStandalone()
      return
    }
    if (this.behaviour.hello) this.post(this.helloMessage())
  }

  receive(message: IncomingMessage): void {
    const { behaviour } = this
    if (behaviour.checkOrigin && message.origin !== this.host) return
    if (behaviour.checkSource && message.source !== 'parent') return
    const data = message.data as Record<string, unknown> | null
    if (data?.['dojo'] !== 'scroll' || data['type'] !== 'init') return
    if (behaviour.checkNonce && data['nonce'] !== this.nonce) return
    if (this.session !== null && !behaviour.adoptSecondInit) return
    this.session = String(data['session'])
    if (behaviour.sendOnInit === 'progress') this.send({ type: 'progress', unitId: 'unit-1', state: {} })
    if (behaviour.sendOnInit === 'malformed') this.send({ type: 'progress', state: {} })
  }

  interact(name: string): void {
    const messages: Record<string, Record<string, unknown>> = {
      progress: { type: 'progress', unitId: 'unit-1', state: { step: 1 } },
      complete: { type: 'complete', unitId: 'unit-1' },
      'complete-unknown': { type: 'complete', unitId: 'no-such-unit' },
      resize: { type: 'resize', height: 480 },
      run: { type: 'run', id: 'run-1', language: 'ruby', files: [{ name: 'main.rb', content: 'puts 1' }] },
      'run-python': { type: 'run', id: 'run-2', language: 'python', files: [{ name: 'main.py', content: 'print(1)' }] },
    }
    const message = messages[name]
    if (message) this.send(message)
  }

  private helloMessage() {
    return {
      ...envelope,
      type: 'hello',
      scroll: { id: manifest.id, version: manifest.version },
      nonce: this.nonce,
      capabilities: ['progress', 'run'],
      ...this.behaviour.helloOverrides,
    }
  }

  private runStandalone(): void {
    if (this.behaviour.standalone === 'throws') throw new Error('window.localStorage is not defined')
    if (this.behaviour.standalone === 'posts') this.env.post(this.helloMessage(), this.env.scrollOrigin)
    if (this.behaviour.standalone === 'posts-anywhere') this.env.post(this.helloMessage(), '*')
  }

  private post(message: Record<string, unknown>): void {
    this.env.post(message, this.behaviour.wildcard ? '*' : (this.host ?? '*'))
  }

  private send(message: Record<string, unknown>): void {
    const { sessionAfterInit } = this.behaviour
    const session = sessionAfterInit === 'hardcoded' ? 'static-session' : this.session
    this.post({ ...envelope, ...(sessionAfterInit === 'missing' || session === null ? {} : { session }), ...message })
  }
}

/** A scroll that follows the protocol, with one or more defects switched on. */
export function simulate(overrides: Partial<Behaviour> = {}): ScrollFactory {
  return () => new SimulatedProtocolScroll({ ...CONFORMING, ...overrides })
}
