#!/usr/bin/env node
import { runCli } from './cli.js'
import { nodeDeps } from './node-deps.js'

const deps = nodeDeps(async () => {
  const { PlaywrightDriver } = await import('./playwright-driver.js')
  return new PlaywrightDriver()
})

process.exitCode = await runCli(process.argv.slice(2), deps)
