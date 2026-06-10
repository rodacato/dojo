import { describe, it, expect } from 'vitest'
import { markdownToInnerHtml } from '../markdown'

describe('markdownToInnerHtml', () => {
  it('escapes raw HTML tags so they render as text', () => {
    const html = markdownToInnerHtml('hello <script>alert(1)</script> world')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('escapes HTML inside inline code instead of injecting it', () => {
    const html = markdownToInnerHtml('try `<img src=x onerror="alert(1)">` now')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
  })

  it('escapes HTML inside fenced code blocks', () => {
    const html = markdownToInnerHtml('```html\n<div onclick="x()">hi</div>\n```')
    expect(html).not.toContain('<div onclick')
    expect(html).toContain('&lt;div onclick=&quot;x()&quot;&gt;hi&lt;/div&gt;')
  })

  it('escapes ampersands once', () => {
    expect(markdownToInnerHtml('a & b')).toContain('a &amp; b')
  })

  it('still renders headings, bold, inline code, and list items', () => {
    const html = markdownToInnerHtml('# Title\n\n**bold** and `code`\n\n- item')
    expect(html).toContain('<h1')
    expect(html).toContain('>Title</h1>')
    expect(html).toContain('<strong')
    expect(html).toContain('>bold</strong>')
    expect(html).toContain('<code')
    expect(html).toContain('>code</code>')
    expect(html).toContain('<li')
    expect(html).toContain('>item</li>')
  })

  it('keeps comparison operators in code readable as entities', () => {
    const html = markdownToInnerHtml('`a < b && b > c`')
    expect(html).toContain('a &lt; b &amp;&amp; b &gt; c')
  })
})
