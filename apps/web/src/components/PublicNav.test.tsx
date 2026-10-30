import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PublicNav } from './PublicNav'
import { PublicFooter } from './PublicFooter'

function renderNav(props: Parameters<typeof PublicNav>[0] = {}) {
  render(
    <MemoryRouter>
      <PublicNav {...props} />
    </MemoryRouter>,
  )
  return screen.getByRole('navigation')
}

describe('PublicNav', () => {
  it('sends Sign in straight to GitHub and drops the Enter the dojo CTA', () => {
    const nav = renderNav({ showLinks: false, action: 'sign-in' })

    expect(within(nav).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      expect.stringMatching(/\/auth\/github$/),
    )
    expect(within(nav).queryByRole('link', { name: 'Enter the dojo' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Open source' })).not.toBeInTheDocument()
  })

  it('shows no action at all when the page already carries one', () => {
    const nav = renderNav({ action: 'none' })

    expect(within(nav).queryByRole('link', { name: 'Enter the dojo' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
  })
})

describe('PublicFooter', () => {
  it('carries the project link and the tagline only when asked, and can drop Open source', () => {
    render(
      <MemoryRouter>
        <PublicFooter showOpenSource={false} showProjectSite showTagline />
      </MemoryRouter>,
    )
    const footer = screen.getByRole('contentinfo')

    expect(within(footer).queryByRole('link', { name: 'Open source' })).not.toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: 'Runs on Dojo, open source →' })).toHaveAttribute(
      'href',
      'https://rodacato.github.io/dojo/',
    )
    expect(within(footer).getByText('Not for everyone. Exactly as intended.')).toBeInTheDocument()
  })

  it('links all four public pages by default, without the landing extras', () => {
    render(
      <MemoryRouter>
        <PublicFooter />
      </MemoryRouter>,
    )
    const footer = screen.getByRole('contentinfo')

    for (const name of ['Open source', 'Changelog', 'Terms', 'Privacy']) {
      expect(within(footer).getByRole('link', { name })).toBeInTheDocument()
    }
    expect(within(footer).queryByRole('link', { name: /Runs on Dojo/ })).not.toBeInTheDocument()
  })
})
