import { Hono } from 'hono'
import type { AppEnv } from '../app-env'

export const landingRoutes = new Hono<AppEnv>()

interface RepoStats {
  stars: number
  forks: number
  language: string
}

const REPO = 'rodacato/dojo'
const TTL_MS = 10 * 60 * 1000
const FALLBACK: RepoStats = { stars: 0, forks: 0, language: 'TypeScript' }

let cache: { data: RepoStats; fetchedAt: number } | null = null
let inflight: Promise<RepoStats> | null = null

async function fetchUpstream(): Promise<RepoStats> {
  const res = await fetch(`https://api.github.com/repos/${REPO}`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`github api ${res.status}`)
  const body = (await res.json()) as Record<string, unknown>
  return {
    stars: Number(body['stargazers_count'] ?? 0),
    forks: Number(body['forks_count'] ?? 0),
    language: String(body['language'] ?? 'TypeScript'),
  }
}

async function getRepoStats(): Promise<RepoStats> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < TTL_MS) return cache.data
  if (inflight) return inflight

  inflight = fetchUpstream()
    .then((data) => {
      cache = { data, fetchedAt: Date.now() }
      return data
    })
    .catch((err) => {
      if (cache) return cache.data
      throw err
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

landingRoutes.get('/landing/repo-stats', async (c) => {
  try {
    const stats = await getRepoStats()
    c.header('Cache-Control', 'public, max-age=600')
    return c.json(stats)
  } catch {
    return c.json(FALLBACK, 200)
  }
})
