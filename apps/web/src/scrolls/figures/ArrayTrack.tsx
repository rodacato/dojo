export type ArrayTrackState = 'neutral' | 'cand' | 'active' | 'out' | 'done'

export type ArrayTrackData = {
  type: 'array-track'
  id: string
  input: Array<string | number>
  tracks: Array<{
    label: string
    states: ArrayTrackState[]
    output?: string
  }>
  caption?: string
}

const CELL_BASE =
  'flex flex-col items-center justify-center min-w-[44px] h-12 px-2 border rounded-sm font-mono text-xs leading-none'

const STATE_STYLES: Record<
  ArrayTrackState,
  { cell: string; mark: string; markChar: string }
> = {
  neutral: {
    cell: 'border-state-neutral/40 bg-elevated text-secondary',
    mark: 'text-muted',
    markChar: '',
  },
  cand: {
    cell: 'border-state-cand/60 bg-state-cand/10 text-primary',
    mark: 'text-state-cand',
    markChar: '◆',
  },
  active: {
    cell: 'border-state-active/60 bg-state-active/15 text-primary',
    mark: 'text-state-active',
    markChar: '▸',
  },
  out: {
    cell: 'border-state-out/60 border-dashed bg-state-out/10 text-secondary line-through',
    mark: 'text-state-out',
    markChar: '✕',
  },
  done: {
    cell: 'border-state-done/70 bg-state-done/10 text-primary font-semibold',
    mark: 'text-state-done',
    markChar: '✓',
  },
}

function Cell({ value, state }: { value: string | number; state: ArrayTrackState }) {
  const style = STATE_STYLES[state]
  return (
    <div className={`${CELL_BASE} ${style.cell}`} aria-label={`${value} · ${state}`}>
      <span className={`text-[10px] mb-0.5 ${style.mark}`}>{style.markChar || ' '}</span>
      <span>{value}</span>
    </div>
  )
}

export function ArrayTrack({ data }: { data: ArrayTrackData }) {
  const inputLen = data.input.length
  return (
    <figure className="my-6">
      <div className="bg-elevated border border-border rounded-sm p-3 overflow-x-auto">
        <div className="flex flex-col gap-2 min-w-fit">
          <div className="flex items-center gap-2">
            <span className="shrink-0 w-32 font-mono text-[10px] uppercase tracking-wider text-muted">
              input
            </span>
            <div className="flex gap-1.5">
              {data.input.map((v, i) => (
                <div
                  key={i}
                  className={`${CELL_BASE} border-border bg-page text-primary`}
                >
                  <span className="text-[10px] mb-0.5 text-muted">{' '}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <span className="ml-3 w-24" />
          </div>
          {data.tracks.map((track, ti) => (
            <div key={ti} className="flex items-center gap-2">
              <span className="shrink-0 w-32 font-mono text-[11px] text-primary truncate">
                {track.label}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: inputLen }).map((_, i) => {
                  const state: ArrayTrackState = track.states[i] ?? 'neutral'
                  const value = data.input[i] ?? ''
                  return <Cell key={i} value={value} state={state} />
                })}
              </div>
              {track.output !== undefined && (
                <span className="ml-3 font-mono text-[11px] text-state-done whitespace-nowrap">
                  → {track.output}
                </span>
              )}
            </div>
          ))}
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
