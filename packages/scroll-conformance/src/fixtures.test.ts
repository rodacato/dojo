import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { scrollManifestSchema } from '@dojo/shared'
import { exitCodeFor, type ConformanceReport } from './report.js'
import { runConformance } from './run.js'
import { FakeDriver, type FakeHostPage } from './testing/fake-driver.js'
import { htmlScroll } from './testing/html-scroll.js'

const fixtures = new URL('../fixtures/', import.meta.url)
const e2eFixture = new URL('../../../apps/e2e/fixtures/scroll/', import.meta.url)

const readManifest = (dir: URL) => scrollManifestSchema.parse(JSON.parse(readFileSync(new URL('scroll.json', dir), 'utf8')))

async function audit(dir: URL, scrollUrl: string, drive?: (page: unknown) => Promise<void>): Promise<ConformanceReport> {
  return runConformance({
    scrollUrl,
    manifest: readManifest(dir),
    driver: new FakeDriver(htmlScroll(fileURLToPath(new URL('index.html', dir))), scrollUrl),
    drive,
    timeoutMs: 40,
    settleMs: 5,
  })
}

const failing = (report: ConformanceReport) => report.rules.filter((rule) => rule.status === 'fail').map((rule) => rule.id)

const expectations: Record<string, string[]> = {
  'broken-no-hello': ['hello-sent'],
  'broken-wildcard-target': ['host-origin-targeted'],
  'broken-spoofed-init': ['init-origin-checked', 'init-source-checked'],
  'broken-wrong-session': ['session-after-init'],
  'broken-malformed-message': ['message-schema'],
  'broken-posts-standalone': ['standalone-silent'],
}

describe('the broken fixtures, run as written', () => {
  it('has an expectation for every fixture directory and no other', () => {
    const dirs = readdirSync(fixtures, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    expect(dirs.map((dir) => dir.name).sort()).toEqual(Object.keys(expectations).sort())
  })

  it.each(Object.entries(expectations))('%s fails exactly %j', async (name, expected) => {
    const dir = new URL(`${name}/`, fixtures)
    const report = await audit(dir, `http://scroll.test/${name}/index.html`)
    expect(failing(report)).toEqual(expected)
    expect(exitCodeFor(report)).toBe(1)
  })
})

describe('the HTML extraction', () => {
  it('runs scripts written with upper-case tags, attributes and a closing tag that carries extra text', async () => {
    const source = new URL('broken-wildcard-target/', fixtures)
    const dir = mkdtempSync(join(tmpdir(), 'scroll-fixture-'))
    try {
      const html = readFileSync(new URL('index.html', source), 'utf8')
        .replace('<script>', '<SCRIPT TYPE="text/javascript">')
        .replace('</script>', '</SCRIPT\t\n bar>')
      writeFileSync(join(dir, 'index.html'), html)
      writeFileSync(join(dir, 'scroll.json'), readFileSync(new URL('scroll.json', source)))

      const report = await audit(pathToFileURL(`${dir}/`), 'http://scroll.test/upper-case/index.html')

      expect(failing(report)).toEqual(['host-origin-targeted'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('the good fixture of the e2e suite', () => {
  const drive = async (hostPage: unknown) => {
    const page = hostPage as FakeHostPage
    const frame = {
      frameLocator: () => ({
        locator: (selector: string) => ({ click: async () => page.interact(selector.slice(1)) }),
      }),
    }
    const { default: driveFixture } = (await import(new URL('drive-e2e-fixture.mjs', fixtures).href)) as {
      default: (page: typeof frame) => Promise<void>
    }
    await driveFixture(frame)
  }

  it('passes, running the real shim and the real page', async () => {
    const report = await audit(e2eFixture, 'http://localhost:4010/index.html', drive)
    expect(failing(report)).toEqual([])
    expect(report.rules.filter((rule) => rule.status === 'skipped').map((rule) => rule.id)).toEqual([
      'run-granted',
      'run-language',
    ])
    expect(report.passed).toBe(true)
    expect(exitCodeFor(report)).toBe(0)
  })

  it('also passes without a drive module, with fewer rules exercised', async () => {
    const report = await audit(e2eFixture, 'http://localhost:4010/index.html')
    expect(failing(report)).toEqual([])
    expect(report.rules.find((rule) => rule.id === 'session-after-init')?.status).toBe('skipped')
  })
})

describe('serve.mjs', () => {
  it('serves a fixture and refuses to leave the fixtures directory', async () => {
    const { serveFixtures } = (await import(new URL('serve.mjs', fixtures).href)) as {
      serveFixtures: (port: number) => Promise<Server>
    }
    const server = await serveFixtures(0)
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    try {
      const page = await fetch(`${base}/broken-no-hello/index.html`)
      expect(page.status).toBe(200)
      expect(page.headers.get('content-type')).toContain('text/html')
      expect((await fetch(`${base}/broken-no-hello/scroll.json`)).headers.get('content-type')).toBe('application/json')
      expect((await fetch(`${base}/missing.html`)).status).toBe(404)
      expect((await fetch(`${base}/..%2Fpackage.json`)).status).toBe(404)
      expect((await fetch(`${base}/serve.mjs`)).status).toBe(404)
    } finally {
      server.close()
    }
  })
})
