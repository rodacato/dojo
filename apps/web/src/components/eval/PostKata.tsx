import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type RevealedAnswer } from '../../lib/api'
import { parseInsight } from '../../lib/parse-insight'
import { Button } from '../ui/Button'
import { CodeLine } from '../ui/CodeLine'

const LABEL = 'paper-eyebrow'
const POINT_RESPONSE = /^Line (\d+): [^\n]*\n\n([\s\S]+)$/

export function parsePointResponse(response: string | undefined): { line: number; why: string } | null {
  const match = response ? POINT_RESPONSE.exec(response) : null
  if (!match) return null
  return { line: Number(match[1]), why: match[2]!.trim() }
}

function CodeExcerpt({ code, line }: Readonly<{ code: string; line: number }>) {
  const lines = code.replace(/\n+$/, '').split('\n')
  const first = Math.max(1, line - 1)
  const last = Math.min(lines.length, line + 1)
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      {lines.slice(first - 1, last).map((text, i) => (
        <CodeLine key={first + i} number={first + i} code={text} selected={first + i === line} />
      ))}
    </div>
  )
}

export function YourPointAnswer({ code, line, why }: Readonly<{ code: string; line: number; why: string }>) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={LABEL}>You pointed at line {line} · your why</h2>
      <CodeExcerpt code={code} line={line} />
      <p className="text-secondary text-sm italic leading-relaxed whitespace-pre-wrap">{why}</p>
    </section>
  )
}

export function TheAnswer({ code, answer }: Readonly<{ code: string; answer: RevealedAnswer }>) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className={LABEL}>The answer · line {answer.line}</h2>
      <CodeExcerpt code={code} line={answer.line} />
      <p className="text-primary font-semibold">{answer.title}</p>
      <p className="text-secondary leading-relaxed">{answer.why}</p>
    </section>
  )
}

export function KataNotes({ analysis }: Readonly<{ analysis: string }>) {
  const { strengths, improvements, approachNote } = parseInsight(analysis)
  if (!strengths && !improvements && !approachNote) return null
  return (
    <section className="flex flex-col gap-2.5">
      {strengths && <NoteList title="Strengths" items={strengths} />}
      {improvements && <NoteList title="Improvements" items={improvements} />}
      {approachNote && (
        <>
          <h2 className={LABEL}>Alternative approach</h2>
          <p className="text-secondary text-sm italic leading-relaxed">{approachNote}</p>
        </>
      )}
    </section>
  )
}

function NoteList({ title, items }: Readonly<{ title: string; items: string[] }>) {
  return (
    <>
      <h2 className={LABEL}>{title}</h2>
      <ul className="list-disc list-outside ml-4 text-secondary text-sm leading-relaxed space-y-1">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  )
}

// D54 and D60: Done is the main way out; one more kata and sharing are there, not pushed.
export function PostKataActions({ sessionId }: Readonly<{ sessionId: string }>) {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function oneMore() {
    setStarting(true)
    try {
      const { sessionId: next } = await api.startDailyKata()
      navigate(`/katas/${next}`)
    } catch {
      navigate('/katas')
    }
  }

  async function share() {
    const url = `${globalThis.location.origin}/share/${sessionId}`
    if (navigator.share) {
      await navigator.share({ url }).catch(() => {})
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable: the share page is still reachable from history.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/dashboard', { replace: true })}>
        Done
      </Button>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" size="lg" onClick={oneMore} loading={starting} disabled={starting}>
          One more kata
        </Button>
        <Button variant="ghost" size="lg" onClick={share}>
          {copied ? 'Link copied!' : 'Share'}
        </Button>
      </div>
    </div>
  )
}
