export type DisambiguationEntry = {
  title: string
  values: Record<string, string>
}

export type DisambiguationData = {
  type: 'disambiguation'
  id: string
  sharedSkeletonLabel: string
  attributes: string[]
  entries: DisambiguationEntry[]
  highlightAttribute: string
  caption?: string
}

export function Disambiguation({ data }: Readonly<{ data: DisambiguationData }>) {
  return (
    <figure className="my-6">
      <div className="bg-elevated border border-border rounded-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-baseline justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {data.sharedSkeletonLabel}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-state-active">
            ▸ divergent: {data.highlightAttribute}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-page/40">
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                  attribute
                </th>
                {data.entries.map((e) => (
                  <th
                    key={e.title}
                    className="text-left px-3 py-2 font-mono text-[11px] text-primary"
                  >
                    {e.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.attributes.map((attr) => {
                const isHighlight = attr === data.highlightAttribute
                return (
                  <tr
                    key={attr}
                    className={
                      isHighlight
                        ? 'border-t border-border bg-state-active/10'
                        : 'border-t border-border'
                    }
                  >
                    <td className="px-3 py-2 font-mono text-[11px] text-secondary align-top">
                      <span className="inline-flex items-baseline gap-2">
                        {isHighlight && <span className="text-state-active">◆</span>}
                        {attr}
                      </span>
                    </td>
                    {data.entries.map((e) => (
                      <td
                        key={e.title}
                        className={`px-3 py-2 font-mono text-[11px] align-top ${
                          isHighlight ? 'text-primary font-semibold' : 'text-secondary'
                        }`}
                      >
                        {e.values[attr] ?? '—'}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {data.caption && (
        <figcaption className="mt-3 text-xs text-secondary italic leading-relaxed">
          {data.caption}
        </figcaption>
      )}
    </figure>
  )
}
