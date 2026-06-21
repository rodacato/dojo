import { useState } from 'react'
import { markdownToInnerHtml } from './markdown'

export type TabbedCardTab = { label: string; body: string }

export type TabbedCardData = {
  type: 'tabbed-card'
  id: string
  tabs: TabbedCardTab[]
  defaultTab?: number
  caption?: string
}

export function TabbedCard({ data }: Readonly<{ data: TabbedCardData }>) {
  const initial = clampIndex(data.defaultTab ?? 0, data.tabs.length)
  const [active, setActive] = useState(initial)
  const tablistId = `tabbed-card-${data.id}`
  const activeTab = data.tabs[active]

  return (
    <figure className="my-6">
      <div className="bg-elevated border border-border rounded-sm overflow-hidden">
        <div
          role="tablist"
          aria-label={data.id}
          className="flex flex-wrap items-stretch border-b border-border bg-page/40"
        >
          {data.tabs.map((tab, i) => {
            const isActive = i === active
            return (
              <button
                key={i}
                role="tab"
                id={`${tablistId}-tab-${i}`}
                aria-selected={isActive}
                aria-controls={`${tablistId}-panel-${i}`}
                tabIndex={isActive ? 0 : -1}
                type="button"
                onClick={() => setActive(i)}
                className={
                  isActive
                    ? 'px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-state-active border-b-2 border-state-active -mb-px'
                    : 'px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-secondary border-b-2 border-transparent -mb-px'
                }
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab && (
          <div
            role="tabpanel"
            id={`${tablistId}-panel-${active}`}
            aria-labelledby={`${tablistId}-tab-${active}`}
            className="p-4 text-sm text-muted leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: `<p class="text-sm text-muted mb-3">${markdownToInnerHtml(activeTab.body)}</p>`,
            }}
          />
        )}
      </div>
      {data.caption && (
        <figcaption className="mt-3 text-xs text-secondary italic leading-relaxed">
          {data.caption}
        </figcaption>
      )}
    </figure>
  )
}

function clampIndex(i: number, len: number): number {
  if (len === 0) return 0
  if (i < 0) return 0
  if (i >= len) return len - 1
  return i
}
