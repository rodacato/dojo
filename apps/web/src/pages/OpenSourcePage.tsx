import { PublicPageLayout } from '../components/PublicPageLayout'
import { GitHubIcon } from '../components/GitHubIcon'
import { buttonClasses } from '../components/ui/Button'

const REPO_URL = 'https://github.com/rodacato/dojo'

const REPO_CARDS = [
  {
    name: 'apps/web',
    body: 'React + Vite frontend. Tailwind 4, CodeMirror editor, WebSocket streaming client.',
    href: `${REPO_URL}/tree/master/apps/web`,
  },
  {
    name: 'apps/api',
    body: 'Hono + Node.js API. Hexagonal architecture, domain-driven design, PostgreSQL.',
    href: `${REPO_URL}/tree/master/apps/api`,
  },
  {
    name: 'packages/shared',
    body: 'Shared types and Zod schemas. The contract between frontend and backend.',
    href: `${REPO_URL}/tree/master/packages/shared`,
  },
  {
    name: 'config/',
    body: 'Kamal deploy config for the API and web. docker-compose.yml at the root runs a full instance.',
    href: `${REPO_URL}/tree/master/config`,
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
      <section className="paper-container pt-12 pb-14 md:pt-20 md:pb-20">
        <p className="paper-eyebrow mb-4">Transparency</p>
        <h1 className="paper-display max-w-[16ch]">Read the code that grades you.</h1>
        <p className="paper-body mt-5 max-w-2xl">
          Self-host, fork, contribute. The dojo runs on your reasoning AND your server.
        </p>

        <div className="mt-6 border-t border-border pt-6 flex flex-col gap-4 md:flex-row md:items-center md:gap-12">
          <RepoStat label="License" value="MIT" />
          <RepoStat label="Stack" value="TS / Node" />
          <RepoStat label="Architecture" value="Hexagonal" />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonClasses({ variant: 'ghost', size: 'md' })} max-md:w-full max-md:mt-2`}
          >
            <GitHubIcon className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </section>

      <TintedBand>
        <SectionHeader eyebrow="Repo" title="Repository structure" />
        <div className="grid md:grid-cols-4 md:gap-8">
          {REPO_CARDS.map((card) => (
            <a
              key={card.name}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group border-t border-border py-5 flex flex-col gap-2"
            >
              <p className="font-mono text-sm font-bold text-primary">
                {card.name} <span aria-hidden>↗</span>
              </p>
              <p className="text-secondary text-sm leading-relaxed">{card.body}</p>
              <span className="font-mono text-xs text-accent-text group-hover:underline">
                Open in github →
              </span>
            </a>
          ))}
        </div>
      </TintedBand>

      <section className="paper-container py-16 md:py-24">
        <SectionHeader eyebrow="Logic" title="How the sensei works" />
        <div className="grid md:grid-cols-2 gap-8 md:gap-24 md:items-center">
          <div className="paper-body space-y-4">
            <p>
              The sensei is not a chatbot. It&apos;s a structured evaluation system with a
              persona, a rubric, and a tight feedback loop. The prompt template is in the
              repo — not hidden, not proprietary.
            </p>
            <p>
              Every kata carries an{' '}
              <code className="text-primary font-mono text-sm">owner_role</code> (who the
              sensei pretends to be) and an{' '}
              <code className="text-primary font-mono text-sm">owner_context</code> (what
              they know). The verdict is one of three values. There is no score.
            </p>
          </div>
          <div className="border-y border-border py-5">
            <p className="paper-eyebrow mb-3">sensei_system_prompt.json</p>
            <pre className="font-mono text-xs text-primary leading-relaxed whitespace-pre-wrap">
              {SAMPLE_PROMPT}
            </pre>
          </div>
        </div>
      </section>

      <TintedBand>
        <SectionHeader eyebrow="Contribute" title="What's welcome — and what's not" />
        <div className="grid md:grid-cols-2 gap-4 md:gap-8 md:items-start">
          <BulletList title="What's welcome." glyph="+" items={WELCOME} />
          <BulletList title="What's not." glyph="−" items={NOT_WELCOME} />
        </div>
      </TintedBand>

      <section className="paper-container pt-16 pb-20 md:pt-24 md:pb-28">
        <SectionHeader eyebrow="Architecture" title="Boring on purpose." />
        <div className="paper-body space-y-4 max-w-180">
          <p>
            Turborepo monorepo. Hexagonal architecture with DDD on the API. Domain events
            for decoupling bounded contexts. PostgreSQL. Runs anywhere Docker does, with Kamal
            config included for a single VPS. Boring is a feature.
          </p>
          <p>
            Decisions are written down as ADRs in{' '}
            <code className="text-primary font-mono text-sm">docs/adr/</code>.{' '}
            <a
              href={`${REPO_URL}/tree/master/docs/adr`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-text underline"
            >
              Browse the decision records →
            </a>
          </p>
        </div>
      </section>
    </PublicPageLayout>
  )
}

function TintedBand({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <section className="bg-surface border-y border-border">
      <div className="paper-container py-16 md:py-24">{children}</div>
    </section>
  )
}

function SectionHeader({ eyebrow, title }: Readonly<{ eyebrow: string; title: string }>) {
  return (
    <div className="mb-8 md:mb-10">
      <p className="paper-eyebrow mb-3">{eyebrow}</p>
      <h2 className="paper-heading">{title}</h2>
    </div>
  )
}

function RepoStat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-lg md:text-xl text-primary">{value}</span>
      <span className="paper-eyebrow">{label}</span>
    </div>
  )
}

function BulletList({
  title,
  glyph,
  items,
}: Readonly<{
  title: string
  glyph: string
  items: readonly string[]
}>) {
  return (
    <div className="bg-page border border-border rounded-sm p-5 md:p-6">
      <h3 className="text-primary text-base md:text-lg font-semibold mb-4">{title}</h3>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-baseline gap-3 text-primary text-sm">
            <span className="font-mono text-secondary shrink-0" aria-hidden>
              {glyph}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
