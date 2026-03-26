import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GitHubIcon } from '../components/GitHubIcon'
import { LogoWordmark, LogoMark } from '../components/Logo'
import { DotGridBackground } from '../components/ui/DotGridBackground'
import { ScrollFadeIn } from '../components/ui/ScrollFadeIn'
import { api } from '../lib/api'
import { API_URL } from '../lib/config'

interface GitHubStats {
  stars: number
  forks: number
  language: string
}

export function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const errorParam = searchParams.get('error')

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base text-muted font-mono text-sm">
        loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base text-primary">
      {/* Auth error banner */}
      {errorParam && (
        <div className="bg-danger/10 border-b border-danger/30 px-4 md:px-8 py-3 text-center">
          <p className="text-danger text-sm font-mono">
            {errorParam === 'session_expired'
              ? 'Your session expired. Sign in again to continue.'
              : errorParam === 'invite_required'
                ? 'The dojo is invite-only. Request access below or use an invitation link.'
                : errorParam === 'invite_invalid'
                  ? 'This invitation is invalid or has already been used.'
                  : 'GitHub login failed. Try again or check your GitHub status.'}
          </p>
        </div>
      )}

      {/* Sticky Navbar */}
      <StickyNav />

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-4 md:px-8 pt-24 pb-20">
        <DotGridBackground className="z-0" />
        <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-muted text-xs font-mono uppercase tracking-wider mb-6">
              Invite-only &middot; Open source
            </p>
            <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl text-primary leading-tight mb-2">
              <TypewriterText
                text="The dojo for developers who still have something to prove."
                onComplete={() => {}}
              />
            </h1>
            <SecondLine />
            <p className="text-secondary text-[1rem] leading-relaxed mb-8 mt-4">
              You've been delegating the thinking. The muscle is atrophying.
              Dojo is the deliberate resistance.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#access"
                className="px-5 py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
              >
                Request access
              </a>
              <a
                href="#problem"
                className="text-muted text-sm font-mono hover:text-secondary transition-colors"
              >
                Read the philosophy &darr;
              </a>
            </div>
          </div>

          {/* Terminal demo */}
          <div className="hidden md:block">
            <div className="bg-surface border border-border/60 rounded-md overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/40">
                <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                <span className="ml-2 text-muted text-xs font-mono">sensei_evaluation</span>
              </div>
              <div className="p-5 font-mono text-xs leading-relaxed space-y-3">
                <p className="text-muted">{'>'} submitting kata: cache_invalidation_review</p>
                <p className="text-muted">{'>'} sensei: [Senior DBA — PostgreSQL, 12 yrs]</p>
                <div className="border-l-2 border-accent/50 pl-3 py-1">
                  <p className="text-secondary">Your instinct to use a write-through cache was correct.</p>
                  <p className="text-secondary mt-1.5">But you missed the race condition between the invalidation</p>
                  <p className="text-secondary">and the next read. Under load, this serves stale data.</p>
                </div>
                <p className="text-warning">verdict: PASSED_WITH_NOTES</p>
                <p className="text-muted">topics: [race-conditions, cache-coherence]</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <ScrollFadeIn>
        <section id="problem" className="bg-surface/30 border-y border-border/20">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-20">
            <p className="text-muted text-xs font-mono uppercase tracking-wider mb-4">why it exists</p>
            <h2 className="font-mono text-xl md:text-2xl text-primary mb-8">
              Vibe coding is making you faster. It's also making you weaker.
            </h2>
            <div className="grid md:grid-cols-2 gap-8 text-secondary text-[1rem] leading-relaxed">
              <div className="space-y-5">
                <p>
                  There's a specific kind of developer. Years of experience. Strong opinions. Good instincts.
                </p>
                <p>
                  They reached for a tool — just this once, just to save time. Then again. Then every sprint.
                </p>
              </div>
              <div className="space-y-5">
                <p>
                  Now when the tool is gone — offline, rate-limited, wrong — there's a hesitation that wasn't
                  there before. A reach for autocomplete before the thought finishes forming.
                </p>
                <p className="text-primary font-medium">
                  Dojo exists for developers who noticed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* How It Works — 4 steps */}
      <ScrollFadeIn>
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-20">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-4">the loop</p>
          <h2 className="font-mono text-xl md:text-2xl text-primary mb-12">
            Show up. Pick a kata. Do the work. Hear the truth.
          </h2>
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-4">
            {[
              {
                n: '01',
                title: 'Enter the dojo',
                text: 'Pick your mood and available time.',
              },
              {
                n: '02',
                title: 'Choose your kata',
                text: '3 options, no skip, no reroll.',
              },
              {
                n: '03',
                title: 'Do the work',
                text: 'Timer runs, no AI, no hints.',
              },
              {
                n: '04',
                title: 'Hear the truth',
                text: 'The sensei evaluates with honest, specific feedback.',
              },
            ].map(({ n, title, text }, i) => (
              <div key={n} className="flex md:flex-col items-start md:items-center gap-4 md:gap-2 flex-1 text-center">
                <div className="flex items-center gap-4 md:flex-col md:gap-2 w-full">
                  <span className="font-mono text-3xl text-accent shrink-0">{n}</span>
                  <span className="font-mono text-primary text-sm font-bold">{title}</span>
                </div>
                <p className="text-secondary text-sm leading-relaxed md:text-center">{text}</p>
                {i < 3 && (
                  <span className="hidden md:block text-muted/40 text-xl absolute" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
          {/* Arrow connectors on desktop */}
          <div className="hidden md:flex justify-between max-w-[75%] mx-auto -mt-30 mb-20 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <span key={i} className="text-muted/30 text-2xl font-mono">&rarr;</span>
            ))}
          </div>
        </section>
      </ScrollFadeIn>

      {/* Social Proof Strip */}
      <ScrollFadeIn>
        <section className="bg-surface w-full">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
            <div className="grid grid-cols-3 gap-8 text-center mb-12">
              <div>
                <AnimatedCounter target={60} suffix="+" />
                <p className="text-muted text-xs mt-1">kata in the catalog</p>
              </div>
              <div>
                <AnimatedCounter target={10} suffix="" />
                <p className="text-muted text-xs mt-1">badges to earn</p>
              </div>
              <div>
                <AnimatedCounter target={3} suffix="" />
                <p className="text-muted text-xs mt-1">exercise types</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <blockquote className="border-l-2 border-border/40 pl-4">
                <p className="text-secondary text-sm leading-relaxed italic mb-2">
                  "I stopped reaching for Copilot on day three. Not because someone told me to — because the kata made me realize I'd forgotten how to start."
                </p>
                <cite className="text-muted text-xs font-mono not-italic">
                  @m_castillo &middot; Staff Engineer
                </cite>
              </blockquote>
              <blockquote className="border-l-2 border-border/40 pl-4">
                <p className="text-secondary text-sm leading-relaxed italic mb-2">
                  "The sensei called out a race condition I would have missed in prod. Honest feedback hits different when there's no score to protect."
                </p>
                <cite className="text-muted text-xs font-mono not-italic">
                  @jpark_dev &middot; Senior Backend
                </cite>
              </blockquote>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* Open Source */}
      <ScrollFadeIn>
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-20">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-4">open source</p>
          <h2 className="font-mono text-xl md:text-2xl text-primary mb-4">
            You can read every line of the sensei's evaluation logic.
          </h2>
          <p className="text-secondary text-[1rem] leading-relaxed mb-8">
            Dojo is fully open source. The evaluation prompts, the scoring heuristics, the kata
            selection algorithm — all of it is inspectable. No black box. If you disagree with how
            the sensei grades, you can open a pull request.
          </p>
          <GitHubStatsRow />
          <div className="flex items-center gap-6 mt-8">
            <a
              href="https://github.com/rodacato/dojo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-border/40 rounded-sm text-sm font-mono text-secondary hover:text-primary hover:border-accent/50 transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              View on GitHub &#8599;
            </a>
            <Link
              to="/open-source"
              className="text-muted text-sm font-mono hover:text-secondary transition-colors"
            >
              Architecture docs &rarr;
            </Link>
          </div>
        </section>
      </ScrollFadeIn>

      {/* Access */}
      <ScrollFadeIn>
        <section id="access" className="max-w-3xl mx-auto px-4 md:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-mono text-xl md:text-2xl text-primary mb-6">The dojo is invite-only.</h2>
              <p className="text-secondary text-[1rem] leading-relaxed mb-4">
                We're not building a platform. We're building a practice.
              </p>
              <p className="text-secondary text-[1rem] leading-relaxed">
                That means a small number of developers who are serious about this, not a large
                number who are curious about it. Invitations go to people we know or people those people know.
              </p>
            </div>
            <RequestAccessForm />
          </div>
        </section>
      </ScrollFadeIn>

      {/* Footer */}
      <footer className="border-t border-border/20 px-4 md:px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <LogoMark size={16} className="text-muted" />
              <span className="text-muted text-xs font-mono">dojo.notdefined.dev</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#problem" className="text-muted text-xs hover:text-secondary transition-colors">Philosophy</a>
              <Link to="/open-source" className="text-muted text-xs hover:text-secondary transition-colors">Open Source</Link>
              <Link to="/changelog" className="text-muted text-xs hover:text-secondary transition-colors">Changelog</Link>
              <Link to="/terms" className="text-muted text-xs hover:text-secondary transition-colors">Terms</Link>
              <Link to="/privacy" className="text-muted text-xs hover:text-secondary transition-colors">Privacy</Link>
            </div>
            <div className="flex items-center gap-2 text-muted text-xs">
              <GitHubIcon className="w-3.5 h-3.5" />
              <span className="font-mono">Built in public</span>
            </div>
          </div>
          <p className="text-center text-muted/40 text-xs italic">Not for everyone. Exactly as intended.</p>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StickyNav() {
  const [scrolled, setScrolled] = useState<boolean>(false)

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
        scrolled
          ? 'bg-base/95 backdrop-blur-md border-b border-border/30'
          : 'border-b border-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-5 max-w-5xl mx-auto">
        <LogoWordmark />
        <div className="flex items-center gap-6">
          <a
            href="#access"
            className="text-sm font-mono text-muted hover:text-secondary transition-colors hidden sm:block"
          >
            Request access
          </a>
          <a
            href={`${API_URL}/auth/github`}
            className="flex items-center gap-2 text-sm font-mono text-secondary hover:text-primary transition-colors px-3 py-1.5 border border-border/40 rounded-sm hover:border-accent/50"
          >
            <GitHubIcon className="w-4 h-4" />
            Sign in
          </a>
        </div>
      </div>
    </nav>
  )
}

