import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerScrollSchema, type ScrollEntryDTO, type UpdateScrollInput } from '@dojo/shared'
import { api } from '../../lib/api'
import { useAsync } from '../../hooks/useAsync'
import { scrollOriginOf } from '../../lib/scrollHost'
import { pickLocalized, preferredLocale } from '../../lib/scrollLocale'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Toggle } from '../../components/ui/Toggle'
import { toast } from '../../components/ui/Toast'
import { useIsMobile } from '../../hooks/useIsMobile'
import { AdminBreadcrumb } from './_form-parts'

const FIELD_LABEL = 'block font-mono text-xs uppercase tracking-wider text-secondary mb-1.5'

function validateRegistration(slug: string, manifestText: string): { errors: string[]; input?: ReturnType<typeof registerScrollSchema.parse> } {
  let manifest: unknown
  try {
    manifest = JSON.parse(manifestText)
  } catch (err) {
    return { errors: [`Manifest is not valid JSON: ${err instanceof Error ? err.message : 'parse error'}`] }
  }
  const parsed = registerScrollSchema.safeParse({ slug, manifest })
  if (!parsed.success) {
    return { errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`) }
  }
  if (!scrollOriginOf(parsed.data.manifest.entry)) {
    return { errors: ['manifest.entry: must be an absolute https URL'] }
  }
  return { errors: [], input: parsed.data }
}

export function AdminScrollsPage() {
  const { data: scrolls, error: loadError, reload } = useAsync(() => api.getAdminScrolls(), [])
  const [slug, setSlug] = useState('')
  const [manifestText, setManifestText] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [registering, setRegistering] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ScrollEntryDTO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const locale = preferredLocale()
  const isMobile = useIsMobile()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (registering) return
    const { errors: found, input } = validateRegistration(slug.trim(), manifestText)
    setErrors(found)
    if (!input) return
    setRegistering(true)
    try {
      await api.registerScroll(input)
      setSlug('')
      setManifestText('')
      toast.success('Scroll registered', 'It starts as a draft. Publish it when it is ready.')
      reload()
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to register the scroll'])
    } finally {
      setRegistering(false)
    }
  }

  async function handleUpdate(scroll: ScrollEntryDTO, patch: UpdateScrollInput) {
    try {
      await api.updateScroll(scroll.id, patch)
      reload()
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : 'Failed to update the scroll')
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await api.deleteScroll(pendingDelete.id)
      setPendingDelete(null)
      reload()
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Failed to delete the scroll')
    } finally {
      setDeleting(false)
    }
  }

  const published = scrolls?.filter((scroll) => scroll.status === 'published').length ?? 0

  return (
    <div className="max-w-5xl">
      <AdminBreadcrumb trail={['ADMIN', 'SCROLLS']} />

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-primary leading-tight">Scrolls</h1>
        <div className="mt-1 text-sm text-secondary">
          Register external scrolls by their manifest. The entry origin must be allowed by the instance.
          {scrolls && (
            <>
              {' '}
              <span className="text-success-text">{published} published</span>
              <span className="mx-2">·</span>
              <span>{scrolls.length - published} draft</span>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleRegister} noValidate className="rounded-md border border-border bg-surface p-4 md:p-6 mb-6">
        <div className="font-mono text-xs uppercase tracking-wider text-secondary mb-4">Register scroll</div>
        <div className="mb-4">
          <label htmlFor="scroll-slug" className={FIELD_LABEL}>Slug</label>
          <input
            id="scroll-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="pattern-circuit"
            autoComplete="off"
            spellCheck={false}
            className="admin-input font-mono"
          />
        </div>
        <div>
          <label htmlFor="scroll-manifest" className={FIELD_LABEL}>Manifest (scroll.json)</label>
          <textarea
            id="scroll-manifest"
            value={manifestText}
            onChange={(e) => setManifestText(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder='{ "id": "pattern-circuit", "version": "0.1.0", "protocol": 0, "entry": "https://…" }'
            aria-describedby={errors.length > 0 ? 'scroll-errors' : undefined}
            className="admin-input font-mono"
          />
        </div>

        {errors.length > 0 && (
          <div
            id="scroll-errors"
            role="alert"
            className="mt-4 rounded-sm border border-danger/40 bg-danger/10 px-4 py-2 font-mono text-sm text-danger-text"
          >
            <ul className="space-y-1">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button type="submit" size="md" className="max-md:w-full max-md:h-11" loading={registering}>
            Register
          </Button>
        </div>
      </form>

      {loadError !== null && (
        <div role="alert" className="mb-6 rounded-sm border border-danger/40 bg-danger/10 px-4 py-2 font-mono text-sm text-danger-text">
          Failed to load scrolls.{' '}
          <button type="button" onClick={reload} className="underline">
            Try again
          </button>
        </div>
      )}

      {scrolls === null && loadError === null && (
        <div role="status" className="px-4 py-10 text-center text-secondary font-mono">
          Loading_
        </div>
      )}

      {scrolls?.length === 0 && (
        <EmptyState
          eyebrow="Empty · Scrolls"
          headline="No scrolls registered yet."
          microcopy="Paste a manifest above to register the first one."
        />
      )}

      {scrolls && scrolls.length > 0 && isMobile && (
        <ul className="flex flex-col gap-3">
          {scrolls.map((scroll) => (
            <li key={scroll.id} className="rounded-md border border-border bg-surface p-4 flex flex-col gap-3">
              <div>
                <Link to={`/scrolls/${scroll.slug}`} className="text-base font-medium text-primary hover:underline">
                  {pickLocalized(scroll.manifest.title, scroll.manifest.locales, locale)}
                </Link>
                <div className="font-mono text-xs text-secondary">{scroll.slug} · v{scroll.manifest.version}</div>
              </div>
              <div className="font-mono text-xs text-secondary break-all">{scrollOriginOf(scroll.manifest.entry) ?? '—'}</div>
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={scroll.status} />
                <span className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wider text-secondary">
                  Public
                  <Toggle
                    checked={scroll.visibility === 'public'}
                    onChange={(next) => handleUpdate(scroll, { visibility: next ? 'public' : 'private' })}
                    ariaLabel={`Public: ${scroll.slug}`}
                  />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 *:h-11">
                <ScrollActions scroll={scroll} onToggleStatus={handleUpdate} onDelete={setPendingDelete} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {scrolls && scrolls.length > 0 && !isMobile && (
        <div className="rounded-md border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Scroll</Th>
                  <Th>Origin</Th>
                  <Th>Status</Th>
                  <Th>Public</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {scrolls.map((scroll) => (
                  <tr key={scroll.id} className="border-b border-border last:border-b-0 hover:bg-elevated transition-colors">
                    <td className="px-4 h-14 align-middle">
                      <Link to={`/scrolls/${scroll.slug}`} className="text-primary hover:underline transition-colors">
                        {pickLocalized(scroll.manifest.title, scroll.manifest.locales, locale)}
                      </Link>
                      <div className="font-mono text-xs text-secondary">{scroll.slug} · v{scroll.manifest.version}</div>
                    </td>
                    <td className="px-4 h-14 align-middle font-mono text-xs text-secondary break-all">
                      {scrollOriginOf(scroll.manifest.entry) ?? '—'}
                    </td>
                    <td className="px-4 h-14 align-middle">
                      <StatusBadge status={scroll.status} />
                    </td>
                    <td className="px-4 h-14 align-middle">
                      <Toggle
                        checked={scroll.visibility === 'public'}
                        onChange={(next) => handleUpdate(scroll, { visibility: next ? 'public' : 'private' })}
                        ariaLabel={`Public: ${scroll.slug}`}
                      />
                    </td>
                    <td className="px-4 h-14 align-middle text-right whitespace-nowrap space-x-2">
                      <ScrollActions scroll={scroll} onToggleStatus={handleUpdate} onDelete={setPendingDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        eyebrow="Delete scroll"
        tone="red"
        title={`Delete ${pendingDelete?.slug ?? ''}?`}
        primaryLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      >
        <p>It disappears from the catalog and its page stops working. The scroll's own app is not touched.</p>
      </ConfirmModal>
    </div>
  )
}

function ScrollActions({
  scroll,
  onToggleStatus,
  onDelete,
}: Readonly<{
  scroll: ScrollEntryDTO
  onToggleStatus: (scroll: ScrollEntryDTO, patch: UpdateScrollInput) => void
  onDelete: (scroll: ScrollEntryDTO) => void
}>) {
  const published = scroll.status === 'published'
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggleStatus(scroll, { status: published ? 'draft' : 'published' })}
        aria-label={`${published ? 'Unpublish' : 'Publish'} ${scroll.slug}`}
      >
        {published ? 'Unpublish' : 'Publish'}
      </Button>
      <Button variant="destructive" size="sm" onClick={() => onDelete(scroll)} aria-label={`Delete ${scroll.slug}`}>
        Delete
      </Button>
    </>
  )
}

function Th({ children, align = 'left' }: Readonly<{ children: React.ReactNode; align?: 'left' | 'right' }>) {
  return (
    <th className={`h-10 px-4 font-mono text-xs uppercase tracking-wider text-secondary ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}

function StatusBadge({ status }: Readonly<{ status: ScrollEntryDTO['status'] }>) {
  const style =
    status === 'published'
      ? 'bg-success/10 text-success-text border-success/30'
      : 'bg-muted/15 text-secondary border-border'
  return (
    <span className={`font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm border ${style}`}>
      {status}
    </span>
  )
}
