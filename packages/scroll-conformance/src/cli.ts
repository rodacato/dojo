import { parseArgs } from 'node:util'
import { scrollManifestSchema } from '@dojo/shared'
import type { BrowserDriver, DriveFunction } from './browser.js'
import { exitCodeFor, formatTextReport } from './report.js'
import { runConformance } from './run.js'

const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_SETTLE_MS = 1_500

export interface CliDeps {
  stdout(text: string): void
  stderr(text: string): void
  /** Reads a file path or an http(s) URL. */
  readText(source: string): Promise<string>
  loadDrive(path: string): Promise<DriveFunction>
  createDriver(): Promise<BrowserDriver>
}

const USAGE = `Usage: dojo-scroll-conformance --url <scroll url> [options]

Audits a scroll by the messages it sends.

Options:
  --url <url>        where the scroll is served (required)
  --manifest <src>   scroll.json as a file or URL (default: scroll.json next to --url)
  --drive <module>   module whose default export (page) => Promise<void> interacts with the scroll
  --json             print the report as JSON
  --timeout <ms>     how long to wait for hello (default ${DEFAULT_TIMEOUT_MS})
  --settle <ms>      how long to watch a page once it is quiet (default ${DEFAULT_SETTLE_MS})
  --help             print this text

Exit code: 0 all rules pass or are skipped, 1 a rule fails, 2 the suite could not run.`

class UsageError extends Error {}

function parseMilliseconds(name: string, raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) throw new UsageError(`--${name} must be a positive integer of milliseconds`)
  return value
}

function parseUrl(raw: string | undefined): string {
  if (!raw) throw new UsageError('--url is required')
  try {
    const url = new URL(raw)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    // reported below
  }
  throw new UsageError(`--url must be an http(s) URL, got "${raw}"`)
}

async function loadManifest(deps: CliDeps, source: string) {
  let json: unknown
  try {
    json = JSON.parse(await deps.readText(source))
  } catch (error) {
    throw new UsageError(`cannot read the manifest ${source}: ${error instanceof Error ? error.message : String(error)}`)
  }
  const parsed = scrollManifestSchema.safeParse(json)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    throw new UsageError(`the manifest ${source} is not valid: ${issues.join('; ')}`)
  }
  return parsed.data
}

function parseOptions(argv: string[]) {
  try {
    return parseArgs({
      args: argv,
      options: {
        url: { type: 'string' },
        manifest: { type: 'string' },
        drive: { type: 'string' },
        json: { type: 'boolean', default: false },
        timeout: { type: 'string' },
        settle: { type: 'string' },
        help: { type: 'boolean', default: false },
      },
    }).values
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error))
  }
}

export async function runCli(argv: string[], deps: CliDeps): Promise<number> {
  try {
    const values = parseOptions(argv)
    if (values.help) {
      deps.stdout(USAGE)
      return 0
    }
    const scrollUrl = parseUrl(values.url)
    const timeoutMs = parseMilliseconds('timeout', values.timeout, DEFAULT_TIMEOUT_MS)
    const settleMs = parseMilliseconds('settle', values.settle, DEFAULT_SETTLE_MS)
    const manifest = await loadManifest(deps, values.manifest ?? new URL('scroll.json', scrollUrl).href)
    const drive = values.drive ? await deps.loadDrive(values.drive) : undefined

    const report = await runConformance({
      scrollUrl,
      manifest,
      driver: await deps.createDriver(),
      drive,
      timeoutMs,
      settleMs,
    })
    deps.stdout(values.json ? JSON.stringify(report, null, 2) : formatTextReport(report))
    return exitCodeFor(report)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    deps.stderr(`error: ${message}`)
    if (error instanceof UsageError) deps.stderr(USAGE)
    return 2
  }
}
