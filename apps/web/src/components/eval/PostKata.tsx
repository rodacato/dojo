import { useId, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Verdict } from '@dojo/shared'
import { api, type RevealedAnswer, type SessionWithKata } from '../../lib/api'
import { parseInsight } from '../../lib/parse-insight'
import { VERDICT_LABELS, VERDICT_STROKE, VERDICT_TEXT } from '../../lib/verdict'
import { Button } from '../ui/Button'
import { CodeLine } from '../ui/CodeLine'
import { Disclosure } from '../ui/Disclosure'
import { KataBody } from '../ui/KataBody'

const LABEL = 'paper-eyebrow'
const SECTION = 'mt-7 md:mt-8 pt-6 md:pt-7 border-t border-border'
const POINT_RESPONSE = /^Line (\d+): [^\n]*\n\n([\s\S]+)$/

export function parsePointResponse(response: string | undefined): { line: number; why: string } | null {
  const match = response ? POINT_RESPONSE.exec(response) : null
  if (!match) return null
  return { line: Number(match[1]), why: match[2]!.trim() }
}

function codeLines(code: string) {
  return code.replace(/\n+$/, '').split('\n')
}

function CodeExcerpt({ code, line }: Readonly<{ code: string; line: number }>) {
  const lines = codeLines(code)
  const first = Math.max(1, line - 1)
  const last = Math.min(lines.length, line + 1)
  return (
    <div className="rounded-sm bg-surface overflow-hidden">
      {lines.slice(first - 1, last).map((text, i) => (
        <CodeLine key={first + i} number={first + i} code={text} selected={first + i === line} />
      ))}
    </div>
  )
}

export function ReviewVerdict({ verdict, children }: Readonly<{ verdict: Verdict; children?: ReactNode }>) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={`border-l-3 border-current py-1 pl-4.5 md:pl-6 ${VERDICT_STROKE[verdict]}`}>
      <p className={LABEL}>Sensei review</p>
      <h2
        id={headingId}
        className={`font-mono text-2xl max-[359px]:text-xl font-medium tracking-tight leading-tight mt-3 mb-4 ${VERDICT_TEXT[verdict]}`}
      >
        {VERDICT_LABELS[verdict]}
      </h2>
      {children && <div className="text-primary text-base leading-relaxed space-y-3 whitespace-pre-wrap">{children}</div>}
    </section>
  )
}

/** The answer stays open while the sensei works; on a phone the final result takes the screen first. */
export function YourPointAnswer({
  code,
  line,
  why,
  final,
}: Readonly<{ code: string; line: number; why: string; final: boolean }>) {
  const wide = globalThis.matchMedia?.('(min-width: 768px)').matches ?? false
  return (
    <Disclosure summary="Your answer" defaultOpen={!final || wide}>
      <h2 className={`${LABEL} mt-2 mb-4`}>You pointed at line {line} · your why</h2>
      <CodeExcerpt code={code} line={line} />
      <blockquote className="mt-4 text-secondary text-base leading-relaxed whitespace-pre-wrap wrap-anywhere">{why}</blockquote>
    </Disclosure>
  )
}

export function TheAnswer({ code, answer }: Readonly<{ code: string; answer: RevealedAnswer }>) {
  return (
    <section className={SECTION}>
      <h2 className={LABEL}>The answer · line {answer.line}</h2>
      <h3 className="text-primary text-xl font-semibold tracking-tight mt-3 mb-5">{answer.title}</h3>
      <CodeExcerpt code={code} line={answer.line} />
      <p className="mt-5 text-secondary text-base leading-relaxed">{answer.why}</p>
    </section>
  )
}

export function KataNotes({ analysis, topics = [] }: Readonly<{ analysis: string; topics?: string[] }>) {
  const { strengths, improvements, approachNote } = parseInsight(analysis)
  if (!strengths && !improvements && !approachNote && topics.length === 0) return null
  return (
    <section className={`${SECTION} flex flex-col gap-3`}>
      {strengths && <NoteList title="Strengths" items={strengths} />}
      {improvements && <NoteList title="Improvements" items={improvements} />}
      {approachNote && (
        <>
          <h2 className={LABEL}>Alternative approach</h2>
          <p className="text-secondary text-base italic leading-relaxed">{approachNote}</p>
        </>
      )}
      {topics.length > 0 && (
        <>
          <h2 className={LABEL}>Topics to review</h2>
          <p className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <span key={topic} className="font-mono text-xs text-secondary px-2 py-1 border border-border rounded-sm">
                {topic}
              </span>
            ))}
          </p>
        </>
      )}
    </section>
  )
}

function NoteList({ title, items }: Readonly<{ title: string; items: string[] }>) {
  return (
    <>
      <h2 className={LABEL}>{title}</h2>
      <ul className="list-disc list-outside ml-5 text-secondary text-base leading-relaxed space-y-2 mb-3">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  )
}

/** What a result reopened later needs in order to read without going back to the kata. */
export function KataContext({ session, pointed }: Readonly<{ session: SessionWithKata; pointed: boolean }>) {
  const code = pointed ? session.kata.starterCode : null
  const response = session.finalAttempt?.userResponse
  if (!session.body && !code && (pointed || !response)) return null
  return (
    <div className="mt-6">
      {(session.body || code) && (
        <Disclosure summary="Original kata">
          {session.body && <KataBody body={session.body} />}
          {code && (
            <div className="border-y border-border">
              {codeLines(code).map((text, i) => (
                <CodeLine key={i} number={i + 1} code={text} selected={false} />
              ))}
            </div>
          )}
        </Disclosure>
      )}
      {!pointed && response && (
        <Disclosure summary="Your response">
          <pre className="text-secondary text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">{response}</pre>
        </Disclosure>
      )}
    </div>
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
    <nav aria-label="After this kata" className="mt-6 pt-6 border-t border-border flex flex-col gap-3">
      <Button variant="primary" size="xl" className="w-full" onClick={() => navigate('/dashboard', { replace: true })}>
        Done
      </Button>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" size="xl" className="!px-2" onClick={oneMore} loading={starting} disabled={starting}>
          One more kata
        </Button>
        <Button variant="ghost" size="xl" className="!px-2" onClick={share}>
          {copied ? 'Link copied!' : 'Share'}
        </Button>
      </div>
    </nav>
  )
}
