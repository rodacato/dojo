import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { db } from '../../persistence/drizzle/client'
import {
  sessions,
  katas,
  attempts,
  users,
} from '../../persistence/drizzle/schema'
import type { AppEnv } from '../app-env'

export const shareRoutes = new Hono<AppEnv>()

// Values copied from the [data-theme='sumi'] block in apps/web/src/styles/main.css
const SUMI = {
  page: '#0A0908',
  surface: '#13110F',
  border: '#2A2520',
  primary: '#F2EDE3',
  secondary: '#A39A8C',
  muted: '#5C544A',
  accent: '#B73A2F',
  success: '#7D9B6A',
  dangerText: '#B6675D',
  warning: '#D4A547',
  typeCode: '#6B5E51',
  typeChat: '#5A4275',
  typeWhiteboard: '#3F6B68',
}

// Open Gate geometry from apps/web/src/brand/logo.json
const OPEN_GATE_PATH = 'M15 25Q50 32 85 25M25 45H75M30 30V82M70 30V82'

function openGateMark(size: number, color: string) {
  return {
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 100 100',
      fill: 'none',
      children: {
        type: 'path',
        props: { d: OPEN_GATE_PATH, stroke: color, strokeWidth: 8, fill: 'none' },
      },
    },
  }
}

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

shareRoutes.get('/share/:sessionId{[^/]+\\.png$}', async (c) => {
  const sessionId = c.req.param('sessionId').replace(/\.png$/, '')

  const [row] = await db
    .select({
      sessionId: sessions.id,
      status: sessions.status,
      startedAt: sessions.startedAt,
      completedAt: sessions.completedAt,
      kataTitle: katas.title,
      kataType: katas.type,
      difficulty: katas.difficulty,
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
    .innerJoin(katas, eq(sessions.kataId, katas.id))
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  // Same gate as the JSON endpoint: the card is cached as immutable, so an
  // unfinished session must never be rendered with the needs_work fallback.
  if (!row || (row.status !== 'completed' && row.status !== 'failed')) {
    return c.json({ error: 'Session not found' }, 404)
  }

  const verdict = (row.verdict ?? 'needs_work').toLowerCase()
  const verdictLabel = verdict.replaceAll('_', ' ').toUpperCase()
  let verdictColor = SUMI.dangerText
  if (verdict === 'passed') verdictColor = SUMI.success
  else if (verdict === 'passed_with_notes') verdictColor = SUMI.warning

  const exType = row.kataType.toLowerCase()
  let typeColor = SUMI.typeWhiteboard
  if (exType === 'code') typeColor = SUMI.typeCode
  else if (exType === 'chat') typeColor = SUMI.typeChat

  const diff = row.difficulty.toLowerCase()
  let diffColor = SUMI.dangerText
  if (diff === 'easy') diffColor = SUMI.success
  else if (diff === 'medium') diffColor = SUMI.warning

  const pullQuote = extractPullQuote(row.analysis ?? '')
  const completionTime = row.completedAt
    ? Math.round((new Date(row.completedAt).getTime() - new Date(row.startedAt).getTime()) / 60000)
    : null

  const font = await getFont()

  const middleChildren = [
    h('div', { display: 'flex', gap: '12px', alignItems: 'center' },
      h('span', { fontSize: '14px', color: typeColor, padding: '3px 10px', backgroundColor: SUMI.surface, borderRadius: '3px' }, row.kataType.toUpperCase()),
      h('span', { fontSize: '14px', color: diffColor }, row.difficulty.toUpperCase()),
    ),
    h('span', { fontSize: '32px', color: SUMI.primary, lineHeight: '1.3' }, row.kataTitle),
  ]

  if (pullQuote) {
    middleChildren.push(
      h('div', { display: 'flex', borderLeft: `3px solid ${SUMI.border}`, paddingLeft: '16px', marginTop: '8px' },
        h('span', { fontSize: '16px', color: SUMI.secondary, fontStyle: 'italic', lineHeight: '1.5' }, `"${pullQuote}"`),
      ),
    )
  }

  const bottomChildren = [
    h('span', { fontSize: '16px', color: SUMI.muted }, `@${row.username}`),
  ]
  if (completionTime) {
    bottomChildren.push(h('span', { fontSize: '16px', color: SUMI.muted }, `${completionTime}min`))
  }

  const element = h('div', {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '1200px',
    height: '630px',
    backgroundColor: SUMI.page,
    padding: '60px',
    fontFamily: 'JetBrains Mono',
    color: SUMI.primary,
  },
    // Top
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
      h('div', { display: 'flex', alignItems: 'center', gap: '14px' },
        openGateMark(40, SUMI.accent),
        h('span', { fontSize: '28px', color: SUMI.primary, letterSpacing: '-0.05em' }, 'dojo_'),
      ),
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
      kataTitle: katas.title,
      kataType: katas.type,
      difficulty: katas.difficulty,
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
    .innerJoin(katas, eq(sessions.kataId, katas.id))
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
    kataTitle: row.kataTitle,
    kataType: row.kataType,
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
