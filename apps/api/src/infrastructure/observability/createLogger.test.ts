import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLogger, runWithLogContext, addLogContext, type LogLevel } from './createLogger'

function capture(level: LogLevel | 'silent' = 'info') {
  const lines: string[] = []
  const logger = createLogger({
    level,
    pretty: false,
    destination: { write: (line) => void lines.push(line) },
  })
  const events = () => lines.map((l) => JSON.parse(l))
  return { logger, events }
}

describe('logger', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-16T12:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('writes one JSON line with level label, ISO time, evt and fields, without pid or hostname', () => {
    const { logger, events } = capture()
    logger.info('llm.response', { latencyMs: 12 })

    expect(events()).toEqual([
      { level: 'info', time: '2026-10-16T12:00:00.000Z', latencyMs: 12, evt: 'llm.response' },
    ])
  })

  it('drops events below the configured level', () => {
    const { logger, events } = capture('warn')
    logger.debug('a')
    logger.info('b')
    logger.warn('c')
    logger.error('d')

    expect(events().map((e) => e.evt)).toEqual(['c', 'd'])
  })

  it('emits nothing when silent', () => {
    const { logger, events } = capture('silent')
    logger.error('boom')
    expect(events()).toEqual([])
  })

  it('serializes an Error under err with type, message, stack and extra props', () => {
    const { logger, events } = capture()
    logger.error('x.failed', { err: Object.assign(new RangeError('too big'), { status: 413 }) })

    const [{ err }] = events()
    expect(err).toMatchObject({ type: 'RangeError', message: 'too big', status: 413 })
    expect(err.stack).toContain('RangeError')
  })

  it('merges the async request context into every event, including after awaits', async () => {
    const { logger, events } = capture()

    await runWithLogContext({ request_id: 'req-1' }, async () => {
      await Promise.resolve()
      addLogContext({ userId: 'u-1' })
      logger.info('inside')
    })
    logger.info('outside')

    const [inside, outside] = events()
    expect(inside).toMatchObject({ request_id: 'req-1', userId: 'u-1' })
    expect(outside).not.toHaveProperty('request_id')
  })

  it('does not leak one event\'s fields into the next event of the same request', () => {
    const { logger, events } = capture()

    runWithLogContext({ request_id: 'req-1' }, () => {
      logger.error('error.reported', { err: new Error('boom') })
      logger.info('http.request', { status: 500 })
    })

    const [, access] = events()
    expect(access).toMatchObject({ request_id: 'req-1', status: 500 })
    expect(access).not.toHaveProperty('err')
  })

  it('keeps concurrent contexts apart', async () => {
    const { logger, events } = capture()
    const run = (id: string, delay: number) =>
      runWithLogContext({ request_id: id }, async () => {
        await new Promise((r) => setTimeout(r, delay))
        logger.info('done')
      })

    await Promise.all([run('slow', 20), run('fast', 1)])

    expect(events().map((e) => e.request_id)).toEqual(['fast', 'slow'])
  })

  it('redacts credentials in headers and token fields', () => {
    const { logger, events } = capture()
    logger.info('http.debug', {
      req: { headers: { authorization: 'Bearer secret', cookie: 'sid=secret', accept: 'json' } },
      session: { token: 'secret' },
    })

    const line = JSON.stringify(events()[0])
    expect(line).not.toContain('secret')
    expect(events()[0].req.headers.accept).toBe('json')
  })

  it('does not throw on circular fields', () => {
    const { logger, events } = capture()
    const circular: Record<string, unknown> = {}
    circular['self'] = circular

    expect(() => logger.info('bad', { circular })).not.toThrow()
    expect(events()[0].evt).toBe('bad')
  })
})
