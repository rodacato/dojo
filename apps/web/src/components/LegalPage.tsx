import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PublicPageLayout } from './PublicPageLayout'

export interface LegalSection {
  id: string
  label: string
  body: ReactNode
}

interface LegalPageProps {
  title: string
  lastUpdated: string
  sections: LegalSection[]
}

export function LegalPage({ title, lastUpdated, sections }: LegalPageProps) {
  const first = sections[0]?.id
  const [activeSection, setActiveSection] = useState(first ?? '')

  useEffect(() => {
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

  return (
    <PublicPageLayout>
      <article className="max-w-[720px] mx-auto px-4 md:px-6 pt-16 pb-24">
        <header className="mb-8">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">
            Legal
          </div>
          <h1 className="text-primary text-3xl sm:text-[32px] font-semibold leading-tight">
            {title}
          </h1>
          <p className="font-mono text-[13px] text-muted mt-2">
            Last updated {lastUpdated}
          </p>
        </header>

        <nav
          aria-label="On this page"
          className="rounded-md border border-border bg-surface px-4 py-4 mb-12"
        >
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">
            On this page
          </div>
          <ol className="space-y-1.5">
            {sections.map((section, i) => {
              const num = String(i + 1).padStart(2, '0')
              const isActive = activeSection === section.id
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`block font-mono text-[13px] uppercase tracking-wider transition-colors ${
                      isActive ? 'text-accent' : 'text-muted hover:text-accent'
                    }`}
                  >
                    <span className="text-secondary mr-2">§{num}</span>
                    {section.label}
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="space-y-12">
          {sections.map((section, i) => {
            const num = String(i + 1).padStart(2, '0')
            return (
              <section key={section.id} id={section.id} className="scroll-mt-20">
                <h2 className="text-primary text-[18px] font-semibold leading-snug mb-4 flex items-baseline gap-3">
                  <span className="font-mono text-muted">§{num}</span>
                  <span>{section.label}</span>
                </h2>
                <div className="legal-prose text-secondary text-[15px] leading-relaxed space-y-4">
                  {section.body}
                </div>
              </section>
            )
          })}
        </div>

        <aside className="mt-16 rounded-md border border-border bg-surface p-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2">
            Questions?
          </div>
          <p className="text-secondary text-[13px] leading-relaxed">
            We don't have a legal team. Open an issue at{' '}
            <Link to="/open-source" className="text-accent hover:underline">
              /open-source
            </Link>{' '}
            if something is unclear.
          </p>
        </aside>
      </article>
    </PublicPageLayout>
  )
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="space-y-2 pl-0">{children}</ul>
}

export function LegalListItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 items-baseline">
      <span aria-hidden className="text-muted shrink-0 select-none leading-none">·</span>
      <span>{children}</span>
    </li>
  )
}

export function LegalCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-border border-l-2 border-l-accent bg-page px-4 py-3 text-primary">
      {children}
    </div>
  )
}

export function LegalCode({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-[13px] text-accent bg-surface border border-border rounded-sm px-1.5 py-0.5">
      {children}
    </code>
  )
}
