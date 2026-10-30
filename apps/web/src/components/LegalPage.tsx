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

export function LegalPage({ title, lastUpdated, sections }: Readonly<LegalPageProps>) {
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
      <article className="paper-container pt-12 pb-20 md:pt-20 md:pb-28">
        <header className="mb-10 md:mb-12">
          <div className="paper-eyebrow mb-4">Legal</div>
          <h1 className="paper-display">{title}</h1>
          <p className="paper-note mt-4">Last updated {lastUpdated}</p>
        </header>

        <div className="lg:grid lg:grid-cols-[240px_minmax(0,720px)] lg:gap-x-24 lg:items-start">
          <nav
            aria-label="On this page"
            className="hidden lg:block lg:sticky lg:top-24 border-t border-border pt-4"
          >
            <div className="paper-eyebrow mb-3">On this page</div>
            <ol className="space-y-2">
              {sections.map((section, i) => {
                const num = String(i + 1).padStart(2, '0')
                const isActive = activeSection === section.id
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={`paper-eyebrow block transition-colors ${
                        isActive ? 'text-primary' : 'hover:text-primary'
                      }`}
                    >
                      <span className="mr-2">§{num}</span>
                      {section.label}
                    </a>
                  </li>
                )
              })}
            </ol>
          </nav>

          <div>
            {sections.map((section, i) => {
              const num = String(i + 1).padStart(2, '0')
              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-20 border-t border-border pt-6 pb-8 md:pb-10"
                >
                  <h2 className="font-sans font-bold text-primary text-[22px] md:text-[26px] leading-tight tracking-tight mb-3">
                    <span className="paper-eyebrow block mb-3">§{num}</span>
                    <span>{section.label}</span>
                  </h2>
                  <div className="legal-prose paper-body space-y-4">{section.body}</div>
                </section>
              )
            })}

            <aside className="border-t border-border pt-6">
              <p className="font-sans font-bold text-primary text-lg mb-2">Questions?</p>
              <p className="paper-body">
                We don't have a legal team. Open an issue at{' '}
                <Link to="/open-source" className="text-accent-text hover:underline">
                  /open-source
                </Link>{' '}
                if something is unclear.
              </p>
            </aside>
          </div>
        </div>
      </article>
    </PublicPageLayout>
  )
}

export function LegalList({ children }: Readonly<{ children: ReactNode }>) {
  return <ul className="space-y-1 pl-0">{children}</ul>
}

export function LegalListItem({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <li className="flex gap-1.5 items-baseline">
      <span aria-hidden className="shrink-0 select-none">·</span>
      <span>{children}</span>
    </li>
  )
}

export function LegalCallout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="border-l-[3px] border-l-border bg-surface px-4 py-3 md:py-4 text-primary">
      {children}
    </div>
  )
}

export function LegalCode({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <code className="font-mono text-sm text-primary bg-surface border border-border rounded-sm px-1.5 py-0.5">
      {children}
    </code>
  )
}
