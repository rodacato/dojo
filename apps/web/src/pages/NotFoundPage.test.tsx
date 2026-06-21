import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NotFoundPage } from './NotFoundPage'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard" element={<h1>Dashboard screen</h1>} />
        <Route path="/" element={<h1>Landing screen</h1>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  it('renders the 404 heading and copy as the main content', () => {
    renderAt('/totally-missing')
    expect(
      screen.getByRole('heading', { name: /Page not defined/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/The URL you tried doesn't exist/i),
    ).toBeInTheDocument()
  })

  it('surfaces the attempted path from the URL', () => {
    renderAt('/some/deep/missing-path')
    expect(screen.getByText('/some/deep/missing-path')).toBeInTheDocument()
  })

  it('navigates to the dashboard when the primary CTA is clicked', async () => {
    const user = userEvent.setup()
    renderAt('/nope')
    await user.click(screen.getByRole('button', { name: /Enter the dojo/i }))
    expect(
      screen.getByRole('heading', { name: 'Dashboard screen' }),
    ).toBeInTheDocument()
  })

  it('navigates to the landing when the ghost CTA is clicked', async () => {
    const user = userEvent.setup()
    renderAt('/nope')
    await user.click(screen.getByRole('button', { name: /Go to landing/i }))
    expect(
      screen.getByRole('heading', { name: 'Landing screen' }),
    ).toBeInTheDocument()
  })

  it('links the report-URL CTA to the open-source page', () => {
    renderAt('/nope')
    expect(
      screen.getByRole('link', { name: /report this URL/i }),
    ).toHaveAttribute('href', '/open-source')
  })

  it('renders inside the public layout chrome', () => {
    renderAt('/nope')
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText('dojo.notdefined.dev')).toBeInTheDocument()
  })
})
