import { describe, expect, it } from 'vitest'
import type { DriveFunction } from './browser.js'
import { exitCodeFor, formatTextReport, type ConformanceReport } from './report.js'
import { runConformance } from './run.js'
import { runScenarios } from './scenarios.js'
import { FakeDriver, type FakeHostPage, type ScrollFactory } from './testing/fake-driver.js'
import { simulate } from './testing/simulated-scrolls.js'
import { manifest } from './testing/traces.js'

const SCROLL_URL = 'http://scroll.test/index.html'

const interactions =
  (...names: string[]): DriveFunction =>
  async (page) => {
    names.forEach((name) => (page as FakeHostPage).interact(name))
  }

async function audit(
  createScroll: ScrollFactory,
  options: { drive?: DriveFunction; manifestOverrides?: Partial<typeof manifest> } = {},
): Promise<ConformanceReport> {
  let sessions = 0
  return runConformance({
    scrollUrl: SCROLL_URL,
    manifest: { ...manifest, ...options.manifestOverrides },
    driver: new FakeDriver(createScroll, SCROLL_URL),
    drive: options.drive,
    timeoutMs: 40,
    settleMs: 5,
    createSessionId: () => `host-session-${++sessions}`,
  })
}

const failing = (report: ConformanceReport) => report.rules.filter((rule) => rule.status === 'fail').map((rule) => rule.id)
const skipped = (report: ConformanceReport) => report.rules.filter((rule) => rule.status === 'skipped').map((rule) => rule.id)

describe('a conforming scroll', () => {
  it('passes every rule when a drive module exercises it', async () => {
    const report = await audit(simulate(), { drive: interactions('progress', 'complete', 'resize', 'run') })
    expect(failing(report)).toEqual([])
    expect(skipped(report)).toEqual([])
    expect(report.passed).toBe(true)
    expect(exitCodeFor(report)).toBe(0)
    expect(report.scenarios.map((scenario) => scenario.name)).toEqual([
      'handshake',
      'interaction',
      'spoofed-init:origin',
      'spoofed-init:source',
      'spoofed-init:nonce',
      'spoofed-init:replay',
      'foreign-parent',
      'standalone',
    ])
  })

  it('passes without a drive module and skips what needs an interaction, saying so', async () => {
    const report = await audit(simulate())
    expect(failing(report)).toEqual([])
    expect(skipped(report)).toEqual(['complete-unit-known', 'run-granted', 'run-language'])
    expect(report.rules.find((rule) => rule.id === 'run-granted')?.reason).toContain('--drive')
    expect(report.scenarios.find((scenario) => scenario.name === 'interaction')).toMatchObject({
      status: 'skipped',
      reason: expect.stringContaining('--drive'),
    })
    expect(exitCodeFor(report)).toBe(0)
  })

  it('has the reference host answer run with a result the scroll can read', async () => {
    const driver = new FakeDriver(simulate(), SCROLL_URL)
    await driver.start()
    const runs = await runScenarios({
      driver,
      manifest,
      scrollUrl: SCROLL_URL,
      drive: interactions('run'),
      timeoutMs: 40,
      settleMs: 5,
    })
    const interaction = runs.find((run) => run.name === 'interaction')
    const types = interaction?.status === 'ran' ? interaction.trace.map((event) => (event.data as { type: string }).type) : []
    expect(types).toEqual(expect.arrayContaining(['hello', 'init', 'run', 'result']))
  })
})

describe('deliberately broken scrolls', () => {
  const cases: Array<[string, ScrollFactory, string[], DriveFunction?]> = [
    ['sends no hello', simulate({ hello: false }), ['hello-sent']],
    ['posts to *', simulate({ wildcard: true }), ['host-origin-targeted']],
    ['adopts an init from any origin and window', simulate({ checkOrigin: false, checkSource: false }), ['init-origin-checked', 'init-source-checked']],
    ['does not check the source window', simulate({ checkSource: false }), ['init-source-checked']],
    ['does not check the nonce', simulate({ checkNonce: false }), ['init-nonce-checked']],
    ['adopts a second init', simulate({ adoptSecondInit: true }), ['init-replay-ignored']],
    ['uses a wrong session id', simulate({ sessionAfterInit: 'hardcoded' }), ['session-after-init']],
    ['sends no session', simulate({ sessionAfterInit: 'missing' }), ['message-schema', 'session-after-init']],
    ['sends a malformed message', simulate({ sendOnInit: 'malformed' }), ['message-schema']],
    ['posts when standalone', simulate({ standalone: 'posts' }), ['standalone-silent']],
    ['posts to * when framed without a host', simulate({ standalone: 'posts-anywhere' }), ['standalone-silent']],
    ['throws when standalone', simulate({ standalone: 'throws' }), ['standalone-no-crash']],
    [
      'says hello as someone else',
      simulate({ helloOverrides: { scroll: { id: 'someone-else', version: manifest.version } } }),
      ['hello-manifest'],
    ],
    [
      'asks for a capability the manifest does not declare',
      simulate({ helloOverrides: { capabilities: ['progress', 'run', 'llm'] } }),
      ['hello-capabilities'],
    ],
    ['completes a unit that does not exist', simulate(), ['complete-unit-known'], interactions('complete-unknown')],
    ['runs a language the manifest does not list', simulate(), ['run-language'], interactions('run-python')],
  ]

  it.each(cases)('%s', async (_name, createScroll, expected, drive) => {
    const report = await audit(createScroll, { drive })
    expect(failing(report)).toEqual(expected)
    expect(report.passed).toBe(false)
    expect(exitCodeFor(report)).toBe(1)
  })

  it('catches a run the host never granted', async () => {
    const report = await audit(simulate(), {
      drive: interactions('run'),
      manifestOverrides: { capabilities: ['progress'] },
    })
    expect(failing(report)).toEqual(expect.arrayContaining(['run-granted']))
  })
})

