import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { UserDTO } from '@dojo/shared'
import { EngawaPage } from './EngawaPage'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'

// CodeEditor wraps CodeMirror (heavy, jsdom-hostile). Swap it for a
// textarea that surfaces the controlled `value` so tests can read the
// starter code the page chose for a given runtime.
vi.mock('../components/ui/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (v: string) => void
  }) => (
    <textarea
      data-testid="code-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

// react-resizable-panels touches ResizeObserver at mount and throws in
// jsdom. The panel layout is pure chrome around CodeEditor + OutputPane,
// so render its slots as plain passthrough containers.
vi.mock('react-resizable-panels', () => ({
  Group: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Separator: () => <div />,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Keep real routing (the page reads useParams), but make useNavigate
// observable so we can assert changeLanguage's redirect target.
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Keep the real ApiError class so the page's `instanceof ApiError`
// branches (and describeApiError) exercise real behavior; only the
// network surface is stubbed.
vi.mock('../lib/api', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/api/client')>('../lib/api/client')
  return {
    ApiError: actual.ApiError,
    api: {
      playground: {
        run: vi.fn(),
        askSensei: vi.fn(),
      },
    },
  }
})

const mockedUseAuth = vi.mocked(useAuth)
const mockedRun = vi.mocked(api.playground.run)
const mockedAskSensei = vi.mocked(api.playground.askSensei)

const user: UserDTO = {
  id: 'u1',
  username: 'sensei',
  avatarUrl: 'https://example.test/a.png',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function asAnon() {
  mockedUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })
}

function asUser() {
  mockedUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
}

function renderAt(path = '/engawa') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/engawa" element={<EngawaPage />} />
        <Route path="/engawa/:language" element={<EngawaPage />} />
        {/* changeLanguage navigates to /playground/:lang; mount the page
            there too so it survives the redirect and re-reads the param. */}
        <Route path="/playground/:language" element={<EngawaPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function runResult(over: Partial<Awaited<ReturnType<typeof api.playground.run>>> = {}) {
  return {
    stdout: '',
    stderr: '',
    exitCode: 0,
    runtimeMs: 12,
    timedOut: false,
    ...over,
  }
}

async function* yieldChunks(chunks: string[]): AsyncGenerator<string> {
  for (const c of chunks) yield c
}

// A generator whose first `.next()` rejects — models askSensei failing
// before any token streams. Avoids a dead `yield` after the throw.
function failingAsk(err: unknown): AsyncGenerator<string> {
  return {
    next: () => Promise.reject(err),
    return: (value?: unknown) =>
      Promise.resolve({ done: true, value } as IteratorResult<string>),
    throw: (e?: unknown) => Promise.reject(e),
    [Symbol.asyncIterator]() {
      return this
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  asAnon()
})

describe('EngawaPage', () => {
  // The page renders the editor twice (desktop panel group + mobile
  // stack); both are in the DOM under jsdom, so read the first.
  const editor = () => screen.getAllByTestId('code-editor')[0]!

  it('seeds the runtime from the :language URL param', () => {
    renderAt('/engawa/python')

    expect(screen.getByLabelText('Language')).toHaveValue('python')
    expect(screen.getByLabelText('Version')).toHaveValue('3.12.0')
    expect(editor()).toHaveValue('print("dojo_")\n')
  })

  it('falls back to the first runtime (TypeScript) when no param is given', () => {
    renderAt('/engawa')

    expect(screen.getByLabelText('Language')).toHaveValue('typescript')
    expect(editor()).toHaveValue(
      'const greeting: string = "dojo_"\nconsole.log(greeting)\n',
    )
  })

  it('shows the anonymous chrome: sign-in CTA and the not-graded footer', () => {
    renderAt('/engawa')

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('sandbox · not graded')
    // Ask-the-sensei is an authed-only affordance.
    expect(
      screen.queryByRole('button', { name: 'Ask the sensei' }),
    ).not.toBeInTheDocument()
  })

  it('shows authed chrome instead: no sign-in, kata CTA points at /katas, sensei button present', () => {
    asUser()
    renderAt('/engawa')

    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ask the sensei' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /practice with a kata/i }),
    ).toHaveAttribute('href', '/katas')
  })

  it('runs code: idle → running → success, rendering stdout and the OK chip', async () => {
    const u = userEvent.setup()
    let resolveRun: (v: Awaited<ReturnType<typeof api.playground.run>>) => void = () => {}
    mockedRun.mockReturnValue(
      new Promise((resolve) => {
        resolveRun = resolve
      }),
    )

    renderAt('/engawa/python')

    // Idle pane copy before any run (rendered in both panes).
    expect(screen.getAllByText('output will appear here.').length).toBeGreaterThan(0)
    expect(screen.getByText('Ready')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: /Run/ }))

    // Loading state is distinct: executing copy + the idle copy is gone.
    expect((await screen.findAllByText('executing...')).length).toBeGreaterThan(0)
    expect(screen.queryByText('output will appear here.')).not.toBeInTheDocument()

    resolveRun(runResult({ stdout: 'dojo_\n', exitCode: 0, runtimeMs: 7 }))

    expect((await screen.findAllByText('dojo_')).length).toBeGreaterThan(0)
    expect(screen.getByText(/OK · exit 0/)).toBeInTheDocument()
    expect(screen.queryByText('executing...')).not.toBeInTheDocument()

    expect(mockedRun).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'python',
        version: '3.12.0',
        code: 'print("dojo_")\n',
      }),
    )
  })

  it('renders the error state with the mapped copy when the run rejects', async () => {
    const u = userEvent.setup()
    mockedRun.mockRejectedValue(new ApiError(429, 'rate_limited'))

    renderAt('/engawa')

    await u.click(screen.getByRole('button', { name: /Run/ }))

    expect(
      (
        await screen.findAllByText(
          'You are running code too quickly. Wait a moment and try again.',
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/Error · exit 1/)).toBeInTheDocument()
    // Distinct from the success path — no OK chip leaked.
    expect(screen.queryByText(/OK · exit/)).not.toBeInTheDocument()
  })

  it('changing the language swaps starter code, resets the run, and navigates', async () => {
    const u = userEvent.setup()
    mockedRun.mockResolvedValue(runResult({ stdout: 'x', exitCode: 0 }))

    renderAt('/engawa/typescript')
    expect(editor()).toHaveValue(
      'const greeting: string = "dojo_"\nconsole.log(greeting)\n',
    )

    // Produce a result first so we can prove changeLanguage resets it.
    await u.click(screen.getByRole('button', { name: /Run/ }))
    expect(await screen.findByText(/OK · exit 0/)).toBeInTheDocument()

    await u.selectOptions(screen.getByLabelText('Language'), 'ruby')

    expect(screen.getByLabelText('Language')).toHaveValue('ruby')
    expect(editor()).toHaveValue('puts "dojo_"\n')
    expect(screen.getByLabelText('Version')).toHaveValue('3.0.1')
    // Run state reset back to Ready / idle pane.
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getAllByText('output will appear here.').length).toBeGreaterThan(0)
    // ...and the URL is rewritten to the new runtime.
    expect(mockNavigate).toHaveBeenCalledWith('/playground/ruby', { replace: true })
  })

  it('streams an ask-the-sensei answer in the modal for authed users', async () => {
    const u = userEvent.setup()
    asUser()
    mockedAskSensei.mockReturnValue(yieldChunks(['Recur', 'sion ', 'is...']))

    renderAt('/engawa/python')

    await u.click(screen.getByRole('button', { name: 'Ask the sensei' }))

    const dialog = await screen.findByRole('dialog', { name: 'Ask the sensei' })
    await u.type(
      within(dialog).getByPlaceholderText(/ask anything about the code/i),
      'what is recursion?',
    )
    await u.click(within(dialog).getByRole('button', { name: 'ask' }))

    await waitFor(() =>
      expect(within(dialog).getByText('Recursion is...')).toBeInTheDocument(),
    )
    expect(mockedAskSensei).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'what is recursion?',
        language: 'python',
        code: 'print("dojo_")\n',
      }),
    )
  })

  it('surfaces the daily-limit copy when ask-the-sensei hits a 429', async () => {
    const u = userEvent.setup()
    asUser()
    mockedAskSensei.mockReturnValue(failingAsk(new ApiError(429, 'rate_limited')))

    renderAt('/engawa/python')

    await u.click(screen.getByRole('button', { name: 'Ask the sensei' }))
    const dialog = await screen.findByRole('dialog', { name: 'Ask the sensei' })
    await u.type(
      within(dialog).getByPlaceholderText(/ask anything about the code/i),
      'limit?',
    )
    await u.click(within(dialog).getByRole('button', { name: 'ask' }))

    expect(
      await within(dialog).findByText(
        "you've hit the daily sensei limit, try again tomorrow.",
      ),
    ).toBeInTheDocument()
  })
})
