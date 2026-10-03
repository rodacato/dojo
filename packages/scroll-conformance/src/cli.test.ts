import { describe, expect, it } from 'vitest'
import type { BrowserDriver, DriveFunction } from './browser.js'
import { runCli, type CliDeps } from './cli.js'
import type { ConformanceReport } from './report.js'
import { FakeDriver, type FakeHostPage } from './testing/fake-driver.js'
import { simulate, type Behaviour } from './testing/simulated-scrolls.js'
import { manifest } from './testing/traces.js'

const URL_ARG = 'http://scroll.test/app/index.html'
const FAST = ['--timeout', '40', '--settle', '5']

function setup(behaviour: Partial<Behaviour> = {}, files: Record<string, string> = {}) {
  const out: string[] = []
  const err: string[] = []
  const read: string[] = []
  const loaded: string[] = []
  const drives: unknown[] = []
  const deps: CliDeps = {
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
    readText: async (source) => {
      read.push(source)
      const text = { 'http://scroll.test/app/scroll.json': JSON.stringify(manifest), ...files }[source]
      if (text === undefined) throw new Error(`no such file ${source}`)
      return text
    },
    loadDrive: async (path) => {
      loaded.push(path)
      const drive: DriveFunction = async (page) => {
        drives.push(page)
        ;(page as FakeHostPage).interact('progress')
      }
      return drive
    },
    createDriver: async (): Promise<BrowserDriver> => new FakeDriver(simulate(behaviour), URL_ARG),
  }
  return { deps, out, err, read, loaded, drives }
}

describe('runCli', () => {
  it('prints a text report and exits 0 for a conforming scroll', async () => {
    const { deps, out, read } = setup()
    expect(await runCli(['--url', URL_ARG, ...FAST], deps)).toBe(0)
    expect(read).toEqual(['http://scroll.test/app/scroll.json'])
    expect(out[0]).toContain('PASS  envelope')
    expect(out[0]).toContain('18 rules')
  })

  it('prints valid JSON with a status per rule and exits 1 when a rule fails', async () => {
    const { deps, out } = setup({ wildcard: true })
    expect(await runCli(['--url', URL_ARG, '--json', ...FAST], deps)).toBe(1)
    const report = JSON.parse(out[0] ?? '') as ConformanceReport
    expect(report.passed).toBe(false)
    expect(report.rules).toHaveLength(18)
    expect(report.rules.find((rule) => rule.id === 'host-origin-targeted')?.status).toBe('fail')
    expect(report.rules.every((rule) => ['pass', 'fail', 'skipped'].includes(rule.status))).toBe(true)
  })

  it('exits 1 with a clear message for a scroll that never says hello', async () => {
    const { deps, out } = setup({ hello: false })
    expect(await runCli(['--url', URL_ARG, ...FAST], deps)).toBe(1)
    expect(out[0]).toContain('FAIL  hello-sent')
    expect(out[0]).toContain('no valid hello within 40 ms; the scroll sent nothing')
  })

  it('reads the manifest from --manifest and hands the drive module the host page', async () => {
    const { deps, read, loaded, drives } = setup({}, { 'custom.json': JSON.stringify(manifest) })
    expect(await runCli(['--url', URL_ARG, '--manifest', 'custom.json', '--drive', 'drive.mjs', ...FAST], deps)).toBe(0)
    expect(read).toEqual(['custom.json'])
    expect(loaded).toEqual(['drive.mjs'])
    expect(drives.length).toBeGreaterThan(0)
  })

  it('exits 2 with the usage when --url is missing', async () => {
    const { deps, err } = setup()
    expect(await runCli([], deps)).toBe(2)
    expect(err[0]).toBe('error: --url is required')
    expect(err[1]).toContain('Usage: dojo-scroll-conformance')
  })

  it.each([
    [['--url', 'ftp://scroll.test'], '--url must be an http(s) URL'],
    [['--url', 'not a url'], '--url must be an http(s) URL'],
    [['--url', URL_ARG, '--timeout', 'soon'], '--timeout must be a positive integer'],
    [['--url', URL_ARG, '--settle', '0'], '--settle must be a positive integer'],
    [['--url', URL_ARG, '--bogus'], "Unknown option '--bogus'"],
  ])('exits 2 for %j', async (argv, message) => {
    const { deps, err } = setup()
    expect(await runCli(argv, deps)).toBe(2)
    expect(err[0]).toContain(message)
  })

  it('exits 2 when the manifest cannot be read, parsed or validated', async () => {
    const missing = setup()
    expect(await runCli(['--url', URL_ARG, '--manifest', 'nope.json'], missing.deps)).toBe(2)
    expect(missing.err[0]).toContain('cannot read the manifest nope.json: no such file nope.json')

    const broken = setup({}, { 'bad.json': '{ not json' })
    expect(await runCli(['--url', URL_ARG, '--manifest', 'bad.json'], broken.deps)).toBe(2)
    expect(broken.err[0]).toContain('cannot read the manifest bad.json')

    const invalid = setup({}, { 'invalid.json': JSON.stringify({ ...manifest, protocol: 3, units: [] }) })
    expect(await runCli(['--url', URL_ARG, '--manifest', 'invalid.json'], invalid.deps)).toBe(2)
    expect(invalid.err[0]).toContain('the manifest invalid.json is not valid: ')
    expect(invalid.err[0]).toContain('protocol')
  })

  it('exits 2 when the browser cannot start, without the usage text', async () => {
    const { deps, err } = setup()
    deps.createDriver = async () => {
      throw new Error('browserType.launch: libglib-2.0.so.0: cannot open shared object file')
    }
    expect(await runCli(['--url', URL_ARG, ...FAST], deps)).toBe(2)
    expect(err).toEqual(['error: browserType.launch: libglib-2.0.so.0: cannot open shared object file'])
  })

  it('names a thrown value that is not an Error', async () => {
    const { deps, err } = setup()
    deps.createDriver = async () => {
      throw 'plain string'
    }
    expect(await runCli(['--url', URL_ARG, ...FAST], deps)).toBe(2)
    expect(err).toEqual(['error: plain string'])
  })

  it('prints the usage for --help', async () => {
    const { deps, out } = setup()
    expect(await runCli(['--help'], deps)).toBe(0)
    expect(out[0]).toContain('--drive <module>')
  })
})
