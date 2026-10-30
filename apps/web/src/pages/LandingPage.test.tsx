import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ScrollEntryDTO, UserDTO } from '@dojo/shared'
import { LandingPage } from './LandingPage'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { ApiError } from '../lib/api/client'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: {
    getScrolls: vi.fn(),
    requestAccess: vi.fn(),
  },
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedGetScrolls = vi.mocked(api.getScrolls)
const mockedRequestAccess = vi.mocked(api.requestAccess)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function asAnon() {
  mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
}

function asLoading() {
  mockedUseAuth.mockReturnValue({ user: null, loading: true, logout: vi.fn() })
}

function asAuthed() {
  mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
}

function renderAt(entry = '/') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<div>dashboard route</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetScrolls.mockResolvedValue([])
})

describe('LandingPage — auth gating', () => {
  it('shows only the loading cursor while auth resolves, not the hero', () => {
    asLoading()
    renderAt()

    expect(
      screen.queryByText(
        'Practice thinking for yourself.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    // The loading view renders an aria-hidden cursor glyph.
    expect(document.querySelector('.animate-cursor')).not.toBeNull()
  })

  it('renders the landing content for an anonymous visitor', () => {
    asAnon()
    renderAt()

    expect(
      screen.getByRole('heading', {
        name: 'Practice thinking for yourself.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'What is here' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('dashboard route')).not.toBeInTheDocument()
  })

  it('redirects an authenticated user to the dashboard instead of rendering the landing', async () => {
    asAuthed()
    renderAt()

    await waitFor(() => {
      expect(screen.getByText('dashboard route')).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('heading', { name: 'What is here' }),
    ).not.toBeInTheDocument()
  })
})

describe('LandingPage — auth error banner', () => {
  it('shows the session-expired message when ?error=session_expired', () => {
    asAnon()
    renderAt('/?error=session_expired')

    expect(
      screen.getByText('Your session expired. Sign in again to continue.'),
    ).toBeInTheDocument()
  })

  it('shows the invite-required message when ?error=invite_required', () => {
    asAnon()
    renderAt('/?error=invite_required')

    expect(
      screen.getByText(/Ask the person who runs it for an invitation, or request one below\./),
    ).toBeInTheDocument()
  })

  it('falls back to the generic GitHub-login message for an unknown error code', () => {
    asAnon()
    renderAt('/?error=boom')

    expect(
      screen.getByText(/GitHub sign-in failed\./),
    ).toBeInTheDocument()
  })

  it('renders no banner when there is no error param', () => {
    asAnon()
    renderAt('/')

    expect(screen.queryByText(/Your session expired/)).not.toBeInTheDocument()
    expect(screen.queryByText(/GitHub sign-in failed/)).not.toBeInTheDocument()
  })
})

describe('LandingPage — what is here', () => {
  const patternCircuit = {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'pattern-circuit',
    manifest: { title: { en: 'Pattern Circuit' }, description: { en: 'Design patterns' }, locales: ['en'] },
  } as unknown as ScrollEntryDTO

  it('lists the scrolls this instance has published, linked to each one', async () => {
    asAnon()
    mockedGetScrolls.mockResolvedValue([patternCircuit])
    renderAt()

    const scrolls = await screen.findByRole('list', { name: 'Scrolls' })
    expect(within(scrolls).getByRole('link', { name: 'Pattern Circuit' })).toHaveAttribute(
      'href',
      '/scrolls/pattern-circuit',
    )
  })

  it('shows no scrolls block when the instance has none or the request fails', async () => {
    asAnon()
    mockedGetScrolls.mockRejectedValue(new Error('network'))
    renderAt()

    await waitFor(() => expect(mockedGetScrolls).toHaveBeenCalled())
    expect(screen.queryByRole('list', { name: 'Scrolls' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Today's kata" })).toBeInTheDocument()
  })
})

describe('LandingPage — request access form', () => {
  it('submits the trimmed handle and reason, then shows the received confirmation', async () => {
    asAnon()
    mockedRequestAccess.mockResolvedValue({ ok: true })
    const ue = userEvent.setup()
    renderAt()

    await ue.type(screen.getByPlaceholderText('@yourhandle'), '  octocat  ')
    await ue.type(
      screen.getByPlaceholderText('Why do you want to enter the dojo?'),
      '  I want in  ',
    )
    await ue.click(screen.getByRole('button', { name: 'Submit_request' }))

    expect(mockedRequestAccess).toHaveBeenCalledWith('octocat', 'I want in')
    expect(await screen.findByText('[ Received ]')).toBeInTheDocument()
    // The form fields are gone once the confirmation replaces the form.
    expect(screen.queryByPlaceholderText('@yourhandle')).not.toBeInTheDocument()
  })

  it('does not submit and keeps the button disabled when the handle is empty', async () => {
    asAnon()
    renderAt()

    const submit = screen.getByRole('button', { name: 'Submit_request' })
    expect(submit).toBeDisabled()
    expect(mockedRequestAccess).not.toHaveBeenCalled()
  })

  it('surfaces an error and stays on the form when requestAccess rejects', async () => {
    asAnon()
    mockedRequestAccess.mockRejectedValue(new Error('500'))
    const ue = userEvent.setup()
    renderAt()

    await ue.type(screen.getByPlaceholderText('@yourhandle'), 'octocat')
    await ue.click(screen.getByRole('button', { name: 'Submit_request' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Didn't go through/)
    // Form is still present (not replaced by the received confirmation).
    expect(screen.getByPlaceholderText('@yourhandle')).toBeInTheDocument()
    expect(screen.queryByText('[ Received ]')).not.toBeInTheDocument()
  })

  it('tells the visitor to ask in person when the instance takes no requests (503)', async () => {
    asAnon()
    mockedRequestAccess.mockRejectedValue(new ApiError(503, 'Access request channel not available'))
    const ue = userEvent.setup()
    renderAt()

    await ue.type(screen.getByPlaceholderText('@yourhandle'), 'octocat')
    await ue.click(screen.getByRole('button', { name: 'Submit_request' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Ask the person who runs it.')
    expect(alert).not.toHaveTextContent(/Try again/)
  })
})

describe('LandingPage — an instance, not the project', () => {
  it('leads with signing in to this instance', () => {
    asAnon()
    renderAt()

    expect(screen.getByRole('link', { name: 'Sign in with GitHub' }).getAttribute('href')).toMatch(
      /\/auth\/github$/,
    )
  })

  it('carries no project marketing and does not claim to be the author instance', () => {
    asAnon()
    renderAt()

    expect(screen.queryByText(/git clone/)).not.toBeInTheDocument()
    expect(screen.queryByText(/reference instance/)).not.toBeInTheDocument()
    expect(screen.queryByText(/dojo kata today/)).not.toBeInTheDocument()
  })

  it('points to the project site from the footer', () => {
    asAnon()
    renderAt()

    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: /Runs on Dojo/ })).toHaveAttribute(
      'href',
      'https://rodacato.github.io/dojo/',
    )
  })
})

describe('LandingPage — footer chrome', () => {
  it('renders the legal and changelog links in the footer', () => {
    asAnon()
    renderAt()

    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/terms',
    )
    expect(
      within(footer).getByRole('link', { name: 'Privacy' }),
    ).toHaveAttribute('href', '/privacy')
  })
})
