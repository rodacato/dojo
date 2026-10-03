import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface Page {
  contentType: string
  body: string
}

export interface PageServer {
  origin: string
  close(): Promise<void>
}

/** Serves fixed pages on a free local port; every server gets its own origin. */
export async function startPageServer(pages: Record<string, Page>): Promise<PageServer> {
  const server = createServer((request, response) => {
    const page = pages[new URL(request.url ?? '/', 'http://localhost').pathname]
    if (!page) {
      response.writeHead(404).end('not found')
      return
    }
    response.writeHead(200, { 'content-type': page.contentType, 'cache-control': 'no-store' }).end(page.body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}
