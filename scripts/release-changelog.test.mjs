import { describe, expect, it } from 'vitest'

import { TYPE_ORDER, formatEntry, groupCommits, insertEntry } from './release-changelog.mjs'

const commit = (subject, hash = 'a'.repeat(40)) => ({ subject, hash })

function entryFor(subjects) {
  const { groups, breaking, dropped } = groupCommits(subjects.map((s) => commit(s)))
  return { entry: formatEntry('9.9.9', '2026-09-22', groups, breaking), dropped }
}

describe('release-changelog', () => {
  it('files each type under its label', () => {
    const { entry } = entryFor([
      'feat(scrolls): a new thing',
      'fix(api): a broken thing',
      'docs: a written thing',
    ])

    expect(entry).toMatch(/### Added\n\n- \*\*scrolls:\*\* a new thing/)
    expect(entry).toMatch(/### Fixed\n\n- \*\*api:\*\* a broken thing/)
    expect(entry).toMatch(/### Documentation\n\n- a written thing/)
  })

  it('prints one section per label, not one per type', () => {
    const { entry } = entryFor([
      'perf(db): a faster thing',
      'refactor(api): a tidier thing',
      'style(web): a smaller thing',
      'revert: a reverted thing',
    ])

    expect(entry.match(/### Changed/g)).toHaveLength(1)
    for (const description of [
      'a faster thing',
      'a tidier thing',
      'a smaller thing',
      'a reverted thing',
    ]) {
      expect(entry).toContain(description)
    }
  })

  it('gives security its own section, above Changed', () => {
    const { entry } = entryFor(['perf(db): a faster thing', 'security(api): a closed hole'])

    expect(entry.indexOf('### Security')).toBeLessThan(entry.indexOf('### Changed'))
    expect(entry).toMatch(/### Security\n\n- \*\*api:\*\* a closed hole/)
  })

  // `web:` and `deploy:` are real subjects from this repo's history — scope written as type.
  // They are deliberately unmapped so they surface here instead of being blessed by the map.
  it('reports what it leaves out, and why', () => {
    const { entry, dropped } = entryFor([
      'feat(scrolls): a new thing',
      'web: show the instance host',
      'deploy: drop unread secrets',
      'not a conventional commit at all',
    ])

    expect(dropped).toHaveLength(3)
    expect(entry).not.toContain('show the instance host')

    const reasons = Object.fromEntries(dropped.map((d) => [d.subject, d.why]))
    expect(reasons['web: show the instance host']).toMatch(/unknown type "web"/)
    expect(reasons['deploy: drop unread secrets']).toMatch(/unknown type "deploy"/)
    expect(reasons['not a conventional commit at all']).toMatch(/not a conventional commit/)
  })

  it('drops nothing it can file', () => {
    const { dropped } = entryFor(TYPE_ORDER.map((type) => `${type}(scope): a ${type} thing`))

    expect(dropped).toEqual([])
  })

  it('puts a breaking change first, and keeps it in its own section too', () => {
    const { entry } = entryFor(['feat(api)!: a thing that breaks an install'])

    expect(entry.indexOf('### Breaking Changes')).toBeLessThan(entry.indexOf('### Added'))
    expect(entry.match(/a thing that breaks an install/g)).toHaveLength(2)
  })
})

describe('insertEntry', () => {
  const HISTORICAL = '## Historical sprint log\n\n## Sprint 034 — the one before versions\n\nbody\n'
  const changelog = `# Changelog\n\nblurb\n\n## [Unreleased]\n\n## [0.1.0] - 2026-09-22\n\nbaseline\n\n---\n\n${HISTORICAL}`

  it('inserts below Unreleased and above the previous version', () => {
    const updated = insertEntry(changelog, formatEntry('0.2.0', '2026-10-01', {}, []))

    expect(updated).toContain('## [Unreleased]\n\n## [0.2.0] - 2026-10-01\n\n## [0.1.0]')
    expect(updated.indexOf('## [Unreleased]')).toBeLessThan(updated.indexOf('## [0.2.0]'))
  })

  it('leaves the historical sprint log byte-identical', () => {
    const updated = insertEntry(changelog, formatEntry('0.2.0', '2026-10-01', {}, []))

    expect(updated.slice(updated.indexOf('## Historical sprint log'))).toBe(HISTORICAL)
  })

  it('refuses a changelog it cannot place an entry in', () => {
    expect(() => insertEntry('# Changelog\n\nno heading here\n', 'entry')).toThrow(/Unreleased/)
  })
})
