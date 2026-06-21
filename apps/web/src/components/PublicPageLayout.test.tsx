import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PublicPageLayout } from './PublicPageLayout'

function renderAt(
  path: string,
  props: Partial<Parameters<typeof PublicPageLayout>[0]> = {},
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PublicPageLayout {...props}>
        <p>page body</p>
      </PublicPageLayout>
    </MemoryRouter>,
  )
}

describe('PublicPageLayout', () => {
  it('renders children inside the main landmark, not the chrome', () => {
    renderAt('/')
    const main = screen.getByRole('main')
    expect(within(main).getByText('page body')).toBeInTheDocument()
  })

  it('renders the public nav links and the Enter the dojo CTA by default', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation')
    // nav links plus the wordmark logo link; CTA lives outside the link group
    expect(within(nav).getByRole('link', { name: 'Open source' })).toHaveAttribute(
      'href',
      '/open-source',
    )
    expect(within(nav).getByRole('link', { name: 'Changelog' })).toHaveAttribute(
      'href',
      '/changelog',
    )
    expect(
      within(nav).getByRole('link', { name: 'Enter the dojo' }),
    ).toBeInTheDocument()
  })

  it('hides the CTA when hideCta is set', () => {
    renderAt('/', { hideCta: true })
    expect(
      screen.queryByRole('link', { name: 'Enter the dojo' }),
    ).not.toBeInTheDocument()
    // nav links survive; only the CTA is gated
    const nav = screen.getByRole('navigation')
    expect(
      within(nav).getByRole('link', { name: 'Open source' }),
    ).toBeInTheDocument()
  })

  it('marks the active nav link as current and leaves others muted', () => {
    renderAt('/changelog')
    const nav = screen.getByRole('navigation')
    const changelog = within(nav).getByRole('link', { name: 'Changelog' })
    const openSource = within(nav).getByRole('link', { name: 'Open source' })

    expect(changelog).toHaveClass('text-primary')
    expect(changelog).not.toHaveClass('text-muted')
    expect(openSource).toHaveClass('text-muted')
    expect(openSource).not.toHaveClass('text-primary')
  })

  it('renders footer chrome with legal links distinct from the nav', () => {
    renderAt('/')
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText('dojo.notdefined.dev')).toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/terms',
    )
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    // Terms/Privacy are footer-only, never promoted into the top nav
    const nav = screen.getByRole('navigation')
    expect(within(nav).queryByRole('link', { name: 'Terms' })).not.toBeInTheDocument()
  })
})
