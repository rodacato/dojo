import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { ScrollEntryDTO } from '@dojo/shared'
import { useAuth } from '../context/AuthContext'
import { LogoMark } from '../components/Logo'
import { PublicNav } from '../components/PublicNav'
import { PublicFooter } from '../components/PublicFooter'
import { Button, buttonClasses } from '../components/ui/Button'
import { api } from '../lib/api'
import { ApiError } from '../lib/api/client'
import { API_URL } from '../lib/config'
import { pickLocalized, preferredLocale } from '../lib/scrollLocale'

const HERO_LINE_1 = 'Practice thinking for yourself.'

const SECTION = 'border-t border-border'
const SECTION_INNER = 'paper-container py-12 md:py-28'

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
      <div className="flex items-center justify-center h-dvh bg-page text-secondary font-mono text-sm">
        <span className="text-accent animate-cursor" aria-hidden>_</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page text-primary">
      {errorParam && <AuthErrorBanner errorParam={errorParam} />}
      <PublicNav showLinks={false} action="sign-in" />
      <Hero />
      <AccessSection />
      <WhatIsHere />
      <HowAKataWorks />
      <PublicFooter showOpenSource={false} showProjectSite showTagline />
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

function Hero() {
  return (
    <section className="paper-container max-md:px-0 md:py-24">
      <div className="grid md:grid-cols-2 md:gap-16 md:items-end">
        <picture className="md:order-last">
          <source srcSet="/art/temple-800.webp 800w, /art/temple-1600.webp 1600w" sizes="(min-width: 768px) 50vw, 100vw" type="image/webp" />
          <img
            src="/art/temple-800.webp"
            alt=""
            width={800}
            height={343}
            className="block w-full h-60 md:h-[35rem] object-cover"
          />
        </picture>
        <div className="px-4 pt-10 pb-12 md:p-0">
          <LogoMark size={64} className="text-accent size-11 md:size-16" />
          <h1 className="paper-display mt-6 md:mt-8">{HERO_LINE_1}</h1>
          <p className="mt-4 font-sans text-lg md:text-xl font-medium leading-snug text-primary">
            The dojo for developers who still have something to prove. To themselves.
          </p>
          <p className="paper-body mt-4 max-w-md">
            One surprise kata a day, about five minutes, no AI. Then the sensei reviews your
            reasoning.
          </p>
          <a
            href={`${API_URL}/auth/github`}
            className={`${buttonClasses({ variant: 'primary', size: 'lg' })} mt-8 w-full md:w-auto`}
          >
            Sign in with GitHub
          </a>
          <p className="paper-note mt-4 max-w-md">
            Invite-only. Ask the person who runs this instance for an invitation, or{' '}
            <a href="#access" className="underline underline-offset-4 hover:text-primary">
              request one here
            </a>
            .
          </p>
        </div>
      </div>
    </section>
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
    <section className={SECTION}>
      <div className={SECTION_INNER}>
        <h2 className="paper-heading">What is here</h2>
        <div className="grid md:grid-cols-3 md:gap-12 mt-8 md:mt-10">
          {OFFERINGS.map(({ title, body }) => (
            <div key={title} className="border-t border-border pt-5 pb-8 md:pb-0">
              <h3 className="font-sans text-lg font-semibold text-primary">{title}</h3>
              <p className="paper-body mt-2">{body}</p>
            </div>
          ))}
        </div>
        {scrolls.length > 0 && (
          <div className="border-t border-border pt-5 mt-4 md:mt-12">
            <h3 className="font-sans text-lg font-semibold text-primary">Scrolls</h3>
            <p className="paper-body mt-2 mb-4">
              Learning apps the person who runs this instance has published.
            </p>
            <ul aria-label="Scrolls" className="flex flex-wrap gap-x-6 gap-y-2">
              {scrolls.map(({ id, slug, manifest }) => (
                <li key={id}>
                  <Link to={`/scrolls/${slug}`} className="paper-body text-primary underline underline-offset-4 hover:text-accent-text">
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
    <section className={SECTION}>
      <div className={SECTION_INNER}>
        <h2 className="paper-heading">How a kata works</h2>
        <ol className="grid md:grid-cols-4 md:gap-12 mt-8 md:mt-10">
          {steps.map(({ n, title, body }) => (
            <li key={n} className="border-t border-border pt-5 pb-8 md:pb-0">
              <p className="paper-eyebrow">{n}</p>
              <h3 className="font-sans text-lg font-semibold text-primary mt-2">{title}</h3>
              <p className="paper-body mt-2">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function AccessSection() {
  return (
    <section id="access" className={`${SECTION} bg-surface`}>
      <div className={`${SECTION_INNER} grid md:grid-cols-2 gap-8 md:gap-16 items-start`}>
        <div>
          <h2 className="paper-heading">This instance is invite-only.</h2>
          <p className="mt-4 font-sans text-base text-primary">This is a practice, not a platform.</p>
          <p className="paper-body mt-4 max-w-md">
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
      <div className="bg-page border border-border rounded-sm p-6">
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
    <form onSubmit={handleSubmit} className="bg-page border border-border rounded-sm p-6 space-y-5">
      <div>
        <p className="text-primary text-sm font-mono">
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
