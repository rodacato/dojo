import type { ScrollManifest } from '@dojo/shared'
import type { BrowserDriver, DriveFunction } from './browser.js'
import { buildReport, type ConformanceReport } from './report.js'
import { runScenarios } from './scenarios.js'

export interface RunOptions {
  scrollUrl: string
  manifest: ScrollManifest
  driver: BrowserDriver
  drive?: DriveFunction
  /** How long to wait for `hello`. */
  timeoutMs: number
  /** How long to watch a page once nothing else is going to happen. */
  settleMs: number
  createSessionId?: () => string
}

/** Runs every scenario against the scroll and folds the traces into one report. The driver is started and stopped here. */
export async function runConformance(options: RunOptions): Promise<ConformanceReport> {
  const { driver, manifest, scrollUrl } = options
  await driver.start()
  try {
    const runs = await runScenarios({
      driver,
      manifest,
      scrollUrl,
      drive: options.drive,
      timeoutMs: options.timeoutMs,
      settleMs: options.settleMs,
      createSessionId: options.createSessionId,
    })
    return buildReport({ id: manifest.id, version: manifest.version, url: scrollUrl }, runs)
  } finally {
    await driver.stop()
  }
}