describe('a scroll that never says hello', () => {
  it('fails with a clear message and does not hang the runner', async () => {
    const started = Date.now()
    const report = await audit(simulate({ hello: false }))
    expect(Date.now() - started).toBeLessThan(2000)
    const hello = report.rules.find((rule) => rule.id === 'hello-sent')
    expect(hello?.violations[0]?.message).toBe('no valid hello within 40 ms; the scroll sent nothing')
    expect(report.scenarios.find((scenario) => scenario.name === 'spoofed-init:origin')).toMatchObject({
      status: 'skipped',
      reason: 'the scroll never sent a valid hello',
    })
    expect(report.rules.find((rule) => rule.id === 'init-origin-checked')).toMatchObject({
      status: 'skipped',
      reason: 'scenario spoofed-init:origin did not run: the scroll never sent a valid hello',
    })
  })
})

describe('a drive module that throws', () => {
  it('is reported as a scenario error with its own exit code', async () => {
    const report = await audit(simulate(), {
      drive: async () => {
        throw new Error('selector not found')
      },
    })
    expect(failing(report)).toEqual([])
    expect(report.passed).toBe(false)
    expect(exitCodeFor(report)).toBe(2)
    expect(report.scenarios.find((scenario) => scenario.name === 'interaction')?.error).toBe(
      'the --drive module failed: selector not found',
    )
    expect(formatTextReport(report)).toContain('Scenario errors:')
  })

  it('names a thrown value that is not an Error', async () => {
    const report = await audit(simulate(), {
      drive: async () => {
        throw 'plain string'
      },
    })
    expect(report.scenarios.find((scenario) => scenario.name === 'interaction')?.error).toContain('plain string')
  })
})

describe('the report', () => {
  it('serialises to JSON with a status per rule', async () => {
    const report = await audit(simulate({ wildcard: true }))
    const parsed = JSON.parse(JSON.stringify(report)) as ConformanceReport
    expect(parsed.scroll).toEqual({ id: 'sample', version: '1.2.3', url: SCROLL_URL })
    expect(parsed.rules.every((rule) => ['pass', 'fail', 'skipped'].includes(rule.status))).toBe(true)
    expect(parsed.counts.fail).toBe(1)
  })

  it('reads as text, with the failing event and scenario', async () => {
    const text = formatTextReport(await audit(simulate({ wildcard: true })))
    expect(text).toContain('sample@1.2.3')
    expect(text).toMatch(/FAIL {2}host-origin-targeted {2}PROTOCOL §3/)
    expect(text).toContain('[foreign-parent] hello was posted to a page that is not the host')
    expect(text).toContain('(event 0)')
    expect(text).toMatch(/18 rules: 14 passed, 1 failed, 3 skipped/)
  })

  it('shows a violation about something that never happened without an event', async () => {
    const text = formatTextReport(await audit(simulate({ hello: false })))
    expect(text).toContain('[handshake] no valid hello within 40 ms')
    expect(text).not.toContain('(event null)')
  })
})

describe('the driver lifecycle', () => {
  it('is started and stopped even when the audit throws', async () => {
    const driver = new FakeDriver(() => {
      throw new Error('cannot create the scroll')
    }, SCROLL_URL)
    await expect(
      runConformance({ scrollUrl: SCROLL_URL, manifest, driver, timeoutMs: 10, settleMs: 1 }),
    ).rejects.toThrow('cannot create the scroll')
    expect([driver.started, driver.stopped]).toEqual([1, 1])
  })

  it('is stopped when it fails to start, so nothing it opened keeps the process alive', async () => {
    const driver = new FakeDriver(simulate(), SCROLL_URL)
    driver.start = async () => {
      throw new Error('browser did not launch')
    }
    await expect(runConformance({ scrollUrl: SCROLL_URL, manifest, driver, timeoutMs: 10, settleMs: 1 })).rejects.toThrow(
      'browser did not launch',
    )
    expect(driver.stopped).toBe(1)
  })
})
