import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT ?? 4010)
const html = [join(root, 'index.html'), 'text/html; charset=utf-8']
const files = {
  '/': html,
  '/index.html': html,
  '/scroll.json': [join(root, 'scroll.json'), 'application/json'],
  // The scroll serves the web app's copy of the kit, so a change to the kit is tested here first.
  '/scroll-kit/v0.js': [join(root, '../../../web/public/scroll-kit/v0.js'), 'text/javascript'],
}

createServer(async (req, res) => {
  const entry = files[new URL(req.url ?? '/', 'http://localhost').pathname]
  if (!entry) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'content-type': entry[1] })
  res.end(await readFile(entry[0]))
}).listen(port, () => console.log(`reference scroll on http://localhost:${port}`))
