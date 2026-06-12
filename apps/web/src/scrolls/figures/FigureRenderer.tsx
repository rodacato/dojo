import { ArrayTrack } from './ArrayTrack'
import { BeforeAfter } from './BeforeAfter'
import { Disambiguation } from './Disambiguation'
import { MetricPair } from './MetricPair'
import { TabbedCard } from './TabbedCard'
import { TwoByTwo } from './TwoByTwo'
import { PYTHON_FIGURES } from './data/python-figures'
import { RUBY_FIGURES, type FigureData } from './data/ruby-figures'
import { RUST_FIGURES } from './data/rust-figures'

const ALL_FIGURES: Record<string, FigureData> = {
  ...RUBY_FIGURES,
  ...PYTHON_FIGURES,
  ...RUST_FIGURES,
}

export function FigureRenderer({ id }: { id: string }) {
  const figure = ALL_FIGURES[id]
  if (!figure) {
    return (
      <aside className="my-6 p-3 border border-dashed border-muted/40 rounded-sm bg-elevated/40 font-mono text-[11px] text-muted">
        figure: <code className="text-secondary">{id}</code> · data not registered
      </aside>
    )
  }
  switch (figure.type) {
    case 'array-track':
      return <ArrayTrack data={figure} />
    case 'before-after':
      return <BeforeAfter data={figure} />
    case 'disambiguation':
      return <Disambiguation data={figure} />
    case 'metric-pair':
      return <MetricPair data={figure} />
    case 'tabbed-card':
      return <TabbedCard data={figure} />
    case 'two-by-two':
      return <TwoByTwo data={figure} />
  }
}

const FIGURE_DIRECTIVE_RE = /:figure\[([a-z][a-z0-9-]*)\]\{id="([a-z0-9-]+)"\}/g

export type ContentSegment =
  | { kind: 'text'; content: string }
  | { kind: 'figure'; figureType: string; id: string }

export function splitOnFigureDirectives(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  let lastIndex = 0
  const re = new RegExp(FIGURE_DIRECTIVE_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    const figureType = match[1]
    const id = match[2]
    if (!figureType || !id) continue
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', content: content.slice(lastIndex, match.index) })
    }
    segments.push({ kind: 'figure', figureType, id })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    segments.push({ kind: 'text', content: content.slice(lastIndex) })
  }
  return segments
}
