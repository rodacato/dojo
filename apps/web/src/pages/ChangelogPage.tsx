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
    date: '2026-10-19',
    phase: 'Mobile',
    title: 'Settings, sized for thumbs',
    description:
      'On a phone every pill, input and button in Settings is now big enough to tap, and the weekly goal fits on one row. Selected options read the same as the katas page. Debugging and SQL join the interests, so they can steer today\'s kata.',
  },
  {
    date: '2026-10-19',
    phase: 'Practice',
    title: "Your preferences shape today's kata",
    description:
      "Skill level and interests in Settings now steer today's kata too, not only Advanced. The less randomness you set, the more often today's surprise lands on your topics and your level. It still stays the same all day.",
  },
  {
    date: '2026-10-19',
    phase: 'Mobile',
    title: 'The rest of admin, on a phone',
    description:
      'Scrolls, Invitations and the error log now list their entries as cards below tablet width, with every action big enough to tap. An error card opens its stack and context in place. Health keeps its cards and gets bigger Refresh and Reprovision buttons.',
  },
  {
    date: '2026-10-19',
    phase: 'Mobile',
    title: 'Admin works on a phone',
    description:
      'Below tablet width, /admin swaps its sidebar for a bottom bar with the five sections and a top bar back to the dojo. The katas list becomes cards you tap to edit, and the kata forms pin Cancel and Save to the bottom. The playground header now shows the kata link on a phone, and Sign in is big enough to tap.',
  },
  {
    date: '2026-10-19',
    phase: 'Mobile',
    title: 'Run within thumb reach on a phone',
    description:
      'On a phone the playground keeps one row of selectors at the top and puts Run, Ask the sensei and the run status in a bar at the bottom. Every control is big enough to tap, and the toolbar no longer wraps over the editor.',
  },
  {
    date: '2026-10-19',
    phase: 'Practice',
    title: 'Advanced: set the constraints, get one kata',
    description:
      'When today\'s kata is not what you want, the katas page now asks for how long, a type and a language, and starts one kata inside them. No mood picker and no list of three to choose from. Your level, interests and weekly goal live in Settings.',
  },
  {
    date: '2026-10-19',
    phase: 'Practice',
    title: "Today's kata, one tap away",
    description:
      'The dashboard holds a five-minute kata picked for you today. You see how long it is, not what it is, so there is nothing to skip; one tap opens it. Once it is done, One more kata gives you another. The welcome on your first visit starts it too.',
  },
  {
    date: '2026-10-19',
    phase: 'Practice',
    title: 'Spot the bug in five minutes',
    description:
      'A new kind of kata built for a phone: read a few lines, tap the one with the bug, and say why in two or three sentences. The sensei grades the why. Three ship with the seed to start; rerun it after upgrading.',
  },
  {
    date: '2026-10-19',
    phase: 'Mobile',
    title: 'Dojo on your home screen',
    description:
      'Add dojo to your phone\'s home screen and it opens like an app: full screen, no browser bar. Screens now respect the notch and the home indicator, and full-height screens no longer slide under the address bar. It still needs a connection, because the sensei does.',
  },
  {
    date: '2026-10-15',
    phase: 'Brand',
    title: 'A new mark: the open gate',
    description:
      'The torii is gone. Dojo now has the Open Gate mark, drawn in vermillion next to the dojo_ wordmark in the nav, the sidebar and the sign-in screens. Sumi (dark) and Washi (light) are the brand themes; Slate Indigo is still there if you prefer it, under Settings. The favicon, the home-screen icon and the preview that shows when you share a link now use the same mark, and the share card for a session follows the Sumi palette.',
  },
  {
    date: '2026-10-02',
    phase: 'Self-hosted',
    title: 'Dojo is self-hosted open source',
    description:
      'There is no hosted service. You run an instance for yourself, your friends or your team, and whoever runs it owns its invitations, its data and its LLM bill. This release makes that path real: a fresh install now loads the katas, there is an operator runbook for upgrades, backups and secrets, the security page describes what the code does, and mail never goes out from an address the operator does not own.',
  },
  {
    date: '2026-06-20',
    phase: 'Phase 1',
    title: 'The five-language scroll set is live',
    description:
      'Go joins Ruby, Python, Rust, and TypeScript — five language crash-courses, free, no account needed to start. Every kata runs your code in a real sandbox and tells you the truth. The set we committed to is complete.',
  },
  {
    date: '2026-06-19',
    phase: 'Phase 1',
    title: 'Scrolls, reshaped',
    description:
      'The catalog now shows where you stand and lets you start anything; each scroll opens with a contract — what it is, who it\'s for, how long it takes. Jump to any lesson, freely. No streaks, no badges, no percentage hero. Clarity and free choice, not dopamine.',
  },
  {
    date: '2026-06-08',
    phase: 'Phase 1',
    title: 'Crash-course scrolls — the language you already half-know',
    description:
      'A new format for experienced developers: a language\'s idioms and peculiarities, taught as deltas from the model you already hold — not the fundamentals you don\'t need. Every concept is drilled in a real sandbox kata, never just read about. Proven on Ruby first; Python, Rust, and TypeScript followed.',
  },
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
      'CSP headers, beforeunload on active kata, error boundaries, 404 page with personality. Invitation system: create tokens, gate new users, redeem flow. Admin can now manage katas and invitations. The dojo has a door — and a lock.',
  },
  {
    date: '2026-03-22',
    phase: 'Phase 0',
    title: 'Branding, logo, and visual identity (since replaced by Open Gate)',
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
      'The full kata cycle works end to end: day start ritual, kata selection, timed code/chat/whiteboard kata, sensei evaluation with streaming, verdict, and results. 16 hand-crafted katas seeded. Dashboard with streak tracking and activity heatmap.',
  },
]

