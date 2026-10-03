import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { RULES } from './rules.js'

const protocol = readFileSync(new URL('../../../docs/scrolls/PROTOCOL.md', import.meta.url), 'utf8')
const sections = new Set([...protocol.matchAll(/^## (\d+)\./gm)].map((match) => match[1]))

describe('RULES', () => {
  it('has unique, kebab-case ids', () => {
    const ids = RULES.map((rule) => rule.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^[a-z]+(-[a-z]+)*$/.test(id))).toBe(true)
  })

  it.each(RULES.map((rule) => [rule.id, rule.section] as const))('%s points at a section of PROTOCOL.md (%s)', (_id, section) => {
    expect(section).toMatch(/^§\d+$/)
    expect(sections.has(section.slice(1))).toBe(true)
  })
})
