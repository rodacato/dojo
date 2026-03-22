import { useEffect, useState } from 'react'
import { PublicPageLayout } from '../components/PublicPageLayout'

const sections = [
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'what-we-dont', label: "What we don't" },
  { id: 'how-data-is-used', label: 'How data is used' },
  { id: 'github-oauth', label: 'GitHub OAuth' },
  { id: 'data-retention', label: 'Data retention' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'contact', label: 'Contact' },
]

export function PrivacyPage() {
  const [activeSection, setActiveSection] = useState(sections[0]!.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <PublicPageLayout>
      <div className="max-w-5xl mx-auto px-8 py-16">
        <h1 className="font-mono text-2xl md:text-3xl text-primary mb-2">Privacy Policy</h1>
        <p className="text-secondary text-sm mb-2">What we collect, what we don't, and why.</p>
        <p className="text-muted text-xs font-mono mb-12">Effective: March 2026</p>

        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-8 space-y-1">
              {sections.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`block text-xs font-mono py-1.5 pl-3 border-l-2 transition-colors ${
                    activeSection === id
                      ? 'border-accent text-primary'
                      : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 max-w-2xl space-y-12">
            {/* Mobile nav */}
            <div className="flex flex-wrap gap-2 lg:hidden">
              {sections.map(({ id, label }) => (
                <a key={id} href={`#${id}`} className="text-xs font-mono text-muted hover:text-secondary">
                  {label}
                </a>
              ))}
            </div>

            <section id="what-we-collect">
              <h2 className="font-mono text-lg text-primary mb-4">What we collect</h2>
              <div className="text-secondary text-sm leading-relaxed space-y-3">
                <p>When you use dojo, we store:</p>
                <ul className="list-none space-y-2 pl-0">
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Your GitHub profile information (username, avatar URL, email)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Your kata submissions and the sensei's evaluations</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Session metadata (start time, completion time, exercise selected)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Your streak and activity data (derived from sessions)</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="what-we-dont">
              <h2 className="font-mono text-lg text-primary mb-4">What we don't collect</h2>
              <div className="text-secondary text-sm leading-relaxed space-y-3">
                <p>We deliberately do not collect:</p>
                <ul className="list-none space-y-2 pl-0">
                  <li className="flex gap-2">
                    <span className="text-muted shrink-0">×</span>
                    <span>Analytics or tracking data (no Google Analytics, no Mixpanel, no Segment)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-muted shrink-0">×</span>
                    <span>Your GitHub repositories, code, or commit history</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-muted shrink-0">×</span>
                    <span>Browser fingerprints or device identifiers</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-muted shrink-0">×</span>
                    <span>Cookies beyond the session token required for authentication</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="how-data-is-used">
              <h2 className="font-mono text-lg text-primary mb-4">How data is used</h2>
              <div className="text-secondary text-sm leading-relaxed space-y-3">
                <p>Your data is used to:</p>
                <ul className="list-none space-y-2 pl-0">
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Run the kata loop (assign exercises, evaluate submissions, track progress)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Display your profile and streak to other practitioners</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Generate the leaderboard (ranked by consistency, not score)</span>
                  </li>
                </ul>
                <p>
                  Your submissions are sent to Anthropic's Claude API for evaluation. They are not stored
                  by Anthropic beyond the API request. We do not use your data to train any models.
                </p>
              </div>
            </section>

            <section id="github-oauth">
              <h2 className="font-mono text-lg text-primary mb-4">GitHub OAuth</h2>
              <div className="text-secondary text-sm leading-relaxed space-y-3">
                <p>We request the minimum GitHub OAuth scopes:</p>
                <div className="bg-surface border border-border/40 rounded-md p-4 font-mono text-xs space-y-1">
                  <p><code className="text-accent">read:user</code> — your public profile (username, avatar)</p>
                  <p><code className="text-accent">user:email</code> — your email address (for account identification)</p>
                </div>
                <p>
                  We do not request access to your repositories, organizations, or any other GitHub data.
                  You can revoke access at any time from your GitHub settings.
                </p>
              </div>
            </section>

            <section id="data-retention">
              <h2 className="font-mono text-lg text-primary mb-4">Data retention</h2>
              <div className="border-l-[3px] border-accent bg-surface rounded-r-md p-5">
                <p className="text-primary text-sm leading-relaxed font-medium">
                  Sessions are yours. We don't sell them, share them, or use them to train models.
                </p>
              </div>
              <div className="text-secondary text-sm leading-relaxed space-y-3 mt-4">
                <p>
                  Your session data is stored on a self-hosted VPS (Hetzner, Germany). It is not replicated
                  to third-party analytics platforms. If you delete your account, your profile is removed.
                  Anonymized session data may be retained for leaderboard integrity.
                </p>
              </div>
            </section>

            <section id="your-rights">
              <h2 className="font-mono text-lg text-primary mb-4">Your rights</h2>
              <div className="text-secondary text-sm leading-relaxed space-y-3">
                <p>You can:</p>
                <ul className="list-none space-y-2 pl-0">
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Request a copy of all data associated with your account</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Request deletion of your account and associated data</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent shrink-0">→</span>
                    <span>Revoke GitHub OAuth access at any time</span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="contact">
              <h2 className="font-mono text-lg text-primary mb-4">Contact</h2>
              <div className="text-secondary text-sm leading-relaxed">
                <p>
                  Privacy questions? Open an issue on GitHub or reach out via the
                  channels listed on the open source page.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  )
}
