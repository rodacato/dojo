import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { db } from '../../persistence/drizzle/client'
import { sessions, exercises, attempts, users } from '../../persistence/drizzle/schema'
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
