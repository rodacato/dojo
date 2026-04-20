import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { db } from '../../persistence/drizzle/client'
import {
  sessions,
  exercises,
  attempts,
  users,
  courses,
  lessons,
  steps,
  courseProgress,
} from '../../persistence/drizzle/schema'
import type { AppEnv } from '../app-env'

export const shareRoutes = new Hono<AppEnv>()

// Font loaded once at startup
let fontData: ArrayBuffer | null = null

async function getFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData
  const res = await fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.woff',
  )
  fontData = await res.arrayBuffer()
  return fontData
}

// Satori element helper — avoids React dependency
function h(type: string, style: Record<string, unknown>, ...children: unknown[]) {
  return { type, props: { style, children: children.length === 1 ? children[0] : children } }
}

// ---------------------------------------------------------------------------
// GET /share/:sessionId.png — Generate OG share card image
// ---------------------------------------------------------------------------

shareRoutes.get('/share/:sessionId{.+\\.png$}', async (c) => {
  const sessionId = c.req.param('sessionId').replace(/\.png$/, '')

  const [row] = await db
    .select({
      sessionId: sessions.id,
      status: sessions.status,
      startedAt: sessions.startedAt,
      completedAt: sessions.completedAt,
      exerciseTitle: exercises.title,
      exerciseType: exercises.type,
      difficulty: exercises.difficulty,
      username: users.username,
      verdict: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'verdict'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
      analysis: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'analysis'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  if (!row) return c.json({ error: 'Session not found' }, 404)

  const verdict = (row.verdict ?? 'needs_work').toLowerCase()
  const verdictLabel = verdict.replace(/_/g, ' ').toUpperCase()
  const verdictColor =
    verdict === 'passed' ? '#10B981' : verdict === 'passed_with_notes' ? '#F59E0B' : '#EF4444'

  const exType = row.exerciseType.toLowerCase()
  const typeColor =
    exType === 'code' ? '#6366F1' : exType === 'chat' ? '#7C3AED' : '#0D9488'

  const diff = row.difficulty.toLowerCase()
  const diffColor =
    diff === 'easy' ? '#10B981' : diff === 'medium' ? '#F59E0B' : '#EF4444'

  const pullQuote = extractPullQuote(row.analysis ?? '')
  const completionTime = row.completedAt
    ? Math.round((new Date(row.completedAt).getTime() - new Date(row.startedAt).getTime()) / 60000)
    : null

  const font = await getFont()

  const middleChildren = [
    h('div', { display: 'flex', gap: '12px', alignItems: 'center' },
      h('span', { fontSize: '14px', color: typeColor, padding: '3px 10px', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '3px' }, row.exerciseType.toUpperCase()),
      h('span', { fontSize: '14px', color: diffColor }, row.difficulty.toUpperCase()),
    ),
    h('span', { fontSize: '32px', color: '#F8FAFC', lineHeight: '1.3' }, row.exerciseTitle),
  ]

  if (pullQuote) {
    middleChildren.push(
      h('div', { display: 'flex', borderLeft: '3px solid #334155', paddingLeft: '16px', marginTop: '8px' },
        h('span', { fontSize: '16px', color: '#94A3B8', fontStyle: 'italic', lineHeight: '1.5' }, `"${pullQuote}"`),
      ),
    )
  }

  const bottomChildren = [
    h('span', { fontSize: '16px', color: '#64748B' }, `@${row.username}`),
  ]
  if (completionTime) {
    bottomChildren.push(h('span', { fontSize: '16px', color: '#64748B' }, `${completionTime}min`))
  }

  const element = h('div', {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '1200px',
    height: '630px',
    backgroundColor: '#0F172A',
    padding: '60px',
    fontFamily: 'JetBrains Mono',
    color: '#F8FAFC',
  },
    // Top
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
      h('span', { fontSize: '28px', color: '#6366F1', letterSpacing: '-0.05em' }, 'dojo_'),
      h('span', { fontSize: '18px', color: verdictColor, padding: '6px 16px', border: `2px solid ${verdictColor}`, borderRadius: '4px' }, verdictLabel),
    ),
    // Middle
    h('div', { display: 'flex', flexDirection: 'column', gap: '16px', flex: '1', justifyContent: 'center' }, ...middleChildren),
    // Bottom
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }, ...bottomChildren),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(element as any, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'JetBrains Mono', data: font, weight: 400, style: 'normal' as const }],
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const pngBuffer = resvg.render().asPng()

  return new Response(pngBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})

