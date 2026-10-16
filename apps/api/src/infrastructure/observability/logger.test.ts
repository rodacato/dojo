import { describe, expect, it } from 'vitest'
import { createLogger, runWithLogContext, addLogContext, type LogLevel } from './logger'

function capture(level: LogLevel | 'silent' = 'info', pretty = false) {
  const lines: Array<{ line: string; level: LogLevel }> = []
  const logger = createLogger({
    level,
    pretty,
    write: (line, lvl) => lines.push({ line, level: lvl }),
    now: () => new Date('2026-10-16T12:00:00.000Z'),
  })
  return { logger, lines }
}

describe('logger', () => {
  it('writes one JSON line with level, time, evt and fields', () => {
    const { logger, lines } = capture()
    logger.info('llm.response', { latencyMs: 12 })

    expect(JSON.parse(lines[0]!.line)).toEqual({
      level: 'info',
      time: '2026-10-16T12:00:00.000Z',
      evt: 'llm.response',
      latencyMs: 12,
    })
  })

  it('drops events below the configured level', () => {
    const { logger, lines } = capture('warn')
    logger.debug('a')
    logger.info('b')
    logger.warn('c')
    logger.error('d')

    expect(lines.map((l) => JSON.parse(l.line).evt)).toEqual(['c', 'd'])
  })

  it('emits nothing when silent', () => {
    const { logger, lines } = capture('silent')
    logger.error('boom')
    expect(lines).toEqual([])
  })

  it('serializes an Error under err with name, message and stack', () => {
    const { logger, lines } = capture()
    logger.error('x.failed', { err: Object.assign(new RangeError('too big'), { status: 413 }) })

    const { err } = JSON.parse(lines[0]!.line)
    expect(err).toMatchObject({ name: 'RangeError', message: 'too big', status: 413 })
    expect(err.stack).toContain('RangeError')
  })

  it('accepts a non-Error throwable', () => {
    const { logger, lines } = capture()
    logger.error('x.failed', { err: 'plain string' })
    expect(JSON.parse(lines[0]!.line).err).toEqual({ message: 'plain string' })
  })

  it('merges the async request context into every event, including after awaits', async () => {
    const { logger, lines } = capture()

    await runWithLogContext({ requestId: 'req-1' }, async () => {
      await Promise.resolve()
      addLogContext({ userId: 'u-1' })
      logger.info('inside')
    })
    logger.info('outside')

    expect(JSON.parse(lines[0]!.line)).toMatchObject({ requestId: 'req-1', userId: 'u-1' })
    expect(JSON.parse(lines[1]!.line)).not.toHaveProperty('requestId')
  })

  it('keeps concurrent contexts apart', async () => {
    const { logger, lines } = capture()
    const run = (id: string, delay: number) =>
      runWithLogContext({ requestId: id }, async () => {
        await new Promise((r) => setTimeout(r, delay))
        logger.info('done')
      })

    await Promise.all([run('slow', 20), run('fast', 1)])

    expect(lines.map((l) => JSON.parse(l.line).requestId)).toEqual(['fast', 'slow'])
  })

  it('does not throw on fields JSON cannot serialize', () => {
    const { logger, lines } = capture()
    const circular: Record<string, unknown> = {}
    circular['self'] = circular

    expect(() => logger.info('bad', { circular })).not.toThrow()
    expect(JSON.parse(lines[0]!.line)).toMatchObject({ evt: 'bad', logError: 'unserializable_fields' })
  })

  it('routes the level to the writer so errors can go to stderr', () => {
    const { logger, lines } = capture()
    logger.warn('w')
    logger.error('e')
    expect(lines.map((l) => l.level)).toEqual(['warn', 'error'])
  })

  it('pretty mode prints a readable line without undefined fields', () => {
    const { logger, lines } = capture('info', true)
    logger.info('http.request', { method: 'GET', status: 200, userId: undefined })

    expect(lines[0]!.line).toBe('12:00:00.000 INFO  http.request method=GET status=200')
  })
})
