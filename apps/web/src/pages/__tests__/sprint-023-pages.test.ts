import { describe, expect, it } from 'vitest'

/**
 * Sprint 023 happy-path coverage for renamed and new pages.
 *
 * These are smoke-import tests: each one verifies that the page module
 * loads without errors (no broken imports, no syntax errors, no missing
 * named exports) and that the expected component is callable.
 *
 * A full React render test would require @testing-library/react + jsdom,
 * which web does not currently set up. Once that infra lands, upgrade
 * each `it` to actually `render(<Page />)` and assert key text shows up.
 * For now this catches the common refactor-break classes — renamed file,
 * removed component, wrong export name — which is the dominant risk
 * after a 150-file rename.
 */

const pages = [
  { name: 'BeltsPage', loader: () => import('../BeltsPage') },
  { name: 'KumitePlaceholderPage', loader: () => import('../KumitePlaceholderPage') },
  { name: 'EngawaPage', loader: () => import('../EngawaPage') },
  { name: 'ScrollsPage', loader: () => import('../ScrollsPage') },
  { name: 'ScrollPlayerPage', loader: () => import('../ScrollPlayerPage') },
  { name: 'ScrollSharePage', loader: () => import('../ScrollSharePage') },
  { name: 'KatasPage', loader: () => import('../KatasPage') },
  { name: 'KataActivePage', loader: () => import('../KataActivePage') },
  { name: 'LandingPage', loader: () => import('../LandingPage') },
  { name: 'DashboardPage', loader: () => import('../DashboardPage') },
] as const

describe('Sprint 023 pages — import smoke', () => {
  for (const { name, loader } of pages) {
    it(`${name} exports a callable component`, async () => {
      const mod = (await loader()) as Record<string, unknown>
      expect(typeof mod[name]).toBe('function')
    })
  }
})

const adminPages = [
  { name: 'AdminKatasPage', loader: () => import('../admin/AdminKatasPage') },
  { name: 'AdminNewKataPage', loader: () => import('../admin/AdminNewKataPage') },
  { name: 'AdminEditKataPage', loader: () => import('../admin/AdminEditKataPage') },
  { name: 'AdminScrollsPage', loader: () => import('../admin/AdminScrollsPage') },
] as const

describe('Sprint 023 admin pages — import smoke', () => {
  for (const { name, loader } of adminPages) {
    it(`${name} exports a callable component`, async () => {
      const mod = (await loader()) as Record<string, unknown>
      expect(typeof mod[name]).toBe('function')
    })
  }
})

describe('Sprint 023 API client — surface', () => {
  it('exposes `scrolls` namespace with the renamed endpoints', async () => {
    const { scrolls } = await import('../../lib/api/scrolls')
    expect(typeof scrolls.getScrolls).toBe('function')
    expect(typeof scrolls.getScroll).toBe('function')
    expect(typeof scrolls.trackProgress).toBe('function')
  })

  it('exposes `profile.getBelts` for the BeltsPage', async () => {
    const { profile } = await import('../../lib/api/profile')
    expect(typeof profile.getBelts).toBe('function')
  })

  it('does NOT expose getLeaderboard (route deleted in S023)', async () => {
    const { profile } = await import('../../lib/api/profile')
    expect((profile as Record<string, unknown>)['getLeaderboard']).toBeUndefined()
  })
})
