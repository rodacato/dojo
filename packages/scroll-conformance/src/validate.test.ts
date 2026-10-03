import { describe, expect, it } from 'vitest'
import { RULES } from './rules.js'
import type { Trace, TraceContext } from './trace.js'
import { evaluateTrace, validateTrace } from './validate.js'
import {
  OTHER,
  SESSION,
  cleanTrace,
  complete,
  embedded,
  fromHost,
  fromScroll,
  hello,
  init,
  manifest,
  message,
  progress,
  run,
  withEvent,
  withEventsAfterInit,
} from './testing/traces.js'

const ids = (trace: Trace, context: TraceContext = embedded) => validateTrace(trace, context).map((v) => v.rule)

describe('validateTrace', () => {
  it('returns nothing for a conforming trace', () => {
    expect(validateTrace(cleanTrace(), embedded)).toEqual([])
  })

  describe('one broken trace per rule yields exactly that rule', () => {
    const spoofed = (spoof: TraceContext['spoof'], forged: string, first: Trace): [Trace, TraceContext] => [
      [...first, fromScroll(progress()), fromScroll(message('progress', { unitId: 'unit-1' }, forged))],
      { ...embedded, spoof, forgedSessions: [forged] },
    ]
    const forgedFirst = (origin: string): Trace => [
      fromScroll(hello()),
      fromHost(init('forged'), origin),
      fromHost(init()),
    ]

    const cases: Array<[string, Trace, TraceContext?]> = [
      ['envelope', withEvent(2, fromScroll({ dojo: 'scroll', v: 1, type: 'resize' }))],
      ['envelope', withEvent(2, fromScroll('not an object'))],
      ['message-schema', withEvent(2, fromScroll(message('progress', { state: {} })))],
      ['message-schema', withEvent(2, fromScroll(message('progress', { unitId: 'unit-1', state: 'x'.repeat(70_000) })))],
      ['message-schema', withEvent(4, fromScroll(message('resize', { height: -1 })))],
      ['message-schema', withEvent(2, fromScroll(message('teleport')))],
      ['reserved-type', withEvent(2, fromScroll(message('llm', { prompt: 'hi' })))],
      ['hello-sent', []],
      ['hello-sent', withEvent(0, fromScroll(hello(), 10_001))],
      ['hello-manifest', withEvent(0, fromScroll(hello({ scroll: { id: 'other', version: manifest.version } })))],
      ['hello-manifest', withEvent(0, fromScroll(hello({ scroll: { id: manifest.id, version: '9.9.9' } })))],
      [
        'hello-capabilities',
        cleanTrace(),
        { ...embedded, manifest: { ...manifest, capabilities: [] } },
      ],
      [
        'no-premature-message',
        [fromScroll(hello()), fromScroll(message('progress', { unitId: 'unit-1' }, 'guess')), fromHost(init())],
      ],
      ['session-after-init', withEvent(2, fromScroll(message('progress', { unitId: 'unit-1' }, 'hardcoded')))],
      ['init-origin-checked', ...spoofed('origin', 'forged', forgedFirst(OTHER))],
      ['init-source-checked', ...spoofed('source', 'forged', forgedFirst(embedded.hostOrigin))],
      ['init-nonce-checked', ...spoofed('nonce', 'forged', forgedFirst(embedded.hostOrigin))],
      [
        'init-replay-ignored',
        [
          fromScroll(hello()),
          fromHost(init()),
          fromHost(init('replayed')),
          fromScroll(message('progress', { unitId: 'unit-1' }, 'replayed')),
        ],
        { ...embedded, spoof: 'replay', forgedSessions: ['replayed'] },
      ],
      ['complete-unit-known', withEvent(3, fromScroll(complete('no-such-unit')))],
      ['run-granted', cleanTrace().map((event, at) => (at === 1 ? fromHost(init(SESSION, { capabilities: ['progress'] })) : event))],
      ['run-language', withEvent(5, fromScroll(run('python')))],
      ['host-origin-targeted', [fromScroll(hello())], { ...embedded, kind: 'foreign-parent' }],
      ['standalone-silent', [fromScroll(hello())], { ...embedded, kind: 'standalone' }],
      ['standalone-no-crash', [], { ...embedded, kind: 'standalone', pageErrors: ['TypeError: x is undefined'] }],
    ]

    it.each(cases)('%s', (rule, trace, context) => {
      expect(ids(trace, context)).toEqual([rule])
    })
  })

  it('points at the offending event and the spec section', () => {
    const [violation] = validateTrace(withEvent(4, fromScroll(message('resize', { height: -1 }))), embedded)
    expect(violation).toMatchObject({ rule: 'message-schema', section: '§5', eventIndex: 4 })
    expect(violation?.message).toContain('height')
  })

  it('reports an event that never happened with a null index', () => {
    const [violation] = validateTrace([], embedded)
    expect(violation).toMatchObject({ rule: 'hello-sent', eventIndex: null })
    expect(violation?.message).toContain('the scroll sent nothing')
  })

  it('honours a custom handshake timeout', () => {
    const slow = withEvent(0, fromScroll(hello(), 500))
    expect(ids(slow, { ...embedded, helloTimeoutMs: 100 })).toEqual(['hello-sent'])
    expect(ids(slow, { ...embedded, helloTimeoutMs: 1000 })).toEqual([])
  })

  it('says how many other messages a scroll sent instead of hello', () => {
    const [first, second] = validateTrace([fromScroll(progress())], embedded)
    expect(first?.message).toContain('1 other message(s)')
    expect(second?.rule).toBe('no-premature-message')
  })

  it('flags a missing session both as a malformed message and as a wrong session', () => {
    const trace = withEvent(2, fromScroll(message('progress', { unitId: 'unit-1' }, null)))
    expect(ids(trace)).toEqual(['message-schema', 'session-after-init'])
  })

  it('lets a scroll report an error before init without a session', () => {
    const early = [fromScroll(hello()), fromScroll(message('error', { code: 'internal', message: 'x' }, null)), fromHost(init())]
    expect(ids(early)).toEqual([])
  })

  it('attributes a forged session to the spoof rule alone', () => {
    const [trace, context] = [
      [fromScroll(hello()), fromHost(init('forged'), OTHER), fromScroll(message('progress', { unitId: 'unit-1' }, 'forged')), fromHost(init())],
      { ...embedded, spoof: 'origin', forgedSessions: ['forged'] } satisfies TraceContext,
    ]
    expect(ids(trace, context)).toEqual(['init-origin-checked'])
  })
})

