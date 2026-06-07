export type Annotation = { line: number; mark: '✕' | '✓'; text?: string }

export type BeforeAfterData = {
  type: 'before-after'
  id: string
  language: string
  left: { title: string; code: string; annotations?: Annotation[] }
  right: { title: string; code: string; annotations?: Annotation[] }
  caption?: string
}

function Pane({
  title,
  code,
  annotations = [],
  side,
}: {
  title: string
  code: string
  annotations?: Annotation[]
  side: 'left' | 'right'
}) {
  const lines = code.replace(/\n$/, '').split('\n')
  const annByLine = new Map<number, Annotation>()
  for (const a of annotations) annByLine.set(a.line, a)

  const accent = side === 'left' ? 'border-l-2 border-l-state-out' : 'border-l-2 border-l-state-done'

  return (
    <div className={`flex-1 min-w-0 bg-elevated border border-border rounded-sm ${accent}`}>
      <div className="px-3 py-2 border-b border-border flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{title}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {side === 'left' ? 'before' : 'after'}
        </span>
      </div>
      <pre className="px-3 py-3 font-mono text-xs leading-relaxed text-primary overflow-x-auto">
        {lines.map((ln, i) => {
          const lineNo = i + 1
          const ann = annByLine.get(lineNo)
          const markColor = ann?.mark === '✕' ? 'text-state-out' : 'text-state-done'
          return (
            <div key={i} className="flex gap-3 items-start">
              <span className={`shrink-0 w-3 text-center ${ann ? markColor : 'text-muted/40'}`}>
                {ann ? ann.mark : ' '}
              </span>
              <code className="block">{ln || ' '}</code>
              {ann?.text && (
                <span className="ml-auto text-[10px] text-muted italic shrink-0 max-w-[40%]">
                  {ann.text}
                </span>
              )}
            </div>
          )
        })}
      </pre>
    </div>
  )
}

export function BeforeAfter({ data }: { data: BeforeAfterData }) {
  return (
    <figure className="my-6">
      <div className="flex flex-col md:flex-row gap-3">
        <Pane title={data.left.title} code={data.left.code} annotations={data.left.annotations} side="left" />
        <Pane title={data.right.title} code={data.right.code} annotations={data.right.annotations} side="right" />
      </div>
      {data.caption && (
        <figcaption className="mt-3 text-xs text-secondary italic leading-relaxed">
          {data.caption}
        </figcaption>
      )}
    </figure>
  )
}
