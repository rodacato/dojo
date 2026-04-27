import { PublicPageLayout } from '../components/PublicPageLayout'

interface ChangelogEntry {
  date: string
  phase: string
  title: string
  description: string
  commitUrl?: string
  commitHash?: string
}

const ENTRIES: ChangelogEntry[] = [
  {
    date: '2026-03-22',
    phase: 'Phase 1',
    title: 'Public pages and legal foundation',
    description:
      'Terms of service, privacy policy, changelog, and open source transparency pages. The product now has a complete public face — legal and philosophical. The honor code gets its own accent card because it deserves one.',
  },
  {
    date: '2026-03-22',
    phase: 'Phase 0→1',
    title: 'Security hardening and invitation system',
    description:
      'CSP headers, beforeunload on active kata, error boundaries, 404 page with personality. Invitation system: create tokens, gate new users, redeem flow. Admin can now manage exercises and invitations. The dojo has a door — and a lock.',
  },
  {
    date: '2026-03-22',
    phase: 'Phase 0',
    title: 'Branding, logo, and visual identity',
    description:
      'The torii gate mark, dojo_ wordmark with blinking cursor, favicon, OG image. Landing page redesign with terminal demo. The product stopped looking like a prototype and started looking like a product.',
  },
  {
    date: '2026-03-21',
    phase: 'Phase 0',
    title: 'Bearer token auth migration',
    description:
      'Replaced cross-domain cookies with Authorization Bearer headers. Server-side sessions unchanged — only the transport changed. Eliminated CORS cookie complexity and cross-subdomain fragility.',
  },
  {
    date: '2026-03-21',
    phase: 'Phase 0',
    title: 'Production deploy on Hetzner',
    description:
      'Kamal 2 deployment with Cloudflare Tunnel. CI/CD via GitHub Actions. Auto-migration on startup. The dojo is live — not just locally.',
  },
  {
    date: '2026-03-21',
    phase: 'Phase 0',
    title: 'Core loop complete',
    description:
      'The full kata cycle works end to end: day start ritual, kata selection, timed code/chat/whiteboard exercise, sensei evaluation with streaming, verdict, and results. 16 hand-crafted exercises seeded. Dashboard with streak tracking and activity heatmap.',
  },
]

export function ChangelogPage() {
  return (
    <PublicPageLayout>
      <div className="max-w-180 mx-auto px-4 md:px-6 py-12 md:py-20">
        <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted mb-3">
          Changelog
        </p>
        <h1 className="text-primary text-3xl md:text-[32px] font-semibold leading-tight tracking-tight">
          What we shipped.
        </h1>
        <p className="text-secondary text-[15px] mt-2 mb-12">
          Sprint by sprint. No marketing. Just done.
        </p>

        <div className="flex flex-col">
          {ENTRIES.map((entry, i) => (
            <Entry key={i} entry={entry} divider={i < ENTRIES.length - 1} />
          ))}
        </div>

        <p className="font-mono text-[11px] text-muted mt-12 inline-flex items-center">
          More history coming.
          <span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
        </p>
      </div>
    </PublicPageLayout>
  )
}

function Entry({ entry, divider }: { entry: ChangelogEntry; divider: boolean }) {
  const phaseColor = phaseColorClass(entry.phase)
  return (
    <article className={`py-8 ${divider ? 'border-b border-border/40' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <time className="font-mono text-[13px] text-secondary tabular-nums">{entry.date}</time>
        <span className={`font-mono text-[10px] tracking-[0.08em] uppercase ${phaseColor}`}>
          {entry.phase}
        </span>
      </div>
      <h2 className="text-primary text-lg font-semibold leading-tight tracking-tight mb-2">
        {entry.title}
      </h2>
      <p className="text-secondary text-[15px] leading-relaxed">{entry.description}</p>
      {entry.commitUrl && entry.commitHash && (
        <a
          href={entry.commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 font-mono text-[10px] tracking-[0.08em] uppercase text-accent hover:text-accent/80 transition-colors"
        >
          → view commit {entry.commitHash.slice(0, 7)}
        </a>
      )}
    </article>
  )
}

function phaseColorClass(phase: string): string {
  if (phase.includes('Phase 1') || phase.includes('Phase 2')) return 'text-accent'
  return 'text-muted'
}
