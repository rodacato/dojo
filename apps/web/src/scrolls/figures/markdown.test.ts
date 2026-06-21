import { describe, expect, it } from 'vitest'
import { markdownToInnerHtml } from './markdown'

describe('markdownToInnerHtml', () => {
  it('escapes HTML metacharacters in plain text to prevent injection', () => {
    const html = markdownToInnerHtml('<script>alert("x")</script> & done')

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&quot;x&quot;')
    expect(html).toContain('&amp; done')
  })

  it('renders a fenced code block, preserving the (already-escaped) inner code', () => {
    const html = markdownToInnerHtml('```ts\nif (a < b) return "x"\n```')

    expect(html).toContain('<pre class="bg-bg/50 rounded p-3 my-3 overflow-x-auto">')
    expect(html).toContain('<code class="text-xs font-mono text-secondary">')
    // escaping ran before the fence transform, so angle brackets and quotes are entities
    expect(html).toContain('if (a &lt; b) return &quot;x&quot;')
    // the language token and backticks are consumed, not emitted
    expect(html).not.toContain('```')
    expect(html).not.toContain('>ts')
  })

  it('renders inline code spans', () => {
    const html = markdownToInnerHtml('use `const` here')

    expect(html).toContain(
      '<code class="bg-bg/50 px-1.5 py-0.5 rounded text-accent text-xs font-mono">const</code>',
    )
    expect(html).not.toContain('`const`')
  })

  it('maps heading levels to the matching h1/h2/h3 tags', () => {
    expect(markdownToInnerHtml('# Title')).toContain('<h1 class="text-xl font-mono text-primary mb-4">Title</h1>')
    expect(markdownToInnerHtml('## Section')).toContain('<h2 class="text-lg font-mono text-primary mt-6 mb-3">Section</h2>')
    expect(markdownToInnerHtml('### Sub')).toContain('<h3 class="text-base font-mono text-primary mt-5 mb-2">Sub</h3>')
  })

  it('does not treat ## as an h1 (longer heading marker wins)', () => {
    const html = markdownToInnerHtml('## Section')

    expect(html).not.toContain('<h1')
  })

  it('renders bold and list items', () => {
    expect(markdownToInnerHtml('**strong**')).toContain('<strong class="text-primary">strong</strong>')
    expect(markdownToInnerHtml('- item')).toContain(
      '<li class="text-sm text-muted ml-4 list-disc">item</li>',
    )
  })

  it('splits blank-line-separated blocks into paragraph breaks', () => {
    const html = markdownToInnerHtml('first\n\nsecond')

    expect(html).toContain('first</p><p class="text-sm text-muted mb-3">second')
  })

  it('leaves plain prose without markers untouched', () => {
    expect(markdownToInnerHtml('just words')).toBe('just words')
  })
})
