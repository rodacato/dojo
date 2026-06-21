import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InviteRedeemPage } from './InviteRedeemPage'
import { API_URL } from '../lib/config'

function renderAtToken(token: string) {
  return render(
    <MemoryRouter initialEntries={[`/invite/${token}`]}>
      <Routes>
        <Route path="/invite/:token" element={<InviteRedeemPage />} />
        <Route path="/" element={<div>landing page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('InviteRedeemPage', () => {
  it('renders the invitation headline and core copy', () => {
    renderAtToken('abcd1234efgh5678')

    expect(
      screen.getByRole('heading', { name: /you've been invited to the dojo\./i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Invitation')).toBeInTheDocument()
    expect(
      screen.getByText(/Sign in with GitHub\. We don't email you\. We don't track you\./i),
    ).toBeInTheDocument()
  })

  it('builds the GitHub CTA href from the token URL param', () => {
    renderAtToken('abcd1234efgh5678')

    const cta = screen.getByRole('link', { name: /enter the dojo\./i })
    expect(cta).toHaveAttribute('href', `${API_URL}/auth/invite/abcd1234efgh5678`)
  })

  it('truncates a long token in the fine print but keeps the full token in the CTA', () => {
    renderAtToken('abcd1234efgh5678')

    expect(screen.getByText('abcd…5678')).toBeInTheDocument()
    expect(screen.queryByText('abcd1234efgh5678')).not.toBeInTheDocument()

    const cta = screen.getByRole('link', { name: /enter the dojo\./i })
    expect(cta).toHaveAttribute('href', `${API_URL}/auth/invite/abcd1234efgh5678`)
  })

  it('shows a short token verbatim without truncation', () => {
    renderAtToken('short9')

    expect(screen.getByText('short9')).toBeInTheDocument()
    expect(screen.queryByText(/…/)).not.toBeInTheDocument()
  })

  it('links Terms, Privacy, and the landing page', () => {
    renderAtToken('abcd1234efgh5678')

    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    expect(screen.getByRole('link', { name: /read what dojo is\./i })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