describe('evaluateTrace', () => {
  const statusOf = (trace: Trace, context: TraceContext, id: string) =>
    evaluateTrace(trace, context).find((evaluation) => evaluation.rule.id === id)

  it('passes every embedded rule on a conforming trace', () => {
    const evaluations = evaluateTrace(cleanTrace(), embedded)
    expect(evaluations.every((evaluation) => evaluation.status === 'pass')).toBe(true)
    const embeddedRules = RULES.filter((rule) => rule.kinds.includes('embedded') && rule.spoof === undefined)
    expect(evaluations.map((evaluation) => evaluation.rule.id)).toEqual(embeddedRules.map((rule) => rule.id))
  })

  it('skips the rules that need an interaction the trace does not hold', () => {
    const quiet = withEventsAfterInit()
    expect(statusOf(quiet, embedded, 'session-after-init')).toMatchObject({ status: 'skipped' })
    expect(statusOf(quiet, embedded, 'session-after-init')?.reason).toContain('--drive')
    expect(statusOf(quiet, embedded, 'complete-unit-known')?.status).toBe('skipped')
    expect(statusOf(quiet, embedded, 'run-granted')?.status).toBe('skipped')
    expect(statusOf(quiet, embedded, 'run-language')?.status).toBe('skipped')
  })

  it('skips the spoof rules until the scroll sends something with a session', () => {
    const silent = [fromScroll(hello()), fromHost(init('forged'), OTHER), fromHost(init())]
    const context: TraceContext = { ...embedded, spoof: 'origin', forgedSessions: ['forged'] }
    expect(statusOf(silent, context, 'init-origin-checked')?.status).toBe('skipped')
    const spoken = [...silent, fromScroll(progress())]
    expect(statusOf(spoken, context, 'init-origin-checked')?.status).toBe('pass')
  })

  it('skips the spoof rules when the host never issued a genuine init', () => {
    const context: TraceContext = { ...embedded, spoof: 'nonce', forgedSessions: ['forged'] }
    expect(statusOf([fromScroll(hello())], context, 'init-nonce-checked')?.reason).toBe('the host never sent init')
  })

  it('only evaluates the spoof rule of the variant that was run', () => {
    const context: TraceContext = { ...embedded, spoof: 'source', forgedSessions: ['forged'] }
    const ruleIds = evaluateTrace(cleanTrace(), context).map((evaluation) => evaluation.rule.id)
    expect(ruleIds).toContain('init-source-checked')
    expect(ruleIds).not.toContain('init-origin-checked')
  })

  it('has nothing to say about hello details when the scroll never said hello', () => {
    expect(statusOf([], embedded, 'hello-manifest')?.reason).toBe('the scroll never sent a valid hello')
    expect(statusOf([], embedded, 'hello-capabilities')?.status).toBe('skipped')
    expect(statusOf([], embedded, 'hello-sent')?.status).toBe('fail')
  })

  it('evaluates the non-embedded kinds with their own rules', () => {
    expect(evaluateTrace([], { ...embedded, kind: 'foreign-parent' }).map((e) => [e.rule.id, e.status])).toEqual([
      ['host-origin-targeted', 'pass'],
    ])
    expect(evaluateTrace([], { ...embedded, kind: 'standalone' }).map((e) => [e.rule.id, e.status])).toEqual([
      ['standalone-silent', 'pass'],
      ['standalone-no-crash', 'pass'],
    ])
  })
})
