import { describe, expect, it } from 'vitest'
import { PIECE_IDS } from '@dojo/shared'
import { KATAS } from './katas'
import { assertDemoDatabase, DEMO_SCROLLS, PERSONAS, planHistory, seededRandom } from './seed-demo'

const persona = (key: string) => PERSONAS.find((p) => p.key === key)!

describe('assertDemoDatabase', () => {
  it.each(['postgresql://dojo:dojo@db:5432/dojo_dev', 'postgresql://dojo:dojo@localhost:5432/dojo_demo'])(
    'allows %s',
    (url) => {
      expect(() => assertDemoDatabase(url, 'development')).not.toThrow()
    },
  )

  it('refuses production whatever the database is called', () => {
    expect(() => assertDemoDatabase('postgresql://dojo:dojo@db:5432/dojo_dev', 'production')).toThrow(/production/)
  })

  it('refuses the test database, whose repository tests a seed would break', () => {
    expect(() => assertDemoDatabase('postgresql://dojo:dojo@db:5432/dojo_test', 'test')).toThrow(/dojo_test/)
  })

  it('refuses a remote host', () => {
    expect(() => assertDemoDatabase('postgresql://dojo:dojo@prod.example.com:5432/dojo_dev', undefined)).toThrow(/local/)
  })
})

describe('planHistory', () => {
  it('gives the same plan for the same persona', () => {
    const veteran = persona('veteran')
    expect(planHistory(veteran, seededRandom('veteran'))).toEqual(planHistory(veteran, seededRandom('veteran')))
  })

  it('passes a kata every day of a streak, because only a passed day keeps it alive', () => {
    const master = persona('master')
    const passedDays = new Set(
      planHistory(master, seededRandom('master'))
        .filter((s) => s.outcome === 'passed')
        .map((s) => s.daysAgo),
    )
    for (let day = 1; day <= master.streak; day++) expect(passedDays).toContain(day)
  })

  it('leaves the quiet days of a lapsed persona empty', () => {
    const lapsed = persona('lapsed')
    const plan = planHistory(lapsed, seededRandom('lapsed'))
    expect(plan.length).toBeGreaterThan(0)
    expect(Math.min(...plan.map((s) => s.daysAgo))).toBeGreaterThan(lapsed.quietDays)
  })

  it('reaches every outcome in the veteran history that History filters by', () => {
    const outcomes = new Set(planHistory(persona('veteran'), seededRandom('veteran')).map((s) => s.outcome))
    expect([...outcomes].sort()).toEqual(['expired', 'needs_work', 'no_evaluation', 'passed', 'passed_with_notes'])
  })
})

describe('demo fixtures', () => {
  it('only uses real pieces, a GitHub-sized handle and a demo username', () => {
    for (const p of PERSONAS) {
      expect(p.username).toMatch(/^demo-/)
      expect(p.username.length).toBeLessThanOrEqual(39)
      for (const piece of p.pieces) expect(PIECE_IDS).toContain(piece)
    }
  })

  it('has micro kata for the personas that practise today', () => {
    expect(KATAS.filter((kata) => kata.tags.includes('micro')).length).toBeGreaterThan(0)
  })

  it('registers scrolls in both visibilities', () => {
    expect(DEMO_SCROLLS.map((scroll) => scroll.visibility).sort()).toEqual(['private', 'public', 'public'])
  })
})
