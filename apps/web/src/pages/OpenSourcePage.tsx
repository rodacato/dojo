import { PublicPageLayout } from '../components/PublicPageLayout'
import { GitHubIcon } from '../components/GitHubIcon'
import { buttonClasses } from '../components/ui/Button'

const REPO_URL = 'https://github.com/anthropics/dojo'

const REPO_CARDS = [
  {
    name: 'apps/web',
    body: 'React + Vite frontend. Tailwind 4, CodeMirror editor, WebSocket streaming client.',
    href: `${REPO_URL}/tree/main/apps/web`,
  },
  {
    name: 'apps/api',
    body: 'Hono + Node.js API. Hexagonal architecture, domain-driven design, PostgreSQL.',
    href: `${REPO_URL}/tree/main/apps/api`,
  },
  {
    name: 'packages/shared',
    body: 'Shared types and Zod schemas. The contract between frontend and backend.',
    href: `${REPO_URL}/tree/main/packages/shared`,
  },
  {
    name: 'infra/',
    body: 'Docker + Kamal 2 deploy targets. Cloudflare Tunnel ingress. Self-hosted on Hetzner.',
    href: `${REPO_URL}/tree/main/infra`,
  },
] as const

const WELCOME = [
  'New kata variations',
  'Prompt improvements',
  'Bug fixes with reproductions',
  'Accessibility fixes',
  'Infra hardening',
] as const

const NOT_WELCOME = [
  'Gamification features',
  'Tone-softening on the sensei',
  'AI assistance during the kata',
  'Scoring leaderboards',
  'Ad-driven monetization',
] as const

const SAMPLE_PROMPT = `{
  "owner_role": "Senior DBA — PostgreSQL, 12 yrs",
  "rubric": [
    "process over correctness",
    "identify what the developer demonstrated",
    "identify what they missed or assumed"
  ],
  "feedback_loops": "max 2 follow-ups",
  "verdict": "PASSED | PASSED_WITH_NOTES | NEEDS_WORK"
}`

export function OpenSourcePage() {
  return (
    <PublicPageLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 flex flex-col gap-16">
        {/* Hero */}
        <section>
          <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted mb-4">
            Transparency
          </p>
          <h1 className="text-primary text-3xl md:text-5xl font-semibold leading-tight tracking-tight max-w-2xl">
            Read the code that grades you.
          </h1>
          <p className="text-secondary text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
            Self-host, fork, contribute. The dojo runs on your reasoning AND your server.
          </p>
        </section>

        {/* Repo summary bar */}
        <section className="bg-surface border border-border rounded-md flex flex-col md:flex-row md:items-center md:divide-x md:divide-border">
          <RepoStat label="License" value="MIT" />
          <RepoStat label="Stack" value="TS / Node" />
          <RepoStat label="Architecture" value="Hexagonal" />
          <div className="px-4 md:px-6 py-3 md:py-0 md:ml-auto">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: 'ghost', size: 'md' })}
            >
              <GitHubIcon className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </section>

        {/* Repository structure */}
        <section>
          <SectionHeader eyebrow="Repo" title="Repository structure" />
          <div className="grid sm:grid-cols-2 gap-4">
            {REPO_CARDS.map((card) => (
              <a
                key={card.name}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface border border-border rounded-md p-6 flex flex-col gap-3 hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-lg font-bold text-primary">{card.name}</p>
                  <span aria-hidden className="text-muted text-lg leading-none">↗</span>
                </div>
                <p className="text-secondary text-[13px] leading-relaxed">{card.body}</p>
                <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-accent mt-auto">
                  Open in github →
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* How the sensei works */}
        <section>
          <SectionHeader eyebrow="Logic" title="How the sensei works" />
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="text-secondary text-[15px] leading-relaxed space-y-3">
              <p>
                The sensei is not a chatbot. It&apos;s a structured evaluation system with a
                persona, a rubric, and a tight feedback loop. The prompt template is in the
                repo — not hidden, not proprietary.
              </p>
              <p>
                Every exercise carries an{' '}
                <code className="text-accent font-mono text-[13px]">owner_role</code> (who the
                sensei pretends to be) and an{' '}
                <code className="text-accent font-mono text-[13px]">owner_context</code> (what
                they know). The verdict is one of three values. There is no score.
              </p>
            </div>
            <div className="bg-page border border-border rounded-md overflow-hidden">
              <div className="h-9 px-4 border-b border-border bg-surface flex items-center">
                <span className="font-mono text-[11px] tracking-[0.04em] text-muted">
                  sensei_system_prompt.json
                </span>
              </div>
              <pre className="p-4 font-mono text-[12px] text-primary leading-relaxed overflow-x-auto">
                {SAMPLE_PROMPT}
              </pre>
            </div>
          </div>
        </section>

        {/* Contributions */}
        <section>
          <SectionHeader eyebrow="Contribute" title="What's welcome — and what's not" />
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            <BulletList title="What's welcome." tone="success" items={WELCOME} />
            <BulletList title="What's not." tone="danger" items={NOT_WELCOME} />
          </div>
        </section>

        {/* Architecture */}
        <section>
          <SectionHeader eyebrow="Architecture" title="Boring on purpose." />
          <div className="text-secondary text-[15px] leading-relaxed space-y-3 max-w-3xl">
            <p>
              Turborepo monorepo. Hexagonal architecture with DDD on the API. Domain events
              for decoupling bounded contexts. PostgreSQL. Self-hosted on Hetzner with Kamal 2
              and Cloudflare Tunnel. Boring is a feature.
            </p>
            <p>
              Decisions are written down as ADRs in{' '}
              <code className="text-accent font-mono text-[13px]">docs/adr/</code>.{' '}
              <a
                href={`${REPO_URL}/blob/main/docs/adr/015-bounded-contexts.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                Read ADR 015: Bounded contexts →
              </a>
            </p>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  )
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
        {eyebrow}
      </p>
      <h2 className="text-primary text-2xl md:text-3xl font-semibold leading-tight tracking-tight">
        {title}
      </h2>
    </div>
  )
}

function RepoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 md:px-6 py-3 md:py-4 flex-1 first:md:pl-6 flex items-baseline gap-2">
      <span className="font-mono text-lg md:text-xl text-primary">{value}</span>
      <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
        {label}
      </span>
    </div>
  )
}

function BulletList({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'success' | 'danger'
  items: readonly string[]
}) {
  const glyph = tone === 'success' ? '+' : '−'
  const color = tone === 'success' ? 'text-success' : 'text-danger'
  return (
    <div className="bg-surface border border-border rounded-md p-6">
      <h3 className="text-primary text-base font-semibold mb-4">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-secondary text-[14px]">
            <span className={`font-mono leading-none mt-1 shrink-0 ${color}`} aria-hidden>
              {glyph}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
