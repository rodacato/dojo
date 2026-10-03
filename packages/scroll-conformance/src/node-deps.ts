import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { BrowserDriver, DriveFunction } from './browser.js'
import type { CliDeps } from './cli.js'

async function readText(source: string): Promise<string> {
  if (!/^https?:\/\//.test(source)) return readFile(source, 'utf8')
  const response = await fetch(source)
  if (!response.ok) throw new Error(`${source} answered ${response.status}`)
  return response.text()
}

async function loadDrive(path: string): Promise<DriveFunction> {
  const module = (await import(pathToFileURL(resolve(path)).href)) as { default?: unknown }
  if (typeof module.default !== 'function') {
    throw new Error(`the --drive module ${path} must export a default function (page) => Promise<void>`)
  }
  return module.default as DriveFunction
}

/** The real filesystem, network and console; only the browser is passed in. */
export function nodeDeps(createDriver: () => Promise<BrowserDriver>): CliDeps {
  return {
    stdout: (text) => console.log(text),
    stderr: (text) => console.error(text),
    readText,
    loadDrive,
    createDriver,
  }
}