function SecondLine() {
  const [show, setShow] = useState(false)
  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (prefersReduced.current) {
      setShow(true)
      return
    }
    // Approximate typewriter duration: ~45ms * text length
    const delay = 45 * 'The dojo for developers who still have something to prove.'.length + 300
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [])

  return (
    <span
      className={`block font-mono text-3xl md:text-4xl lg:text-5xl text-secondary leading-tight transition-opacity duration-500 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      To themselves.
    </span>
  )
}

function GitHubStatsRow() {
  const [stats, setStats] = useState<GitHubStats>({ stars: 0, forks: 0, language: 'TypeScript' })

  useEffect(() => {
    let cancelled = false
    fetch('https://api.github.com/repos/rodacato/dojo')
      .then((res) => {
        if (!res.ok) throw new Error('GitHub API error')
        return res.json()
      })
      .then((data: Record<string, unknown>) => {
        if (!cancelled) {
          setStats({
            stars: (data.stargazers_count as number) ?? 0,
            forks: (data.forks_count as number) ?? 0,
            language: (data.language as string) ?? 'TypeScript',
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats({ stars: 12, forks: 3, language: 'TypeScript' })
        }
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex items-center gap-8 text-sm font-mono">
      <span className="text-secondary">
        <span className="text-muted">stars</span> {stats.stars}
      </span>
      <span className="text-secondary">
        <span className="text-muted">forks</span> {stats.forks}
      </span>
      <span className="text-secondary">
        <span className="text-muted">language</span> {stats.language}
      </span>
    </div>
  )
}

function RequestAccessForm() {
  const [githubHandle, setGithubHandle] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (submitted) {
    return (
      <div className="border border-accent/30 rounded-md p-6 bg-surface">
        <p className="font-mono text-accent text-sm mb-2">Received.</p>
        <p className="text-secondary text-sm leading-relaxed">No newsletter. No notifications. We'll reach out directly if we have space.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!githubHandle.trim() || submitting) return
    setSubmitting(true)
    try {
      await api.requestAccess(githubHandle.trim(), reason.trim() || undefined)
    } catch {
      // Show "Received" even if the email fails — graceful degradation
    }
    setSubmitted(true)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border/60 rounded-md p-6 space-y-4"
    >
      <div>
        <label className="block text-sm text-secondary mb-1.5 font-mono">GitHub handle</label>
        <input
          type="text"
          value={githubHandle}
          onChange={(e) => setGithubHandle(e.target.value)}
          placeholder="@yourhandle"
          className="w-full bg-base border border-border rounded-sm px-3 py-2 text-primary text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-secondary mb-1.5 font-mono">
          Why you're here <span className="text-muted">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional. But the honest answers are more interesting."
          rows={3}
          className="w-full bg-base border border-border rounded-sm px-3 py-2 text-primary text-sm font-sans placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={!githubHandle.trim() || submitting}
        className="w-full py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 disabled:opacity-40 transition-colors"
      >
        {submitting ? 'Sending...' : 'Request access'}
      </button>
      <p className="text-muted text-xs text-center">No newsletter. No notifications. We'll reach out directly.</p>
    </form>
  )
}

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (prefersReduced.current) {
      setDisplayed(text)
      setDone(true)
      onComplete?.()
      return
    }
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
        onComplete?.()
      }
    }, 45)
    return () => clearInterval(interval)
  }, [text, onComplete])

  return (
    <>
      {displayed}
      {!done && <span className="text-accent animate-pulse">|</span>}
    </>
  )
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const duration = 1200
        const start = performance.now()
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1)
          setValue(Math.round(progress * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="font-mono text-3xl text-primary">
      {value}{suffix}
    </div>
  )
}
