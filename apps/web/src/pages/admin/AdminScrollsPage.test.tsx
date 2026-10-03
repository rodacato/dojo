import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ScrollEntryDTO } from '@dojo/shared'
import { AdminScrollsPage } from './AdminScrollsPage'
import { api, ApiError } from '../../lib/api'
import type * as ApiModule from '../../lib/api'
import { toast } from '../../components/ui/Toast'

vi.mock('../../lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof ApiModule>()
  return {
    ...original,
    api: {
      getAdminScrolls: vi.fn(),
      registerScroll: vi.fn(),
      updateScroll: vi.fn(),
      deleteScroll: vi.fn(),
    },
  }
})
vi.mock('../../components/ui/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))


const mockedApi = vi.mocked(api)
const mockedToast = vi.mocked(toast)

const manifest = {
  id: 'pattern-circuit',
  version: '0.1.0',
  protocol: 0 as const,
  entry: 'https://scrolls.example.com/pattern-circuit/',
  locales: ['en'],
  title: { en: 'Pattern Circuit' },
  description: { en: 'Learn patterns' },
  programmingLanguages: ['ruby'],
  units: [{ id: 'u1' }],
  capabilities: [],
}

function entry(overrides: Partial<ScrollEntryDTO> = {}): ScrollEntryDTO {
  return {
    id: '3f0c6d0e-0d0e-4a1b-9c1e-0a5a1d2b3c4d',
    slug: 'pattern-circuit',
    manifest,
    status: 'draft',
    visibility: 'public',
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminScrollsPage />
    </MemoryRouter>,
  )
}

async function fillForm(slug: string, manifestText: string) {
  fireEvent.change(screen.getByLabelText('Slug'), { target: { value: slug } })
  fireEvent.change(screen.getByLabelText(/Manifest/), { target: { value: manifestText } })
  await userEvent.click(screen.getByRole('button', { name: /^register$/i }))
}

beforeEach(() => {
  vi.spyOn(globalThis.navigator, 'language', 'get').mockReturnValue('en-US')
  mockedApi.getAdminScrolls.mockResolvedValue([entry()])
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('AdminScrollsPage — list', () => {
  it('shows a row per scroll with title, slug, origin, status and visibility', async () => {
    mockedApi.getAdminScrolls.mockResolvedValue([
      entry(),
      entry({ id: '3f0c6d0e-0d0e-4a1b-9c1e-0a5a1d2b3c4e', slug: 'domain-wall', status: 'published', visibility: 'private' }),
    ])
    renderPage()
    const rows = (await screen.findAllByRole('row')).slice(1)

    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByRole('link', { name: 'Pattern Circuit' })).toHaveAttribute('href', '/scrolls/pattern-circuit')
    expect(within(rows[0]!).getByText('https://scrolls.example.com')).toBeInTheDocument()
    expect(within(rows[0]!).getByText('draft')).toBeInTheDocument()
    expect(within(rows[0]!).getByRole('switch', { name: 'Public: pattern-circuit' })).toBeChecked()
    expect(within(rows[1]!).getByText('published')).toBeInTheDocument()
    expect(within(rows[1]!).getByRole('switch', { name: 'Public: domain-wall' })).not.toBeChecked()
  })

  it('shows an empty state when nothing is registered', async () => {
    mockedApi.getAdminScrolls.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No scrolls registered yet.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('offers a retry when the list fails to load', async () => {
    mockedApi.getAdminScrolls.mockRejectedValueOnce(new Error('down'))
    renderPage()
    expect(await screen.findByText(/Failed to load scrolls/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})

describe('AdminScrollsPage — register', () => {
  it('registers a valid manifest, clears the form and reloads', async () => {
    mockedApi.registerScroll.mockResolvedValue(entry())
    renderPage()
    await screen.findByRole('table')

    await fillForm('pattern-circuit', JSON.stringify(manifest))

    await waitFor(() => expect(mockedApi.registerScroll).toHaveBeenCalledTimes(1))
    expect(mockedApi.registerScroll).toHaveBeenCalledWith({
      slug: 'pattern-circuit',
      manifest,
      status: 'draft',
      visibility: 'public',
    })
    await waitFor(() => expect(mockedApi.getAdminScrolls).toHaveBeenCalledTimes(2))
    expect(screen.getByLabelText('Slug')).toHaveValue('')
    expect(mockedToast.success).toHaveBeenCalled()
  })

  it('reports invalid JSON without calling the API', async () => {
    renderPage()
    await screen.findByRole('table')
    await fillForm('pattern-circuit', '{ nope')

    expect(await screen.findByRole('alert')).toHaveTextContent(/not valid JSON/)
    expect(mockedApi.registerScroll).not.toHaveBeenCalled()
  })

  it('reports schema problems with their path without calling the API', async () => {
    renderPage()
    await screen.findByRole('table')
    await fillForm('Bad Slug', JSON.stringify({ ...manifest, units: [] }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('slug:')
    expect(alert).toHaveTextContent('manifest.units:')
    expect(mockedApi.registerScroll).not.toHaveBeenCalled()
  })

  it('rejects an entry that is not https before it reaches the server', async () => {
    renderPage()
    await screen.findByRole('table')
    await fillForm('pattern-circuit', JSON.stringify({ ...manifest, entry: 'http://scrolls.example.com/' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('manifest.entry: must be an absolute https URL')
    expect(mockedApi.registerScroll).not.toHaveBeenCalled()
  })

  it('shows the origin rejection from the server and keeps the form content', async () => {
    mockedApi.registerScroll.mockRejectedValue(new ApiError(422, 'Entry origin is not in SCROLL_FRAME_ORIGINS'))
    renderPage()
    await screen.findByRole('table')
    await fillForm('pattern-circuit', JSON.stringify(manifest))

    expect(await screen.findByRole('alert')).toHaveTextContent('Entry origin is not in SCROLL_FRAME_ORIGINS')
    expect(screen.getByLabelText('Slug')).toHaveValue('pattern-circuit')
    expect(mockedToast.success).not.toHaveBeenCalled()
  })

  it('links the error message to the manifest field', async () => {
    renderPage()
    await screen.findByRole('table')
    await fillForm('pattern-circuit', '{ nope')
    await screen.findByRole('alert')
    expect(screen.getByLabelText(/Manifest/)).toHaveAttribute('aria-describedby', 'scroll-errors')
  })
})

describe('AdminScrollsPage — publish and visibility', () => {
  it('publishes a draft', async () => {
    mockedApi.updateScroll.mockResolvedValue(entry({ status: 'published' }))
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Publish pattern-circuit' }))

    expect(mockedApi.updateScroll).toHaveBeenCalledWith(entry().id, { status: 'published' })
    await waitFor(() => expect(mockedApi.getAdminScrolls).toHaveBeenCalledTimes(2))
  })

  it('unpublishes a published scroll', async () => {
    mockedApi.getAdminScrolls.mockResolvedValue([entry({ status: 'published' })])
    mockedApi.updateScroll.mockResolvedValue(entry())
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Unpublish pattern-circuit' }))

    expect(mockedApi.updateScroll).toHaveBeenCalledWith(entry().id, { status: 'draft' })
  })

  it('makes a public scroll private', async () => {
    mockedApi.updateScroll.mockResolvedValue(entry({ visibility: 'private' }))
    renderPage()
    await userEvent.click(await screen.findByRole('switch', { name: 'Public: pattern-circuit' }))
    expect(mockedApi.updateScroll).toHaveBeenCalledWith(entry().id, { visibility: 'private' })
  })

  it('makes a private scroll public', async () => {
    mockedApi.getAdminScrolls.mockResolvedValue([entry({ visibility: 'private' })])
    mockedApi.updateScroll.mockResolvedValue(entry())
    renderPage()
    await userEvent.click(await screen.findByRole('switch', { name: 'Public: pattern-circuit' }))
    expect(mockedApi.updateScroll).toHaveBeenCalledWith(entry().id, { visibility: 'public' })
  })

  it('toasts the server error when an update fails', async () => {
    mockedApi.updateScroll.mockRejectedValue(new ApiError(422, 'bad manifest'))
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Publish pattern-circuit' }))

    await waitFor(() => expect(mockedToast.error).toHaveBeenCalledWith('Update failed', 'bad manifest'))
  })
})

describe('AdminScrollsPage — delete', () => {
  it('asks for confirmation and deletes nothing when cancelled', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Delete pattern-circuit' }))

    expect(screen.getByText('Delete pattern-circuit?')).toBeInTheDocument()
    expect(mockedApi.deleteScroll).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Delete pattern-circuit?')).not.toBeInTheDocument()
    expect(mockedApi.deleteScroll).not.toHaveBeenCalled()
  })

  it('deletes after confirmation and reloads the list', async () => {
    mockedApi.deleteScroll.mockResolvedValue(undefined)
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Delete pattern-circuit' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockedApi.deleteScroll).toHaveBeenCalledWith(entry().id))
    await waitFor(() => expect(screen.queryByText('Delete pattern-circuit?')).not.toBeInTheDocument())
    expect(mockedApi.getAdminScrolls).toHaveBeenCalledTimes(2)
  })

  it('toasts the error when delete fails', async () => {
    mockedApi.deleteScroll.mockRejectedValue(new ApiError(500, 'boom'))
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Delete pattern-circuit' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockedToast.error).toHaveBeenCalledWith('Delete failed', 'boom'))
  })
})