export function ChangelogPage() {
  return (
    <PublicPageLayout>
      <div className="max-w-180 mx-auto px-4 md:px-6 py-12 md:py-20">
        <p className="font-mono text-xs tracking-[0.08em] uppercase text-secondary mb-3">
          Changelog
        </p>
        <h1 className="text-primary text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
          What we shipped.
        </h1>
        <p className="text-secondary text-base mt-2">
          Sprint by sprint. No marketing. Just done.
        </p>
        <p className="text-secondary text-sm mt-2 mb-12">
          This is the dojo project&apos;s own history. Which release an instance runs is up to its operator.
        </p>

        <div className="flex flex-col">
          {ENTRIES.map((entry, i) => (
            <Entry key={entry.title} entry={entry} divider={i < ENTRIES.length - 1} />
          ))}
        </div>

        <p className="font-mono text-xs text-secondary mt-12 inline-flex items-center">
          More history coming.
          <span className="animate-cursor text-accent ml-0.5" aria-hidden>_</span>
        </p>
      </div>
    </PublicPageLayout>
  )
}

function Entry({ entry, divider }: Readonly<{ entry: ChangelogEntry; divider: boolean }>) {
  const phaseColor = phaseColorClass(entry.phase)
  return (
    <article className={`py-8 ${divider ? 'border-b border-border/40' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <time className="font-mono text-sm text-secondary tabular-nums">{entry.date}</time>
        <span className={`font-mono text-xs tracking-[0.08em] uppercase ${phaseColor}`}>
          {entry.phase}
        </span>
      </div>
      <h2 className="text-primary text-lg font-semibold leading-tight tracking-tight mb-2">
        {entry.title}
      </h2>
      <p className="text-secondary text-base leading-relaxed">{entry.description}</p>
      {entry.commitUrl && entry.commitHash && (
        <a
          href={entry.commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 font-mono text-xs tracking-[0.08em] uppercase text-accent-text hover:underline transition-colors"
        >
          → view commit {entry.commitHash.slice(0, 7)}
        </a>
      )}
    </article>
  )
}

function phaseColorClass(phase: string): string {
  if (phase.includes('Phase 1') || phase.includes('Phase 2') || phase === 'Self-hosted') return 'text-accent'
  return 'text-secondary'
}
