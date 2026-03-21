import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GitHubIcon } from '../components/GitHubIcon'
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
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border/40">
        <span className="font-mono text-lg text-primary">
          dojo<span className="text-accent animate-pulse">_</span>
        </span>
        <a
          href={`${API_URL}/auth/github`}
          className="flex items-center gap-2 text-sm font-mono text-secondary hover:text-primary transition-colors"
        >
          <GitHubIcon className="w-4 h-4" />
          Sign in
        </a>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-8 pt-24 pb-16">
        <h1 className="font-mono text-3xl md:text-4xl text-primary leading-tight mb-6">
          The best developers<br />are getting worse.
        </h1>
        <p className="text-secondary text-[1rem] leading-relaxed mb-4">
          Not from lack of effort. From outsourcing thinking to tools that never push back.
        </p>
        <p className="text-secondary text-[1rem] leading-relaxed mb-4">
          Copilot finishes your sentences. ChatGPT explains your errors. Your debugger
          catches your bugs before you do. The code ships — but the instinct atrophies.
        </p>
        <p className="text-secondary text-[1rem] leading-relaxed">
          Dojo is a daily kata for software engineers who want to keep the skill, not just the output.
        </p>
      </section>

      <hr className="border-border/40 max-w-2xl mx-auto" />

      {/* The problem */}
      <section className="max-w-2xl mx-auto px-8 py-16">
        <h2 className="font-mono text-xl text-primary mb-6">
          You can still write code. Can you still think it?
        </h2>
        <p className="text-secondary text-[1rem] leading-relaxed mb-4">
          There's a specific kind of developer. Years of experience. Strong opinions. Good instincts.
        </p>
        <p className="text-secondary text-[1rem] leading-relaxed mb-4">
          They reached for a tool — just this once, just to save time. Then again. Then every sprint.
        </p>
        <p className="text-secondary text-[1rem] leading-relaxed mb-4">
          Now when the tool is gone — offline, rate-limited, wrong — there's a hesitation that wasn't
          there before. A reach for autocomplete before the thought finishes forming.
        </p>
        <p className="text-secondary text-[1rem] leading-relaxed">
          Dojo exists for developers who noticed.
        </p>
      </section>

      <hr className="border-border/40 max-w-2xl mx-auto" />

      {/* How it works */}
      <section className="max-w-2xl mx-auto px-8 py-16">
        <h2 className="font-mono text-xl text-primary mb-10">One kata. One sensei. Every day.</h2>
        <div className="space-y-8">
          {[
            {
              n: '01',
              text: 'The dojo assigns you a kata — a real engineering scenario drawn from the kind of work you do. Code review, incident response, architecture decision, SQL performance. No toy examples.',
            },
            {
              n: '02',
              text: 'You have a fixed window. No hints. No autocomplete. No looking things up. The code editor is deliberate: just you and the problem.',
            },
            {
              n: '03',
              text: 'The sensei evaluates your work. Not with a rubric, but with the specific judgment of an expert in that domain. A PostgreSQL DBA will not grade your React the same way a principal engineer does.',
            },
            {
              n: '04',
              text: 'If your answer raises more questions than it answers, the sensei asks one. Not to be kind. To be honest about what you demonstrated.',
            },
            {
              n: '05',
              text: 'You get a verdict. Topics to practice. And a receipt for showing up.',
            },
          ].map(({ n, text }) => (
            <div key={n} className="flex gap-6">
              <span className="font-mono text-accent text-sm shrink-0 mt-0.5">{n}</span>
              <p className="text-secondary text-[1rem] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border/40 max-w-2xl mx-auto" />

      {/* What it's not */}
      <section className="max-w-2xl mx-auto px-8 py-16">
        <div className="space-y-6">
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
            <div key={label} className="flex gap-4">
              <span className="font-mono text-sm text-primary shrink-0 w-28">{label}</span>
              <p className="text-secondary text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border/40 max-w-2xl mx-auto" />

      {/* Access */}
      <section className="max-w-2xl mx-auto px-8 py-16">
        <h2 className="font-mono text-xl text-primary mb-6">The dojo is invite-only.</h2>
        <p className="text-secondary text-[1rem] leading-relaxed mb-4">
          We're not building a platform. We're building a practice.
        </p>
        <p className="text-secondary text-[1rem] leading-relaxed mb-10">
          That means a small number of developers who are serious about this, not a large
          number who are curious about it. Invitations go to people we know or people those people know.
        </p>
        <RequestAccessForm />
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-8 py-8 mt-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-mono text-muted text-sm">
            dojo<span className="text-accent">_</span>
          </span>
          <span className="text-muted text-xs">Built in public. Invite-only.</span>
        </div>
      </footer>
    </div>
  )
}

function RequestAccessForm() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="border border-border rounded-sm p-6 bg-surface">
        <p className="font-mono text-accent text-sm mb-1">Received.</p>
        <p className="text-secondary text-sm">No newsletter. No notifications. We'll reach out directly if we have space.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm text-secondary mb-1.5 font-mono">GitHub handle</label>
        <input
          type="text"
          placeholder="@yourhandle"
          className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-primary text-sm font-mono placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-secondary mb-1.5 font-mono">
          Why you're here <span className="text-muted">(optional)</span>
        </label>
        <textarea
          placeholder="What you're practicing toward."
          rows={3}
          className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-primary text-sm font-sans placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        className="px-5 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
      >
        Request access →
      </button>
      <p className="text-muted text-xs">No newsletter. No notifications. We'll reach out directly if we have space.</p>
    </form>
  )
}
