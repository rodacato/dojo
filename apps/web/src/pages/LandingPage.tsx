import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../context/AuthContext'
import { GitHubIcon } from '../components/GitHubIcon'
import { LogoWordmark, LogoMark } from '../components/Logo'
import { DotGridBackground } from '../components/ui/DotGridBackground'
import { Button, buttonClasses } from '../components/ui/Button'
import { api } from '../lib/api'
import { API_URL } from '../lib/config'

gsap.registerPlugin(ScrollTrigger)

interface GitHubStats {
  stars: number
  forks: number
  language: string
}

const HERO_LINE_1 = 'The dojo for developers who still have something to prove.'

export function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const errorParam = searchParams.get('error')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  useGSAP(
    () => {
      const reveals = gsap.utils.toArray<HTMLElement>('[data-anim="reveal"]')
      if (reveals.length === 0) return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(reveals, { autoAlpha: 0, y: 40, scale: 0.97 })
        ScrollTrigger.batch(reveals, {
          start: 'top 85%',
          once: true,
          onEnter: (els) =>
            gsap.to(els, {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'power3.out',
              stagger: 0.18,
              overwrite: true,
            }),
        })
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(reveals, { autoAlpha: 1, y: 0, scale: 1 })
      })
    },
    { scope: rootRef, dependencies: [loading] },
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-page text-muted font-mono text-sm">
        <span className="text-accent animate-cursor" aria-hidden>_</span>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="min-h-screen bg-page text-primary">
      {errorParam && <AuthErrorBanner errorParam={errorParam} />}
      <StickyNav />
      <Hero />
      <WhyItExists />
      <ExecutionFlow />
      <OpenSourceStrip />
      <AccessSection />
      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

function AuthErrorBanner({ errorParam }: Readonly<{ errorParam: string }>) {
  const message =
    errorParam === 'session_expired'
      ? 'Your session expired. Sign in again to continue.'
      : errorParam === 'invite_required'
        ? 'The dojo is invite-only. Request access below or use an invitation link.'
        : errorParam === 'invite_invalid'
          ? 'This invitation is invalid or has already been used.'
          : 'GitHub login failed. Try again or check your GitHub status.'
  return (
    <div className="bg-danger/10 border-b border-danger/30 px-4 md:px-8 py-3 text-center">
      <p className="text-danger text-sm font-mono">{message}</p>
    </div>
  )
}

function StickyNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-page/95 backdrop-blur-md border-b border-border/30' : 'border-b border-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-4 max-w-5xl mx-auto">
        <LogoWordmark />
        <div className="hidden md:flex items-center gap-7">
          <Link to="/open-source" className="text-sm font-mono text-secondary hover:text-primary transition-colors">
            Open Source
          </Link>
          <Link to="/changelog" className="text-sm font-mono text-secondary hover:text-primary transition-colors">
            Changelog
          </Link>
          <a href="#problem" className="text-sm font-mono text-secondary hover:text-primary transition-colors">
            Why
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a href={`${API_URL}/auth/github`} className={buttonClasses({ variant: 'subtle', size: 'sm' })}>
            Log in
          </a>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const line1Ref = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const line2Ref = useRef<HTMLSpanElement>(null)
  const paragraphRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Brushstroke removed for now — the placeholder SVG path was a wavy line
  // that read as distracting doodle rather than a confident sumi-e stroke.
  // Reintroduce in the sumi-e migration sprint once a real CC0 ink stroke
  // path is sourced. See docs/DESIGN.md §Brand motifs.

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set([line2Ref.current, paragraphRef.current, ctaRef.current], { autoAlpha: 0, y: 16 })
        // Terminal is NOT hidden during fade — only slides up. Hiding it with
        // autoAlpha caused the visible-chrome / empty-content "dead time" gap
        // because the inner session's autoAlpha:1 was masked by the parent's
        // autoAlpha:0. Slide-only keeps session 0 visible from t=0.
        gsap.set(terminalRef.current, { y: 24 })
        if (line1Ref.current) line1Ref.current.textContent = ''

        const obj = { n: 0 }
        // delay 0.15s — small suspense beat before the typewriter starts.
        const tl = gsap.timeline({ delay: 0.15 })

        tl.to(terminalRef.current, { y: 0, duration: 0.9, ease: 'expo.out' }, 0)
          .to(
            obj,
            {
              n: HERO_LINE_1.length,
              duration: HERO_LINE_1.length * 0.035,
              ease: 'none',
              onUpdate: () => {
                if (line1Ref.current) {
                  line1Ref.current.textContent = HERO_LINE_1.slice(0, Math.round(obj.n))
                }
              },
            },
            0.1,
          )
          .to(cursorRef.current, { autoAlpha: 0, duration: 0.25 }, '>0.15')
          .to(line2Ref.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '<')
          .to(
            [paragraphRef.current, ctaRef.current],
            { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12 },
            '-=0.15',
          )
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        if (line1Ref.current) line1Ref.current.textContent = HERO_LINE_1
        gsap.set(cursorRef.current, { autoAlpha: 0 })
        gsap.set([line2Ref.current, paragraphRef.current, ctaRef.current], {
          autoAlpha: 1,
          y: 0,
        })
        gsap.set(terminalRef.current, { y: 0 })
      })
    },
    { scope: heroRef },
  )

  return (
    <section ref={heroRef} className="relative max-w-5xl mx-auto px-4 md:px-8 pt-20 pb-24">
      <DotGridBackground className="z-0" />
      <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl text-primary leading-tight mb-2 relative">
            {/* Ghost text reserves the final layout — keeps the container from
                growing as the typewriter types. opacity-0 stays in layout AND
                is announced by screen readers (vs. `invisible` which would not). */}
            <span className="opacity-0 select-none">{HERO_LINE_1}</span>
            {/* Visual typewriter overlays the ghost. aria-hidden so screen
                readers only announce the ghost (the full headline). */}
            <span aria-hidden className="absolute inset-0">
              <span ref={line1Ref} />
              <span ref={cursorRef} className="text-accent animate-cursor">
                _
              </span>
            </span>
          </h1>
          <span
            ref={line2Ref}
            className="block font-mono text-3xl md:text-4xl lg:text-5xl text-secondary leading-tight"
          >
            To themselves.
          </span>
          <p
            ref={paragraphRef}
            className="text-secondary text-base leading-relaxed mt-6 mb-8 max-w-md"
          >
            You've been delegating the thinking. The muscle is atrophying. Dojo is the
            deliberate resistance.
          </p>
          <a
            ref={ctaRef}
            href="#access"
            className={buttonClasses({ variant: 'primary', size: 'lg' })}
          >
            Enter dojo →
          </a>
        </div>
        <div ref={terminalRef}>
          <TerminalDemo />
        </div>
      </div>
    </section>
  )
}

interface TerminalSession {
  id: string
  command: string
  args: string
  lines: Array<{ tone: 'muted' | 'secondary'; content: React.ReactNode }>
  prompt: string
}

const TERMINAL_SESSIONS: TerminalSession[] = [
  {
    id: 'session_a3f8c2d',
    command: 'dojo kata start',
    args: '--time 30 --mood focused',
    lines: [
      { tone: 'muted', content: <>fetching kata catalog... <span className="text-success">[OK]</span></> },
      { tone: 'muted', content: <>filtering by your weak areas... <span className="text-success">[OK]</span></> },
      { tone: 'muted', content: <>3 candidates loaded:</> },
      { tone: 'secondary', content: <><span className="text-warning">*</span> CODE        Refactor a 200-line useEffect      28 min</> },
      { tone: 'secondary', content: <><span className="text-warning">*</span> CHAT        The angry CTO                      25 min</> },
      { tone: 'secondary', content: <><span className="text-warning">*</span> WHITEBOARD  Multi-tenant rate limiting         30 min</> },
    ],
    prompt: 'choose one. no skip. no reroll.',
  },
  {
    id: 'session_7d2e4b1',
    command: 'dojo sensei eval',
    args: '--kata 0421 --strict',
    lines: [
      { tone: 'muted', content: <>analyzing submission... <span className="text-success">[OK]</span></> },
      { tone: 'muted', content: <>cross-checking against 12 reference impls...</> },
      { tone: 'secondary', content: <><span className="text-accent">verdict</span> = PASSED_WITH_NOTES</> },
      { tone: 'secondary', content: <><span className="text-accent">notes</span>  = "O(n^2) where O(n log n) was on the table"</> },
      { tone: 'secondary', content: <><span className="text-accent">notes</span>  = "naming: `data` and `result` say nothing"</> },
      { tone: 'muted', content: <>logged to history. belt unchanged.</> },
    ],
    prompt: 'open the analysis or close the session.',
  },
  {
    id: 'session_c91a5e8',
    command: 'dojo belt status',
    args: '',
    lines: [
      { tone: 'muted', content: <>computing from session history...</> },
      { tone: 'secondary', content: <><span className="text-accent">belt</span>     = yellow</> },
      { tone: 'secondary', content: <><span className="text-accent">katas</span>    = 23 / 40</> },
      { tone: 'secondary', content: <><span className="text-accent">clusters</span> = 3 / 4</> },
      { tone: 'secondary', content: <><span className="text-accent">active</span>   = 8 / 10 days (last 30)</> },
      { tone: 'muted', content: <>green belt requires: 17 katas, 1 cluster, 2 active days.</> },
    ],
    prompt: 'no progress bar. the dojo doesn\'t babysit.',
  },
]

function TerminalDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const prevIdxRef = useRef<number | null>(null)

  // Rotate every 4s after first display. setInterval so each tick is independent
  // of GSAP timeline — no chance of timeline drift causing dead intervals.
  useEffect(() => {
    const reduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const interval = setInterval(() => {
      setCurrentIdx((i) => (i + 1) % TERMINAL_SESSIONS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // GSAP only animates the transition. State drives which session is current.
  useGSAP(
    () => {
      const sessions = gsap.utils.toArray<HTMLElement>('.tdemo-session')
      if (sessions.length === 0) return

      const reduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prevIdx = prevIdxRef.current

      if (prevIdx === null) {
        // Initial mount — set state without animation
        sessions.forEach((el, i) => {
          gsap.set(el, { autoAlpha: i === currentIdx ? 1 : 0, x: 0 })
        })
      } else if (prevIdx !== currentIdx) {
        if (reduced) {
          gsap.set(sessions[prevIdx]!, { autoAlpha: 0 })
          gsap.set(sessions[currentIdx]!, { autoAlpha: 1, x: 0 })
        } else {
          const tl = gsap.timeline()
          tl.to(sessions[prevIdx]!, {
            autoAlpha: 0,
            x: -30,
            duration: 0.5,
            ease: 'power2.in',
          }).fromTo(
            sessions[currentIdx]!,
            { autoAlpha: 0, x: 30 },
            { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power2.out' },
            '<0.15',
          )
        }
      }

      prevIdxRef.current = currentIdx
    },
    { scope: containerRef, dependencies: [currentIdx] },
  )

  return (
    <div ref={containerRef} className="hidden md:block">
      <div className="bg-surface border border-border/60 rounded-md overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/40">
          <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
          <span className="ml-2 text-muted text-xs font-mono">session_</span>
        </div>
        <div className="relative">
          {TERMINAL_SESSIONS.map((s, i) => (
            <div
              key={s.id}
              className={`tdemo-session p-5 font-mono text-xs leading-relaxed space-y-2 ${
                i > 0 ? 'absolute inset-0' : ''
              }`}
              // Initial CSS state matches first useGSAP run — prevents FOUC
              // where all 3 sessions render visible on first paint before
              // GSAP's gsap.set fires.
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <p className="text-secondary">
                <span className="text-muted">$</span> {s.command}{' '}
                {s.args && <span className="text-accent">{s.args}</span>}
              </p>
              {s.lines.map((line, i) => (
                <p
                  key={i}
                  className={line.tone === 'muted' ? 'text-muted' : 'text-secondary'}
                >
                  {line.content}
                </p>
              ))}
              <p className="text-muted pt-2">
                <span className="text-secondary">{'>'}</span> {s.prompt}
                <span className="text-accent animate-cursor ml-0.5">_</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WhyItExists() {
  const reasons = [
    {
      n: '01',
      tag: 'RIGOR',
      title: 'No handholding.',
      body: 'No AI inside the kata. No autocomplete. No skip. Just you, the problem, and a timer that does not pause.',
    },
    {
      n: '02',
      tag: 'SIGNAL',
      title: 'Honest feedback.',
      body: 'The sensei is an LLM playing a senior dev with 12 years in the domain. Brutally specific critique — what you missed, what you got right, what to read next.',
    },
    {
      n: '03',
      tag: 'FLOW',
      title: 'Deliberate practice.',
      body: 'A minimalist interface designed to disappear. Pick mood. Pick time. Get 3 kata. Choose one. Work. The dojo does not beg you to come back.',
    },
  ]
  return (
    <section
      id="problem"
      data-anim="reveal"
      className="bg-surface/30 border-y border-border/20"
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-20">
        <div className="flex items-end justify-between mb-12 gap-4">
          <h2 className="font-mono text-xl md:text-2xl text-primary">Why it exists</h2>
          <p className="text-muted text-xs font-mono uppercase tracking-wider">[ SYS_RATIONALE ]</p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {reasons.map(({ n, tag, title, body }) => (
            <div key={n}>
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">
                {n} / {tag}
              </p>
              <h3 className="font-mono text-lg text-primary mb-3">{title}</h3>
              <p className="text-secondary text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ExecutionFlow() {
  const steps = [
    {
      n: '01',
      title: 'Enter the dojo',
      body: 'Pick your mood. Pick your time. The dojo serves you 3 kata.',
    },
    {
      n: '02',
      title: 'Choose your kata',
      body: '3 options. No skip. No reroll. These are your kata.',
    },
    {
      n: '03',
      title: 'Do the work',
      body: 'Timer running. No AI inside. The sensei is watching. Write your answer.',
    },
    {
      n: '04',
      title: 'Hear the truth',
      body: 'Submit. The sensei evaluates with honest, specific feedback. Verdict: passed, with notes, or needs work.',
    },
  ]
  return (
    <section data-anim="reveal" className="max-w-5xl mx-auto px-4 md:px-8 py-20">
      <h2 className="font-mono text-xl md:text-2xl text-primary mb-12">Execution flow</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map(({ n, title, body }) => (
          <div key={n} className="bg-surface border border-border/60 rounded-md p-5">
            <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">
              STEP_{n}
            </p>
            <h3 className="font-mono text-sm text-primary mb-2 font-bold">{title}</h3>
            <p className="text-secondary text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function OpenSourceStrip() {
  const [copied, setCopied] = useState(false)
  function copyClone() {
    void navigator.clipboard.writeText('git clone https://github.com/rodacato/dojo.git')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <section data-anim="reveal" className="bg-surface/40 border-y border-border/20 py-16">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-6">
            The core engine is open source
          </p>
          <div className="flex items-center justify-center gap-2 max-w-xl mx-auto">
            <code className="flex-1 bg-page border border-border/60 rounded-sm px-4 py-3 font-mono text-sm text-secondary text-left overflow-hidden whitespace-nowrap">
              git clone https://github.com/rodacato/dojo.git
            </code>
            <button
              type="button"
              onClick={copyClone}
              aria-label={copied ? 'Copied' : 'Copy clone command'}
              className="shrink-0 w-11 h-11 flex items-center justify-center border border-border/60 rounded-sm text-muted hover:text-primary hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:ring-accent"
            >
              {copied ? <CheckIcon className="w-4 h-4 text-success" /> : <ClipboardIcon className="w-4 h-4" />}
            </button>
          </div>
          <GitHubStatsRow />
          <div className="flex items-center justify-center gap-6 mt-6">
            <Link to="/open-source" className="text-muted text-xs font-mono hover:text-secondary transition-colors">
              architecture →
            </Link>
            <a
              href="https://github.com/rodacato/dojo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted text-xs font-mono hover:text-secondary transition-colors flex items-center gap-1.5"
            >
              <GitHubIcon className="w-3.5 h-3.5" />
              github
            </a>
          </div>
        </div>
    </section>
  )
}

function GitHubStatsRow() {
  const [stats, setStats] = useState<GitHubStats>({ stars: 0, forks: 0, language: 'TypeScript' })
  useEffect(() => {
    let cancelled = false
    api
      .getRepoStats()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        // Endpoint already returns a safe fallback on its own failure path —
        // if even that round-trip fails, keep the initial zeroed state.
      })
    return () => {
      cancelled = true
    }
  }, [])
  return (
    <div className="flex items-center justify-center gap-8 text-xs font-mono mt-6">
      <span className="text-secondary">
        <span className="text-muted">stars</span> {stats.stars}
      </span>
      <span className="text-secondary">
        <span className="text-muted">forks</span> {stats.forks}
      </span>
      <span className="text-secondary">
        <span className="text-muted">lang</span> {stats.language}
      </span>
    </div>
  )
}

function AccessSection() {
  return (
    <section
      id="access"
      data-anim="reveal"
      className="max-w-3xl mx-auto px-4 md:px-8 py-20"
    >
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="font-mono text-xl md:text-2xl text-primary mb-6">
            The dojo is invite-only.
          </h2>
          <p className="text-secondary text-base leading-relaxed mb-4">
            We are not building a platform. We are building a practice.
          </p>
          <p className="text-secondary text-base leading-relaxed">
            Invitations go to people we know or people those people know. Tell us why you want in.
          </p>
        </div>
        <RequestAccessForm />
      </div>
    </section>
  )
}

function RequestAccessForm() {
  const [githubHandle, setGithubHandle] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (submitted) {
    return (
      <div className="bg-surface border border-accent/30 rounded-md p-6">
        <p className="font-mono text-accent text-xs uppercase tracking-wider mb-2">[ Received ]</p>
        <p className="text-secondary text-sm leading-relaxed">
          No newsletter. No notifications. We will reach out directly if we have space.
        </p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!githubHandle.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await api.requestAccess(githubHandle.trim(), reason.trim() || undefined)
      setSubmitted(true)
    } catch {
      setError("Didn't go through. Try again, or ping @rodacato on github.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border/60 rounded-md p-6 space-y-5">
      <div>
        <p className="text-muted text-xs font-mono uppercase tracking-wider">
          Request early access
        </p>
        <p className="text-secondary text-xs font-mono mt-1">
          // invites are issued based on intent.
        </p>
      </div>
      <div>
        <label htmlFor="github-handle" className="block text-xs text-muted mb-2 font-mono uppercase tracking-wider">
          GITHUB_HANDLE
        </label>
        <input
          id="github-handle"
          type="text"
          value={githubHandle}
          onChange={(e) => setGithubHandle(e.target.value)}
          placeholder="@yourhandle"
          className="w-full bg-page border border-border rounded-sm px-3 py-2.5 text-primary text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label htmlFor="intent-statement" className="block text-xs text-muted mb-2 font-mono uppercase tracking-wider">
          INTENT_STATEMENT
          {' '}
          <span className="ml-1 normal-case text-muted/60">(optional, max 500)</span>
        </label>
        <textarea
          id="intent-statement"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why do you want to enter the dojo?"
          rows={4}
          maxLength={500}
          className="w-full bg-page border border-border rounded-sm px-3 py-2.5 text-primary text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={submitting}
        disabled={!githubHandle.trim() || submitting}
        className="w-full"
      >
        {submitting ? 'Sending' : 'Submit_request'}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-xs font-mono leading-relaxed">
          {error}
        </p>
      )}
    </form>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/20 px-4 md:px-8 py-10 mt-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <LogoMark size={16} className="text-muted" />
            <span className="text-muted text-xs font-mono">dojo.notdefined.dev</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/open-source" className="text-muted text-xs hover:text-secondary transition-colors">
              Open Source
            </Link>
            <Link to="/changelog" className="text-muted text-xs hover:text-secondary transition-colors">
              Changelog
            </Link>
            <Link to="/terms" className="text-muted text-xs hover:text-secondary transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-muted text-xs hover:text-secondary transition-colors">
              Privacy
            </Link>
          </div>
          <a
            href="https://github.com/rodacato/dojo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted text-xs hover:text-secondary transition-colors"
          >
            <GitHubIcon className="w-3.5 h-3.5" />
            <span className="font-mono">github</span>
          </a>
        </div>
        <p className="text-center text-muted/40 text-xs italic">Not for everyone. Exactly as intended.</p>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ClipboardIcon({ className = 'w-4 h-4' }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <rect x="8" y="4" width="12" height="16" rx="2" />
      <path d="M16 4v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4" />
      <path strokeLinecap="round" d="M5 8v11a2 2 0 0 0 2 2h7" />
    </svg>
  )
}

function CheckIcon({ className = 'w-4 h-4' }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
