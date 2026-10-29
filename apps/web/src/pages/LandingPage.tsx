import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { ScrollEntryDTO } from '@dojo/shared'
import { useAuth } from '../context/AuthContext'
import { LogoWordmark, LogoMark } from '../components/Logo'
import { DotGridBackground } from '../components/ui/DotGridBackground'
import { Button, buttonClasses } from '../components/ui/Button'
import { api } from '../lib/api'
import { ApiError } from '../lib/api/client'
import { API_URL } from '../lib/config'
import { pickLocalized, preferredLocale } from '../lib/scrollLocale'

gsap.registerPlugin(ScrollTrigger)

const PROJECT_SITE_URL = 'https://rodacato.github.io/dojo/'

const HERO_LINE_1 = 'Practice thinking for yourself.'

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
      <div className="flex items-center justify-center h-dvh bg-page text-secondary font-mono text-sm">
        <span className="text-accent animate-cursor" aria-hidden>_</span>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="min-h-screen bg-page text-primary">
      {errorParam && <AuthErrorBanner errorParam={errorParam} />}
      <StickyNav />
      <Hero />
      <WhatIsHere />
      <HowAKataWorks />
      <AccessSection />
      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  session_expired: 'Your session expired. Sign in again to continue.',
  invite_required: 'This instance is invite-only. Ask the person who runs it for an invitation, or request one below.',
  invite_invalid: 'This invitation is invalid or has already been used.',
}

function AuthErrorBanner({ errorParam }: Readonly<{ errorParam: string }>) {
  const message =
    AUTH_ERROR_MESSAGES[errorParam] ??
    'GitHub sign-in failed. Try again or check your GitHub status.'
  return (
    <div className="bg-danger/10 border-b border-danger/30 px-4 md:px-8 py-3 text-center">
      <p className="text-danger-text text-sm font-mono">{message}</p>
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
      className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled ? 'bg-page/95 backdrop-blur-md border-b border-border/30' : 'border-b border-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-4 max-w-5xl mx-auto">
        <LogoWordmark />
        <div className="flex items-center gap-3">
          <a href={`${API_URL}/auth/github`} className={buttonClasses({ variant: 'subtle', size: 'sm' })}>
            Sign in
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
  const ctaRef = useRef<HTMLDivElement>(null)
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
            <span className="opacity-0 select-none">
              {HERO_LINE_1}
              <span aria-hidden>_</span>
            </span>
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
            className="block font-mono text-lg md:text-xl text-secondary leading-snug mt-4"
          >
            The dojo for developers who still have something to prove. To themselves.
          </span>
          <p
            ref={paragraphRef}
            className="text-secondary text-base leading-relaxed mt-6 mb-8 max-w-md"
          >
            One surprise kata a day, about five minutes, no AI. Then the sensei reviews your
            reasoning.
          </p>
          <div ref={ctaRef}>
            <a href={`${API_URL}/auth/github`} className={buttonClasses({ variant: 'primary', size: 'lg' })}>
              Sign in with GitHub
            </a>
            <p className="mt-4 text-sm text-secondary max-w-md">
              Invite-only. Ask the person who runs this instance for an invitation, or{' '}
              <a href="#access" className="underline underline-offset-4 hover:text-primary">
                request one here
              </a>
              .
            </p>
          </div>
        </div>
        <div ref={terminalRef} className="hidden md:block">
          <KataPreview />
        </div>
      </div>
    </section>
  )
}

const PREVIEW_LINES = [
  'async function notifyAll(users) {',
  '  users.forEach(async (u) => {',
  '    await send(u)',
  '  })',
  '}',
]

function KataPreview() {
  return (
    <div className="bg-surface border border-border/60 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
        <span className="text-secondary text-xs font-mono">today's kata</span>
        <span className="text-secondary text-xs font-mono tabular-nums">05:00</span>
      </div>
      <div className="p-5 font-mono text-xs leading-relaxed space-y-2">
        {PREVIEW_LINES.map((line, i) => (
          <p key={line} className="text-primary">
            <span className="text-secondary mr-3 tabular-nums">{i + 1}</span>
            <span className="whitespace-pre">{line}</span>
          </p>
        ))}
        <p className="text-secondary pt-2">
          <span>{'>'}</span> tap the line with the bug. say why.
          <span className="text-accent animate-cursor ml-0.5">_</span>
        </p>
      </div>
    </div>
  )
}

const OFFERINGS = [
  {
    title: "Today's kata",
    body: 'One surprise kata a day, about five minutes. You see the topic when it opens. Done early? Ask for one more.',
  },
  {
    title: 'Advanced',
    body: 'Longer katas, up to 45 minutes. Set the type, language and time, and you get one.',
  },
  {
    title: 'Belts',
    body: 'Earned by showing up: completed katas, topic variety and active days. Every kata the sensei evaluates counts, whatever the verdict.',
  },
]

