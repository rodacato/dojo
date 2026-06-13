export type TwoByTwoCell = {
  eyebrow: string
  title: string
  body: string
}

export type TwoByTwoData = {
  type: 'two-by-two'
  id: string
  rowAxis: { label: string; values: [string, string] }
  colAxis: { label: string; values: [string, string] }
  cells: [[TwoByTwoCell, TwoByTwoCell], [TwoByTwoCell, TwoByTwoCell]]
  highlightCell?: [0 | 1, 0 | 1]
  caption?: string
}

function Cell({
  cell,
  highlighted,
}: {
  cell: TwoByTwoCell
  highlighted: boolean
}) {
  return (
    <div
      className={
        highlighted
          ? 'p-4 border border-state-active/60 bg-state-active/10 rounded-sm flex flex-col gap-1.5'
          : 'p-4 border border-border bg-elevated rounded-sm flex flex-col gap-1.5'
      }
    >
      <p
        className={`font-mono text-[10px] uppercase tracking-wider ${
          highlighted ? 'text-state-active' : 'text-muted'
        }`}
      >
        {highlighted ? `▸ ${cell.eyebrow}` : cell.eyebrow}
      </p>
      <p
        className={`font-mono text-xs ${
          highlighted ? 'text-primary font-semibold' : 'text-secondary'
        }`}
      >
        {cell.title}
      </p>
      <p className="text-xs text-secondary leading-relaxed">{cell.body}</p>
    </div>
  )
}

export function TwoByTwo({ data }: { data: TwoByTwoData }) {
  const isHighlighted = (row: 0 | 1, col: 0 | 1) =>
    !!data.highlightCell && data.highlightCell[0] === row && data.highlightCell[1] === col

  return (
    <figure className="my-6">
      <div className="bg-page border border-border rounded-sm p-3 overflow-x-auto">
        {/* min-w keeps the 2×2 readable; narrow phones scroll rather than
            crushing the cells. Row-label column shrinks on mobile. */}
        <div className="min-w-[300px]">
        {/* col-axis label */}
        <div className="flex items-baseline gap-3 mb-2 pl-[88px] sm:pl-[140px]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            {data.colAxis.label}
          </span>
        </div>
        <div className="grid grid-cols-[72px_1fr_1fr] sm:grid-cols-[120px_1fr_1fr] gap-2 items-stretch">
          {/* col headers */}
          <div />
          <div className="font-mono text-[11px] text-primary px-2 py-1">{data.colAxis.values[0]}</div>
          <div className="font-mono text-[11px] text-primary px-2 py-1">{data.colAxis.values[1]}</div>

          {/* row 0 */}
          <div className="flex items-center justify-end pr-2 font-mono text-[11px] text-primary">
            <span className="text-right">
              <span className="block text-[9px] uppercase tracking-wider text-muted mb-0.5">
                {data.rowAxis.label}
              </span>
              {data.rowAxis.values[0]}
            </span>
          </div>
          <Cell cell={data.cells[0][0]} highlighted={isHighlighted(0, 0)} />
          <Cell cell={data.cells[0][1]} highlighted={isHighlighted(0, 1)} />

          {/* row 1 */}
          <div className="flex items-center justify-end pr-2 font-mono text-[11px] text-primary">
            {data.rowAxis.values[1]}
          </div>
          <Cell cell={data.cells[1][0]} highlighted={isHighlighted(1, 0)} />
          <Cell cell={data.cells[1][1]} highlighted={isHighlighted(1, 1)} />
        </div>
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
