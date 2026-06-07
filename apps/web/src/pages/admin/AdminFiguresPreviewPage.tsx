import { FigureRenderer } from '../../scrolls/figures/FigureRenderer'

type PreviewEntry = {
  id: string
  type: string
  lesson: string
  context: string
}

const RUBY_PREVIEWS: PreviewEntry[] = [
  {
    id: 'npm-vs-bundle',
    type: 'before-after',
    lesson: 'L0 Step 0.2 — How Ruby actually runs',
    context:
      'Embedded after the bundle exec paragraph, replacing the prose paragraph that compared Bundler to venv.',
  },
  {
    id: 'foreach-vs-each-block',
    type: 'before-after',
    lesson: 'L1 Step 1.1 — Blocks: the syntax you see everywhere',
    context:
      'Embedded between "What blocks look like in the wild" and "What a block is, technically". Pure visual relief, no prose displaced.',
  },
  {
    id: 'string-vs-symbol',
    type: 'disambiguation',
    lesson: 'L2 Step 2.1 — Literals that surprise',
    context:
      'Embedded inside the Symbols surprise. Highlights *Identity* as the divergent dimension that kills the "two string types" reflex.',
  },
  {
    id: 'operators-as-messages',
    type: 'two-by-two',
    lesson: 'L3 Step 3.1 — Object model: operators are methods in disguise',
    context:
      'Embedded at the top of the section. Replaces ~80 words of cross-language prose; the code block below proves what the figure conceptualises.',
  },
]

export function AdminFiguresPreviewPage() {
  return (
    <div className="p-6 max-w-4xl">
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-wider text-accent">
          Scrolls · POC · Figures preview
        </p>
        <h1 className="text-primary text-2xl font-semibold mt-2">Embeddable visual figures</h1>
        <p className="text-secondary text-sm mt-3 max-w-2xl">
          Live render of the four Ruby figures wired through the directive parser. Each section
          mirrors how the figure embeds in its lesson prose, so you can judge the in-context feel
          without re-seeding the DB.
        </p>
      </header>

      <div className="space-y-12">
        {RUBY_PREVIEWS.map((p) => (
          <section key={p.id} className="border-t border-border pt-6">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {p.type}
            </p>
            <h2 className="text-primary text-base font-mono font-semibold mt-1">{p.lesson}</h2>
            <p className="text-xs text-muted italic mt-2 leading-relaxed max-w-2xl">{p.context}</p>
            <FigureRenderer id={p.id} />
            <p className="font-mono text-[10px] text-muted/60 mt-1">
              directive: <code>:figure[{p.type}]{`{id="${p.id}"}`}</code>
            </p>
          </section>
        ))}
      </div>

      <footer className="mt-12 pt-6 border-t border-border">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">POC criteria</p>
        <ul className="mt-3 space-y-1 text-xs text-muted list-disc list-inside">
          <li>Components feel on-brand alongside the rest of the scrolls UI.</li>
          <li>The figure earns its space — pedagogy &gt; decoration.</li>
          <li>Bundle delta on /scrolls/* under 20KB raw (verified during build).</li>
          <li>Every figure looks at least as good as the prose paragraph it replaces.</li>
        </ul>
      </footer>
    </div>
  )
}
