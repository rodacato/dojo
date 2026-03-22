import { PublicPageLayout } from '../components/PublicPageLayout'
import { GitHubIcon } from '../components/GitHubIcon'

const repoCards = [
  {
    name: 'apps/web',
    description: 'React + Vite frontend. Tailwind 4, CodeMirror editor, WebSocket streaming client.',
    lang: 'TypeScript',
  },
  {
    name: 'apps/api',
    description: 'Hono + Node.js API. Hexagonal architecture, domain-driven design, PostgreSQL.',
    lang: 'TypeScript',
  },
  {
    name: 'packages/shared',
    description: 'Shared types and Zod schemas. The contract between frontend and backend.',
    lang: 'TypeScript',
  },
  {
    name: 'docs/',
    description: 'PRDs, specs, ADRs, expert panel, branding, design prompts. The decisions behind the code.',
    lang: 'Markdown',
  },
]

export function OpenSourcePage() {
  return (
    <PublicPageLayout>
      <div className="max-w-4xl mx-auto px-8 py-16">
        <h1 className="font-mono text-2xl md:text-3xl text-primary mb-2">
          Read the code. Trust the product.<span className="text-accent animate-pulse">|</span>
        </h1>
        <p className="text-secondary text-sm mb-12">
          Dojo is open source. The evaluation logic, the exercise catalog, the sensei prompts —
          everything is in the repo. Transparency is not a feature; it's the default.
        </p>

        {/* GitHub stats bar */}
        <div className="flex flex-wrap items-center gap-6 mb-12 py-4 px-5 bg-surface border border-border/40 rounded-md">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <GitHubIcon className="w-4 h-4" />
            <span className="font-mono">dojo</span>
          </div>
          <span className="text-muted text-xs font-mono">License: MIT</span>
          <a
            href="https://github.com"
            className="ml-auto text-xs font-mono text-muted hover:text-accent transition-colors flex items-center gap-1"
          >
            View on GitHub →
          </a>
        </div>

        {/* Repo structure */}
        <section className="mb-16">
          <h2 className="font-mono text-sm text-muted mb-6">{'// what\'s in the repo'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {repoCards.map((card) => (
              <div
                key={card.name}
                className="border-l-2 border-accent/50 bg-surface border border-border/40 rounded-r-md p-5 hover:border-accent transition-colors"
              >
                <h3 className="font-mono text-sm text-primary mb-2">{card.name}</h3>
                <p className="text-secondary text-xs leading-relaxed mb-3">{card.description}</p>
                <span className="text-muted text-xs font-mono">{card.lang}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sensei logic */}
        <section className="mb-16">
          <h2 className="font-mono text-lg text-primary mb-4">The sensei's logic</h2>
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 text-secondary text-sm leading-relaxed space-y-3">
              <p>
                The sensei is not a chatbot. It's a structured evaluation system with a defined persona,
                rubric, and feedback loop.
              </p>
              <p>
                Every exercise has an <code className="text-accent text-xs">owner_role</code> (who the
                sensei pretends to be) and an <code className="text-accent text-xs">owner_context</code> (what
                the sensei knows about the problem). These are in the codebase — not hidden.
              </p>
            </div>
            <div className="md:col-span-3">
              <div className="bg-surface border border-border/40 rounded-md overflow-hidden">
                <div className="px-4 py-2 border-b border-border/40">
                  <span className="text-muted text-xs font-mono">sensei_system_prompt.json</span>
                </div>
                <pre className="p-4 font-mono text-xs text-secondary leading-relaxed overflow-x-auto">
{`{
  "owner_role": "Senior DBA — PostgreSQL, 12 yrs",
  "rubric": [
    "process over correctness",
    "identify what the developer demonstrated",
    "identify what they missed or assumed"
  ],
  "feedback_loops": "max 2 follow-ups",
  "verdict": "PASSED | PASSED_WITH_NOTES | NEEDS_WORK"
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Contributing */}
        <section className="mb-16">
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h2 className="font-mono text-lg text-primary mb-4 flex items-center gap-2">
                What's welcome
              </h2>
              <ul className="list-none space-y-2">
                {[
                  'Bug reports with reproduction steps',
                  'Performance improvements with benchmarks',
                  'Accessibility fixes',
                  'Documentation corrections',
                  'New exercise proposals (Phase 3)',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-secondary text-sm">
                    <span className="text-accent shrink-0">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-mono text-lg text-primary mb-4 flex items-center gap-2">
                What's not
              </h2>
              <ul className="list-none space-y-2">
                {[
                  'Skip or reroll mechanics for kata selection',
                  'Softening the sensei\'s evaluation tone',
                  'Pausing or extending the timer',
                  'Adding hints or autocomplete to the editor',
                  'Gamification that rewards gaming over practice',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-secondary text-sm">
                    <span className="text-danger shrink-0">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section>
          <h2 className="font-mono text-lg text-primary mb-4">Architecture</h2>
          <div className="text-secondary text-sm leading-relaxed space-y-3">
            <p>
              Turborepo monorepo. Hexagonal architecture with DDD in the API. Domain events
              for decoupling bounded contexts. PostgreSQL. Self-hosted on Hetzner with Kamal 2
              and Cloudflare Tunnel.
            </p>
            <p>
              Architectural decisions are documented as ADRs in{' '}
              <code className="text-accent text-xs">docs/adr/</code>. If you want to understand
              why something works the way it does, start there.
            </p>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  )
}
