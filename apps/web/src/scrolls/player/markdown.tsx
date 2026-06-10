import { renderSlots, type SlotHeading } from '../../lib/slots'
import { FigureRenderer, splitOnFigureDirectives } from '../figures/FigureRenderer'
import { markdownToInnerHtml } from '../figures/markdown'

export function stripLeadingH1(md: string): string {
  // Drops the first line if it's an H1, plus one trailing blank line.
  return md.replace(/^#\s+.+(\r?\n(\r?\n)?)?/, '').trimStart()
}

export function PlainMarkdown({ content }: { content: string }) {
  const segments = splitOnFigureDirectives(content)
  const only = segments[0]
  if (segments.length === 1 && only && only.kind === 'text') {
    return (
      <div
        className="text-sm text-muted leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: `<p class="text-sm text-muted mb-3">${markdownToInnerHtml(only.content)}</p>`,
        }}
      />
    )
  }
  return (
    <div className="text-sm text-muted leading-relaxed">
      {segments.map((seg, i) =>
        seg.kind === 'text' ? (
          <div
            key={i}
            dangerouslySetInnerHTML={{
              __html: `<p class="text-sm text-muted mb-3">${markdownToInnerHtml(seg.content)}</p>`,
            }}
          />
        ) : (
          <FigureRenderer key={i} id={seg.id} />
        ),
      )}
    </div>
  )
}

const SLOT_STYLES: Record<SlotHeading, string> = {
  'Why this matters': 'border-accent/40 bg-accent/5',
  'Your task': 'border-border bg-surface',
  'Examples': 'border-muted/40 bg-muted/5',
  'Edge cases': 'border-warning/40 bg-warning/5',
}

const SLOT_LABEL_COLORS: Record<SlotHeading, string> = {
  'Why this matters': 'text-accent',
  'Your task': 'text-muted',
  'Examples': 'text-muted',
  'Edge cases': 'text-warning',
}

function SlotCard({ slot, body }: { slot: SlotHeading; body: string }) {
  return (
    <section className={`p-3 border rounded-sm ${SLOT_STYLES[slot]}`}>
      <p className={`text-xs font-mono uppercase tracking-widest mb-2 ${SLOT_LABEL_COLORS[slot]}`}>
        {slot}
      </p>
      {body && <PlainMarkdown content={body} />}
    </section>
  )
}

export function MarkdownContent({ content }: { content: string }) {
  const slots = renderSlots(content)
  if (slots) {
    return (
      <div className="space-y-3">
        {slots.map((s) => (
          <SlotCard key={s.slot} slot={s.slot} body={s.body} />
        ))}
      </div>
    )
  }
  return <PlainMarkdown content={content} />
}
