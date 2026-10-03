import { describe, expect, it } from 'vitest'
import { withHostParam, type RawMessage, type Sender } from './browser.js'
import { ReferenceHost } from './reference-host.js'
import { HOST, NONCE, SCROLL, hello, manifest, message } from './testing/traces.js'

type Sent = { message: Record<string, unknown>; from: Sender }

function setup(capabilities = manifest.capabilities, autoInit = true) {
  const sent: Sent[] = []
  const host = new ReferenceHost({
    manifest: { ...manifest, capabilities },
    scrollOrigin: SCROLL,
    autoInit,
    createSessionId: () => 'issued-session',
    send: async (sentMessage, from) => {
      sent.push({ message: sentMessage as Record<string, unknown>, from })
    },
  })
  const runRequest = (session = 'issued-session') =>
    message('run', { id: 'run-1', language: 'ruby', files: [{ name: 'a.rb', content: '' }] }, session)
  const receive = (data: unknown, origin = SCROLL) => host.handle({ origin, data, at: 0 } satisfies RawMessage)
  return { host, sent, receive, runRequest }
}

describe('ReferenceHost', () => {
  it('answers hello with an init that echoes the nonce and grants what the manifest declares', async () => {
    const { sent, receive } = setup()
    await receive(hello())
    expect(sent).toHaveLength(1)
    expect(sent[0]?.from).toBe('host')
    expect(sent[0]?.message).toMatchObject({
      type: 'init',
      nonce: NONCE,
      session: 'issued-session',
      capabilities: ['progress', 'run'],
      userRef: 'conformance-user-ref',
      authenticated: true,
      locale: 'en',
    })
  })

  it('never grants llm and gives no userRef without the progress capability', async () => {
    const { sent, receive } = setup(['llm', 'run'])
    await receive(hello())
    expect(sent[0]?.message).toMatchObject({ capabilities: ['run'], userRef: null })
  })

  it('ignores a message from another origin and one that is not valid', async () => {
    const { sent, receive } = setup()
    await receive(hello(), 'http://elsewhere.test')
    await receive({ dojo: 'scroll', v: 0, type: 'hello' })
    expect(sent).toEqual([])
  })

  it('answers only the first hello', async () => {
    const { sent, receive } = setup()
    await receive(hello())
    await receive(hello({ nonce: 'another-nonce-0123456789' }))
    expect(sent).toHaveLength(1)
  })

  it('waits for the scenario to answer when auto init is off', async () => {
    const { host, sent, receive } = setup(manifest.capabilities, false)
    await receive(hello())
    expect(sent).toEqual([])
    expect(host.nonce).toBe(NONCE)
    expect(await host.answerHello()).toBe('issued-session')
    expect(sent[0]?.message).toMatchObject({ type: 'init', nonce: NONCE })
  })

  it('forges an init from the sender the scenario names', async () => {
    const { host, sent } = setup()
    await host.forgeInit({ from: 'other-origin', nonce: 'x'.repeat(20), session: 'forged' })
    expect(sent[0]).toMatchObject({ from: 'other-origin', message: { session: 'forged', nonce: 'x'.repeat(20) } })
  })

  it('answers run with a result carrying the request id', async () => {
    const { sent, receive, runRequest } = setup()
    await receive(hello())
    await receive(runRequest())
    expect(sent[1]?.message).toMatchObject({ type: 'result', id: 'run-1', session: 'issued-session', kind: 'ok', exitCode: 0 })
  })

  it('denies run when the manifest does not declare it', async () => {
    const { sent, receive, runRequest } = setup(['progress'])
    await receive(hello())
    await receive(runRequest())
    expect(sent[1]?.message).toMatchObject({ type: 'error', id: 'run-1', code: 'capability-denied' })
  })

  it('ignores a run that carries another session', async () => {
    const { sent, receive, runRequest } = setup()
    await receive(hello())
    await receive(runRequest('guessed'))
    expect(sent).toHaveLength(1)
  })

  it('has a random session id by default', async () => {
    const sent: unknown[] = []
    const host = new ReferenceHost({
      manifest,
      scrollOrigin: SCROLL,
      autoInit: false,
      send: async (sentMessage) => void sent.push(sentMessage),
    })
    expect(await host.answerHello()).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe('withHostParam', () => {
  it('adds the host origin and keeps the rest of the URL', () => {
    expect(withHostParam('http://scroll.test/app/index.html?lang=es#top', HOST)).toBe(
      'http://scroll.test/app/index.html?lang=es&host=http%3A%2F%2Fhost.test#top',
    )
  })
})
