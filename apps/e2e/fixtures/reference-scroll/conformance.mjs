// Serves the reference scroll and audits it with the conformance suite: pnpm --filter=@dojo/e2e conformance
import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const url = 'http://localhost:4010/index.html'
// Run with node, not the linked bin: pnpm links it before dist/ is built, so a clean install leaves it non-executable.
const suiteBin = fileURLToPath(new URL('bin.js', import.meta.resolve('@dojo/scroll-conformance')))

async function waitUntilServed() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  throw new Error(`the reference scroll did not come up at ${url}`)
}

const server = spawn(process.execPath, [join(root, 'serve.mjs')], { stdio: 'ignore' })
try {
  await waitUntilServed()
  const suite = spawn(process.execPath, [suiteBin, '--url', url, '--drive', join(root, 'drive.mjs')], {
    stdio: 'inherit',
  })
  process.exitCode = await new Promise((resolve) => suite.on('exit', (code) => resolve(code ?? 2)))
} finally {
  server.kill()
}