function WhatIsHere() {
  const [scrolls, setScrolls] = useState<ScrollEntryDTO[]>([])
  useEffect(() => {
    let cancelled = false
    api
      .getScrolls()
      .then((entries) => {
        if (!cancelled) setScrolls(entries)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  const locale = preferredLocale()

  return (
    <section data-anim="reveal" className="bg-surface/30 border-y border-border/20">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-20">
        <h2 className="font-mono text-xl md:text-2xl text-primary mb-12">What is here</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {OFFERINGS.map(({ title, body }) => (
            <div key={title}>
              <h3 className="font-mono text-lg text-primary mb-3">{title}</h3>
              <p className="text-secondary text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        {scrolls.length > 0 && (
          <div className="mt-12">
            <h3 className="font-mono text-lg text-primary mb-3">Scrolls</h3>
            <p className="text-secondary text-sm leading-relaxed mb-4">
              Learning apps the person who runs this instance has published.
            </p>
            <ul aria-label="Scrolls" className="flex flex-wrap gap-x-6 gap-y-2">
              {scrolls.map(({ id, slug, manifest }) => (
                <li key={id}>
                  <Link to={`/scrolls/${slug}`} className="text-sm text-primary underline underline-offset-4 hover:text-accent">
                    {pickLocalized(manifest.title, manifest.locales, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function HowAKataWorks() {
  const steps = [
    {
      n: '01',
      title: 'Open it',
      body: 'The topic stays hidden until you open it. The timer starts and does not pause.',
    },
    {
      n: '02',
      title: 'Work without AI',
      body: 'Nothing technical stops you from opening an assistant. The practice only works if you do not.',
    },
    {
      n: '03',
      title: 'Submit what you have',
      body: 'The sensei reviews your work and your reasoning. Verdict: passed, passed with notes, or needs work.',
    },
    {
      n: '04',
      title: 'Read and return',
      body: 'Read the analysis and what to revisit. Share the result if you want; a shared page is public.',
    },
  ]
  return (
    <section data-anim="reveal" className="max-w-5xl mx-auto px-4 md:px-8 py-20">
      <h2 className="font-mono text-xl md:text-2xl text-primary mb-12">How a kata works</h2>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map(({ n, title, body }) => (
          <li key={n} className="bg-surface border border-border/60 rounded-md p-5">
            <p className="text-secondary text-xs font-mono uppercase tracking-wider mb-3">{n}</p>
            <h3 className="font-mono text-sm text-primary mb-2 font-bold">{title}</h3>
            <p className="text-secondary text-sm leading-relaxed">{body}</p>
          </li>
        ))}
      </ol>
    </section>
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
            This instance is invite-only.
          </h2>
          <p className="text-secondary text-base leading-relaxed mb-4">
            This is a practice, not a platform.
          </p>
          <p className="text-secondary text-base leading-relaxed">
            The person who runs this instance issues the invitations. Ask them, or tell them here
            why you want in.
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
      <div className="bg-surface border border-border rounded-md p-6">
        <p className="font-mono text-secondary text-xs uppercase tracking-wider mb-2">[ Received ]</p>
        <p className="text-secondary text-sm leading-relaxed">
          No newsletter. No notifications. The operator of this instance will reach out directly.
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
    } catch (err) {
      const channelOff = err instanceof ApiError && err.status === 503
      setError(
        channelOff
          ? 'This instance does not take requests here. Ask the person who runs it.'
          : "Didn't go through. Try again in a moment.",
      )
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border/60 rounded-md p-6 space-y-5">
      <div>
        <p className="text-secondary text-xs font-mono uppercase tracking-wider">
          Request an invitation
        </p>
        <p className="text-secondary text-xs font-mono mt-1">
          // invites are issued based on intent.
        </p>
      </div>
      <div>
        <label htmlFor="github-handle" className="block text-xs text-secondary mb-2 font-mono uppercase tracking-wider">
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
        <label htmlFor="intent-statement" className="block text-xs text-secondary mb-2 font-mono uppercase tracking-wider">
          INTENT_STATEMENT
          {' '}
          <span className="ml-1 normal-case text-secondary">(optional, max 500)</span>
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
        <p role="alert" className="text-danger-text text-xs font-mono leading-relaxed">
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
            <LogoMark size={16} className="text-secondary" />
            <span className="text-secondary text-xs font-mono">{globalThis.location.host}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/changelog" className="text-secondary text-xs hover:text-secondary transition-colors">
              Changelog
            </Link>
            <Link to="/terms" className="text-secondary text-xs hover:text-secondary transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-secondary text-xs hover:text-secondary transition-colors">
              Privacy
            </Link>
          </div>
          <a
            href={PROJECT_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary text-xs font-mono hover:text-primary transition-colors"
          >
            Runs on Dojo, open source →
          </a>
        </div>
        <p className="text-center text-secondary text-xs italic">Not for everyone. Exactly as intended.</p>
      </div>
    </footer>
  )
}
