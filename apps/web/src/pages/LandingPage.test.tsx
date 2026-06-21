import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { LandingPage } from './LandingPage'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: {
    getRepoStats: vi.fn(),
    requestAccess: vi.fn(),
  },
}))

const mockedUseAuth = vi.mocked(useAuth)
const mockedGetRepoStats = vi.mocked(api.getRepoStats)
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
  // Default: repo-stats endpoint never settles unless a test overrides it.
  mockedGetRepoStats.mockReturnValue(new Promise(() => {}))
})

describe('LandingPage — auth gating', () => {
  it('shows only the loading cursor while auth resolves, not the hero', () => {
    asLoading()
    renderAt()

    // The hero headline (ghost copy) must NOT be present during loading.
    expect(
      screen.queryByText(
        'The dojo for developers who still have something to prove.',
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
        name: 'The dojo for developers who still have something to prove.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Why it exists' }),
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
      screen.queryByRole('heading', { name: 'Why it exists' }),
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
      screen.getByText(/Request access below or use an invitation link\./),
    ).toBeInTheDocument()
  })

  it('falls back to the generic GitHub-login message for an unknown error code', () => {
    asAnon()
    renderAt('/?error=boom')

    expect(
      screen.getByText(/GitHub login failed\./),
    ).toBeInTheDocument()
  })

  it('renders no banner when there is no error param', () => {
    asAnon()
    renderAt('/')

    expect(screen.queryByText(/Your session expired/)).not.toBeInTheDocument()
    expect(screen.queryByText(/GitHub login failed/)).not.toBeInTheDocument()
  })
})

describe('LandingPage — GitHub repo stats', () => {
  it('renders fetched stars/forks/lang once getRepoStats resolves', async () => {
    asAnon()
    mockedGetRepoStats.mockResolvedValue({
      stars: 128,
      forks: 9,
      language: 'Rust',
    })
    renderAt()

    expect(mockedGetRepoStats).toHaveBeenCalledTimes(1)
    // Initial zeroed state, then the resolved values replace it.
    expect(await screen.findByText('128')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('Rust')).toBeInTheDocument()
  })

  it('keeps the zeroed fallback when getRepoStats rejects', async () => {
    asAnon()
    mockedGetRepoStats.mockRejectedValue(new Error('network'))
    renderAt()

    // Default state: stars 0, forks 0, lang TypeScript. Give the rejected
    // promise a tick to flush, then assert the fallback survived.
    await waitFor(() => expect(mockedGetRepoStats).toHaveBeenCalled())
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.queryByText('Rust')).not.toBeInTheDocument()
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
})

describe('LandingPage — open source strip', () => {
  it('copies the clone command and flips the button label on click', async () => {
    asAnon()
    const writeText = vi.fn().mockResolvedValue(undefined)
    const ue = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderAt()

    const copyBtn = screen.getByRole('button', { name: 'Copy clone command' })
    await ue.click(copyBtn)

    expect(writeText).toHaveBeenCalledWith(
      'git clone https://github.com/rodacato/dojo.git',
    )
    // aria-label flips to "Copied" after the click.
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
  })

  it('links the GitHub strip out to the public repo', () => {
    asAnon()
    renderAt()

    const repoLinks = screen
      .getAllByRole('link', { name: /github/i })
      .filter((el) => el.getAttribute('href') === 'https://github.com/rodacato/dojo')
    expect(repoLinks.length).toBeGreaterThan(0)
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
