import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT ?? 4010)
const html = ['index.html', 'text/html; charset=utf-8']
const files = {
  '/': html,
  '/index.html': html,
  '/scroll.json': ['scroll.json', 'application/json'],
}

createServer(async (req, res) => {
  const entry = files[new URL(req.url ?? '/', 'http://localhost').pathname]
  if (!entry) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'content-type': entry[1] })
  res.end(await readFile(join(root, entry[0])))
}).listen(port, () => console.log(`scroll fixture on http://localhost:${port}`))
