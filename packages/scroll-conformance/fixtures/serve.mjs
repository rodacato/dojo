// Serves the broken-scroll fixtures so the runner can be pointed at them: node fixtures/serve.mjs, then
// dojo-scroll-conformance --url http://localhost:4020/broken-no-hello/index.html
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, normalize, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json' }

export function serveFixtures(port) {
  const server = createServer(async (req, res) => {
    const path = normalize(join(root, decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)))
    const type = types[extname(path)]
    if (!type || !path.startsWith(root + sep)) {
      res.writeHead(404).end('not found')
      return
    }
    try {
      const body = await readFile(path)
      res.writeHead(200, { 'content-type': type }).end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 4020)
  await serveFixtures(port)
  console.log(`broken scroll fixtures on http://localhost:${port}`)
}