// ---------------------------------------------------------------------------
// GET /share/:sessionId — Public share data (JSON)
// ---------------------------------------------------------------------------

shareRoutes.get('/share/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')

  // Don't match .png requests
  if (sessionId.endsWith('.png')) return c.notFound()

  const [row] = await db
    .select({
      sessionId: sessions.id,
      status: sessions.status,
      startedAt: sessions.startedAt,
      completedAt: sessions.completedAt,
      exerciseTitle: exercises.title,
      exerciseType: exercises.type,
      difficulty: exercises.difficulty,
      username: users.username,
      avatarUrl: users.avatarUrl,
      verdict: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'verdict'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
      analysis: sql<string | null>`(
        SELECT ${attempts.llmResponse}::jsonb->>'analysis'
        FROM ${attempts}
        WHERE ${attempts.sessionId} = ${sessions.id} AND ${attempts.isFinalEvaluation} = true
        LIMIT 1
      )`,
      ownerRole: sql<string | null>`(
        SELECT v.owner_role FROM variations v WHERE v.id = ${sessions.variationId} LIMIT 1
      )`,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  if (!row || (row.status !== 'completed' && row.status !== 'failed')) {
    return c.json({ error: 'Not found' }, 404)
  }

  const pullQuote = extractPullQuote(row.analysis ?? '')
  const completionMinutes = row.completedAt
    ? Math.round((new Date(row.completedAt).getTime() - new Date(row.startedAt).getTime()) / 60000)
    : null

  return c.json({
    sessionId: row.sessionId,
    exerciseTitle: row.exerciseTitle,
    exerciseType: row.exerciseType,
    difficulty: row.difficulty,
    verdict: row.verdict ?? 'needs_work',
    pullQuote,
    completionMinutes,
    username: row.username,
    avatarUrl: row.avatarUrl,
    ownerRole: row.ownerRole,
  })
})

function extractPullQuote(analysis: string): string | null {
  if (!analysis || analysis.length < 20) return null
  const sentences = analysis.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20)
  const specific = sentences.find(
    (s) => s.length > 40 && s.length < 200 && !s.toLowerCase().startsWith('overall'),
  )
  const quote = specific ?? sentences[1] ?? sentences[0]
  if (!quote) return null
  return quote.length > 150 ? quote.slice(0, 147) + '...' : quote
}

// ---------------------------------------------------------------------------
// Course completion share
// ---------------------------------------------------------------------------

interface CourseCompletionRow {
  courseId: string
  courseTitle: string
  courseAccentColor: string
  courseLanguage: string
  isPublic: boolean
  totalSteps: number
  completedSteps: string[]
  lastAccessedAt: Date
  username: string
  avatarUrl: string
}

