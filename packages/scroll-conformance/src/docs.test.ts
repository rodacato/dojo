import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { RULES } from './rules.js'

const doc = readFileSync(new URL('../../../docs/scrolls/CONFORMANCE.md', import.meta.url), 'utf8')

const rulesSection = doc.split(/^## /m).find((section) => section.startsWith('Rules')) ?? ''
const documented = [...rulesSection.matchAll(/^\| `([a-z-]+)` \| (§\d+) \|/gm)].map((match) => ({
  id: match[1],
  section: match[2],
}))

describe('docs/scrolls/CONFORMANCE.md', () => {
  it('lists exactly the rule ids that exist in code', () => {
    expect(documented.map((rule) => rule.id).sort()).toEqual(RULES.map((rule) => rule.id).sort())
  })

  it('gives each rule the section the code says it enforces', () => {
    for (const rule of RULES) {
      expect(documented.find((row) => row.id === rule.id)?.section).toBe(rule.section)
    }
  })

  it('documents every command line option', () => {
    for (const flag of ['--url', '--manifest', '--drive', '--json', '--timeout', '--settle']) {
      expect(doc).toContain(`\`${flag}`)
    }
  })

  it('is linked from the authoring guide', () => {
    const authoring = readFileSync(new URL('../../../docs/scrolls/AUTHORING.md', import.meta.url), 'utf8')
    expect(authoring).toContain('CONFORMANCE.md')
  })
})
