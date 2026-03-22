import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../persistence/drizzle/client'
import { sessions, exercises, attempts, users } from '../../persistence/drizzle/schema'
import { config } from '../../../config'
import type { AppEnv } from '../app-env'

export const ogRoutes = new Hono<AppEnv>()

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discord|slack/i

function isCrawler(ua: string | undefined): boolean {
  return BOT_UA.test(ua ?? '')
}

function ogHtml(props: { title: string; description: string; image?: string; url: string }): string {
  const { title, description, image, url } = props
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(url)}">
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${escapeHtml(image)}">` : ''}
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
</head>
<body></body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ---------------------------------------------------------------------------
// GET /og/kata/:sessionId — OG meta for kata results
// ---------------------------------------------------------------------------

ogRoutes.get('/og/kata/:sessionId', async (c) => {
  const ua = c.req.header('user-agent')
  if (!isCrawler(ua)) {
    return c.redirect(`${config.WEB_URL}/kata/${c.req.param('sessionId')}/result`)
  }

  const { sessionId } = c.req.param()

  const [row] = await db
    .select({
      exerciseTitle: exercises.title,
      exerciseType: exercises.type,
      username: users.username,
      verdict: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'verdict'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), eq(sessions.status, 'completed')))
    .limit(1)

  if (!row) return c.redirect(`${config.WEB_URL}/kata/${sessionId}/result`)

  const verdict = row.verdict?.replace(/_/g, ' ') ?? 'COMPLETED'
  const apiUrl = c.req.url.replace(/\/og\/kata\/.*/, '')

  return c.html(ogHtml({
    title: `${verdict} — ${row.exerciseTitle} | dojo_`,
    description: `@${row.username} completed a ${row.exerciseType} kata in the dojo.`,
    image: `${apiUrl}/share/${sessionId}.png`,
    url: `${config.WEB_URL}/kata/${sessionId}/result`,
  }))
})

// ---------------------------------------------------------------------------
// GET /og/u/:username — OG meta for public profiles
// ---------------------------------------------------------------------------

ogRoutes.get('/og/u/:username', async (c) => {
  const ua = c.req.header('user-agent')
  const { username } = c.req.param()
  if (!isCrawler(ua)) {
    return c.redirect(`${config.WEB_URL}/u/${username}`)
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  })

  if (!user) return c.redirect(`${config.WEB_URL}/u/${username}`)

  return c.html(ogHtml({
    title: `@${user.username} | dojo_`,
    description: `${user.username}'s practice record in the dojo. Daily kata for developers who still have something to prove.`,
    url: `${config.WEB_URL}/u/${username}`,
  }))
})
