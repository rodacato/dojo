import { PublicPageLayout } from '../components/PublicPageLayout'

interface ChangelogEntry {
  date: string
  phase: string
  title: string
  description: string
  commitUrl?: string
}

const entries: ChangelogEntry[] = [
  {
    date: 'Mar 22, 2026',
    phase: 'Phase 1',
    title: 'Public pages and legal foundation',
    description:
      'Terms of service, privacy policy, changelog, and open source transparency pages. The product now has a complete public face — legal and philosophical. The honor code gets its own accent card because it deserves one.',
  },
  {
    date: 'Mar 22, 2026',
    phase: 'Phase 0→1',
    title: 'Security hardening and invitation system',
    description:
      'CSP headers, beforeunload on active kata, error boundaries, 404 page with personality. Invitation system: create tokens, gate new users, redeem flow. Admin can now manage exercises and invitations. The dojo has a door — and a lock.',
  },
  {
    date: 'Mar 22, 2026',
    phase: 'Phase 0',
    title: 'Branding, logo, and visual identity',
    description:
      'The torii gate mark, dojo_ wordmark with blinking cursor, favicon, OG image. Landing page redesign with terminal demo. The product stopped looking like a prototype and started looking like a product.',
  },
  {
    date: 'Mar 21, 2026',
    phase: 'Phase 0',
    title: 'Bearer token auth migration',
    description:
      'Replaced cross-domain cookies with Authorization Bearer headers. Server-side sessions unchanged — only the transport changed. Eliminated CORS cookie complexity and cross-subdomain fragility.',
  },
  {
    date: 'Mar 21, 2026',
    phase: 'Phase 0',
    title: 'Production deploy on Hetzner',
    description:
      'Kamal 2 deployment with Cloudflare Tunnel. CI/CD via GitHub Actions. Auto-migration on startup. The dojo is live — not just locally.',
  },
  {
    date: 'Mar 21, 2026',
    phase: 'Phase 0',
    title: 'Core loop complete',
    description:
      'The full kata cycle works end to end: day start ritual, kata selection, timed code/chat/whiteboard exercise, sensei evaluation with streaming, verdict, and results. 16 hand-crafted exercises seeded. Dashboard with streak tracking and activity heatmap.',
  },
]

export function ChangelogPage() {
  return (
    <PublicPageLayout>
      <div className="max-w-3xl mx-auto px-8 py-16">
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="font-mono text-2xl md:text-3xl text-primary mb-2">Changelog</h1>
            <p className="text-secondary text-sm">What shipped, when, and why.</p>
          </div>
        </div>

        <div className="space-y-0">
          {entries.map((entry, i) => (
            <div key={i}>
              <article className="py-8">
                <div className="flex items-center gap-3 mb-3">
                  <time className="font-mono text-xs text-muted">{entry.date}</time>
                  <span className="text-xs font-mono px-2 py-0.5 bg-surface border border-border/40 rounded-sm text-muted">
                    {entry.phase}
                  </span>
                </div>
                <h2 className="font-mono text-lg text-primary mb-3">{entry.title}</h2>
                <p className="text-secondary text-sm leading-relaxed">{entry.description}</p>
                {entry.commitUrl && (
                  <a
                    href={entry.commitUrl}
                    className="inline-block mt-3 text-xs font-mono text-muted hover:text-accent transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    → view commit
                  </a>
                )}
              </article>
              {i < entries.length - 1 && <hr className="border-border/20" />}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted/40 font-mono text-xs">
            Awaiting next deployment...<span className="text-accent animate-pulse">▌</span>
          </p>
        </div>
      </div>
    </PublicPageLayout>
  )
}
