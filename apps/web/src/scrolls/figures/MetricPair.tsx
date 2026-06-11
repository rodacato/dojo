export type MetricPairData = {
  type: 'metric-pair'
  id: string
  metric: string
  entries: Array<{
    label: string
    value: string
    detail?: string
  }>
  highlight?: number
  caption?: string
}

export function MetricPair({ data }: { data: MetricPairData }) {
  return (
    <figure className="my-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted mb-2">
        {data.metric}
      </p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${data.entries.length}, minmax(0, 1fr))` }}>
        {data.entries.map((entry, i) => {
          const highlighted = data.highlight === i
          return (
            <div
              key={entry.label}
              className={`p-4 border rounded-sm flex flex-col items-center text-center gap-1 ${
                highlighted
                  ? 'border-state-active/60 bg-state-active/10'
                  : 'border-border bg-surface'
              }`}
            >
              <span
                className={`font-mono text-2xl leading-none ${
                  highlighted ? 'text-state-active' : 'text-primary'
                }`}
              >
                {entry.value}
              </span>
              <span className="font-mono text-xs text-secondary">{entry.label}</span>
              {entry.detail && (
                <span className="text-[11px] text-muted leading-snug">{entry.detail}</span>
              )}
            </div>
          )
        })}
      </div>
      {data.caption && (
        <figcaption className="mt-3 text-xs text-secondary italic leading-relaxed">
          {data.caption}
        </figcaption>
      )}
    </figure>
  )
}
