import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

// Chunk URLs contain content hashes that change on every deploy. A tab kept
// open across a deploy still holds the old entry bundle, which points at chunk
// filenames the server no longer serves — the next navigation to a lazy route
// fails with "Failed to fetch dynamically imported module". Reloading the page
// fetches a fresh HTML entry and the matching new chunks. A session-scoped
// guard prevents a reload loop if the new assets are also broken.

const RELOAD_KEY = 'dojo.chunkReloadAt'
const RELOAD_COOLDOWN_MS = 10_000

const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory()
    } catch (err) {
      if (!(err instanceof Error) || !CHUNK_ERROR_RE.test(err.message)) throw err

      const now = Date.now()
      const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0)
      if (now - last < RELOAD_COOLDOWN_MS) throw err

      window.sessionStorage.setItem(RELOAD_KEY, String(now))
      window.location.reload()
      // Keep Suspense in its fallback while the reload takes effect — no
      // flash of the global ErrorBoundary.
      return new Promise<never>(() => {})
    }
  })
}
