import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GitHubIcon } from '../components/GitHubIcon'
import { LogoWordmark, LogoMark } from '../components/Logo'
import { API_URL } from '../lib/config'

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
        <div className="bg-danger/10 border-b border-danger/30 px-8 py-3 text-center">
          <p className="text-danger text-sm font-mono">
            {errorParam === 'session_expired'
              ? 'Your session expired. Sign in again to continue.'
              : 'GitHub login failed. Try again or check your GitHub status.'}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/20 max-w-5xl mx-auto">
        <LogoWordmark />
        <div className="flex items-center gap-6">
          <a href="#access" className="text-sm font-mono text-muted hover:text-secondary transition-colors hidden sm:block">
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
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl text-primary leading-tight mb-8">
              The best developers{' '}
              <br className="hidden md:block" />
              are getting worse.
            </h1>
            <p className="text-secondary text-[1rem] leading-relaxed mb-4">
              Not from lack of effort. From outsourcing thinking to tools that never push back.
            </p>
            <p className="text-secondary text-[1rem] leading-relaxed mb-8">
              Dojo is a daily kata for software engineers who want to keep the skill, not just the output.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#access"
                className="px-5 py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
              >
                Request access
              </a>
              <span className="text-muted text-xs font-mono">Invite-only. For practitioners.</span>
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

      {/* Problem section */}
      <section className="bg-surface/30 border-y border-border/20">
        <div className="max-w-3xl mx-auto px-8 py-20">
          <h2 className="font-mono text-xl md:text-2xl text-primary mb-8">
            You can still write code. Can you still think it?
          </h2>
          <div className="space-y-5 text-secondary text-[1rem] leading-relaxed">
            <p>
              There's a specific kind of developer. Years of experience. Strong opinions. Good instincts.
            </p>
            <p>
              They reached for a tool — just this once, just to save time. Then again. Then every sprint.
            </p>
            <p>
              Now when the tool is gone — offline, rate-limited, wrong — there's a hesitation that wasn't
              there before. A reach for autocomplete before the thought finishes forming.
            </p>
            <p className="text-primary font-medium">
              Dojo exists for developers who noticed.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-8 py-20">
        <h2 className="font-mono text-xl md:text-2xl text-primary mb-4">One kata. One sensei. Every day.</h2>
        <p className="text-muted text-sm mb-12">The entire loop in five steps.</p>
        <div className="space-y-6">
          {[
            {
              n: '01',
              title: 'Assign',
              text: 'The dojo assigns you a kata — a real engineering scenario drawn from the kind of work you do. Code review, incident response, architecture decision, SQL performance. No toy examples.',
            },
            {
              n: '02',
              title: 'Solve',
              text: 'You have a fixed window. No hints. No autocomplete. No looking things up. The code editor is deliberate: just you and the problem.',
            },
            {
              n: '03',
              title: 'Evaluate',
              text: 'The sensei evaluates your work. Not with a rubric, but with the specific judgment of an expert in that domain. A PostgreSQL DBA will not grade your React the same way a principal engineer does.',
            },
            {
              n: '04',
              title: 'Challenge',
              text: 'If your answer raises more questions than it answers, the sensei asks one. Not to be kind. To be honest about what you demonstrated.',
            },
            {
              n: '05',
              title: 'Verdict',
              text: 'You get a verdict. Topics to practice. And a receipt for showing up.',
            },
          ].map(({ n, title, text }) => (
            <div key={n} className="flex gap-6 p-4 rounded-md hover:bg-surface/50 transition-colors">
              <span className="font-mono text-accent text-sm shrink-0 mt-1">{n}</span>
              <div>
                <span className="font-mono text-primary text-sm block mb-1">{title}</span>
                <p className="text-secondary text-sm leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What it's not */}
      <section className="bg-surface/30 border-y border-border/20">
        <div className="max-w-3xl mx-auto px-8 py-20">
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                label: 'Not a quiz.',
                text: 'There are no multiple choice answers. No right/wrong toggle. No leaderboard points for guessing correctly.',
              },
              {
                label: 'Not a tutor.',
                text: 'The sensei doesn\'t teach you. It evaluates you. The difference is what makes the practice real.',
              },
              {
                label: 'Not a substitute.',
                text: 'Dojo is not an alternative to building things. It\'s the deliberate practice you do so building things doesn\'t get worse over time.',
              },
            ].map(({ label, text }) => (
              <div key={label} className="border-l-2 border-border/40 pl-4">
                <span className="font-mono text-sm text-primary block mb-2">{label}</span>
                <p className="text-secondary text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Access */}
      <section id="access" className="max-w-3xl mx-auto px-8 py-20">
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

      {/* Footer */}
      <footer className="border-t border-border/20 px-8 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={16} className="text-muted" />
            <span className="text-muted text-xs font-mono">dojo.notdefined.dev</span>
          </div>
          <span className="text-muted text-xs">Built in public. Invite-only. Not for everyone.</span>
        </div>
      </footer>
    </div>
  )
}

function RequestAccessForm() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="border border-accent/30 rounded-md p-6 bg-surface">
        <p className="font-mono text-accent text-sm mb-2">Received.</p>
        <p className="text-secondary text-sm leading-relaxed">No newsletter. No notifications. We'll reach out directly if we have space.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
      }}
      className="bg-surface border border-border/60 rounded-md p-6 space-y-4"
    >
      <div>
        <label className="block text-sm text-secondary mb-1.5 font-mono">GitHub handle</label>
        <input
          type="text"
          placeholder="@yourhandle"
          className="w-full bg-base border border-border rounded-sm px-3 py-2 text-primary text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-secondary mb-1.5 font-mono">
          Why you're here <span className="text-muted">(optional)</span>
        </label>
        <textarea
          placeholder="Optional. But the honest answers are more interesting."
          rows={3}
          className="w-full bg-base border border-border rounded-sm px-3 py-2 text-primary text-sm font-sans placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2.5 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
      >
        Request access
      </button>
      <p className="text-muted text-xs text-center">No newsletter. No notifications. We'll reach out directly.</p>
    </form>
  )
}