async function loadCourseCompletion(
  slug: string,
  userId: string,
): Promise<CourseCompletionRow | null> {
  // One round-trip: course + progress + step count + user, joined. We
  // aggregate step count via a correlated subquery so every step of every
  // lesson is counted without another N+1 risk.
  const [row] = await db
    .select({
      courseId: courses.id,
      courseTitle: courses.title,
      courseAccentColor: courses.accentColor,
      courseLanguage: courses.language,
      isPublic: courses.isPublic,
      totalSteps: sql<number>`(
        SELECT COUNT(*)::int FROM ${steps}
        INNER JOIN ${lessons} ON ${lessons.id} = ${steps.lessonId}
        WHERE ${lessons.courseId} = ${courses.id}
      )`,
      completedSteps: courseProgress.completedSteps,
      lastAccessedAt: courseProgress.lastAccessedAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(courses)
    .innerJoin(
      courseProgress,
      and(eq(courseProgress.courseId, courses.id), eq(courseProgress.userId, userId)),
    )
    .innerJoin(users, eq(users.id, userId))
    .where(eq(courses.slug, slug))
    .limit(1)

  if (!row) return null

  const completedSteps = Array.isArray(row.completedSteps)
    ? (row.completedSteps as string[])
    : []

  if (completedSteps.length < row.totalSteps || row.totalSteps === 0) {
    // The user exists and has progress but hasn't finished — share card
    // is not applicable.
    return null
  }

  return {
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    courseAccentColor: row.courseAccentColor,
    courseLanguage: row.courseLanguage,
    isPublic: row.isPublic,
    totalSteps: row.totalSteps,
    completedSteps,
    lastAccessedAt: row.lastAccessedAt,
    username: row.username,
    avatarUrl: row.avatarUrl,
  }
}

// GET /share/course/:slug/:userId.png — OG image for course completion.
shareRoutes.get('/share/course/:slug/:userId{.+\\.png$}', async (c) => {
  const slug = c.req.param('slug')
  const userIdRaw = c.req.param('userId').replace(/\.png$/, '')

  const completion = await loadCourseCompletion(slug, userIdRaw)
  if (!completion) return c.json({ error: 'Completion not found' }, 404)

  const font = await getFont()
  const completedDate = new Date(completion.lastAccessedAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  const element = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '1200px',
      height: '630px',
      backgroundColor: '#0F172A',
      padding: '60px',
      fontFamily: 'JetBrains Mono',
      color: '#F8FAFC',
    },
    h(
      'div',
      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
      h('span', { fontSize: '28px', color: '#6366F1', letterSpacing: '-0.05em' }, 'dojo_'),
      h(
        'span',
        {
          fontSize: '18px',
          color: completion.courseAccentColor,
          padding: '6px 16px',
          border: `2px solid ${completion.courseAccentColor}`,
          borderRadius: '4px',
        },
        'COURSE COMPLETE',
      ),
    ),
    h(
      'div',
      { display: 'flex', flexDirection: 'column', gap: '12px', flex: '1', justifyContent: 'center' },
      h('span', { fontSize: '18px', color: '#94A3B8' }, 'Completed'),
      h('span', { fontSize: '48px', color: '#F8FAFC', lineHeight: '1.2' }, completion.courseTitle),
      h(
        'span',
        { fontSize: '18px', color: completion.courseAccentColor },
        `${completion.totalSteps} step${completion.totalSteps === 1 ? '' : 's'} · ${completion.courseLanguage}`,
      ),
    ),
    h(
      'div',
      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
      h('span', { fontSize: '16px', color: '#64748B' }, `@${completion.username}`),
      h('span', { fontSize: '16px', color: '#64748B' }, completedDate),
    ),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(element as any, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'JetBrains Mono', data: font, weight: 400, style: 'normal' as const }],
  })

  const pngBuffer = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()

  return new Response(pngBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})

// GET /share/course/:slug/:userId — JSON payload for the course share page.
shareRoutes.get('/share/course/:slug/:userId', async (c) => {
  const slug = c.req.param('slug')
  const userId = c.req.param('userId')

  if (userId.endsWith('.png')) return c.notFound()

  const completion = await loadCourseCompletion(slug, userId)
  if (!completion) return c.json({ error: 'Not found' }, 404)

  return c.json({
    courseSlug: slug,
    courseTitle: completion.courseTitle,
    courseLanguage: completion.courseLanguage,
    courseAccentColor: completion.courseAccentColor,
    totalSteps: completion.totalSteps,
    completedAt: completion.lastAccessedAt.toISOString(),
    username: completion.username,
    avatarUrl: completion.avatarUrl,
  })
})
