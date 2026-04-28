import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Toggle } from '../../components/ui/Toggle'
import { AdminBreadcrumb } from './_form-parts'

interface AdminCourse {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  status: 'draft' | 'published'
  isPublic: boolean
  lessonCount: number
  stepCount: number
  createdAt: string
}

type Busy =
  | { kind: 'seed' }
  | { kind: 'patch'; id: string }
  | { kind: 'wipe'; id: string }
  | null

type Notice = {
  tone: 'ok' | 'err'
  eyebrow: string
  body: string
  at: number
} | null

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[] | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [wipeTarget, setWipeTarget] = useState<AdminCourse | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    const list = await api.getAdminCourses()
    setCourses(list)
  }, [])

  useEffect(() => {
    refresh().catch((e) =>
      setNotice({
        tone: 'err',
        eyebrow: 'Load failed',
        body: asMsg(e),
        at: Date.now(),
      }),
    )
  }, [refresh])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  async function onSeed() {
    setBusy({ kind: 'seed' })
    try {
      const report = await api.seedCourses()
      setNotice({
        tone: 'ok',
        eyebrow: 'Re-seed complete',
        body: `${report.seeded.length} course${report.seeded.length === 1 ? '' : 's'} patched in place.`,
        at: Date.now(),
      })
      await refresh()
    } catch (e) {
      setNotice({
        tone: 'err',
        eyebrow: 'Re-seed failed',
        body: asMsg(e),
        at: Date.now(),
      })
    } finally {
      setBusy(null)
    }
  }

  async function onPatch(
    id: string,
    patch: { isPublic?: boolean; status?: 'draft' | 'published' },
  ) {
    setBusy({ kind: 'patch', id })
    try {
      await api.updateCourse(id, patch)
      await refresh()
    } catch (e) {
      setNotice({
        tone: 'err',
        eyebrow: 'Update failed',
        body: asMsg(e),
        at: Date.now(),
      })
    } finally {
      setBusy(null)
    }
  }

  async function performWipe(course: AdminCourse) {
    setBusy({ kind: 'wipe', id: course.id })
    try {
      await api.wipeCourseContent(course.id)
      setNotice({
        tone: 'ok',
        eyebrow: 'Content wiped',
        body: `${course.title} cleared. Click "Re-seed all" to repopulate.`,
        at: Date.now(),
      })
      await refresh()
    } catch (e) {
      setNotice({
        tone: 'err',
        eyebrow: 'Wipe failed',
        body: asMsg(e),
        at: Date.now(),
      })
    } finally {
      setBusy(null)
      setWipeTarget(null)
    }
  }

  async function copyUrl(slug: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/learn/${slug}`)
  }

  const counts = useMemo(() => {
    const c = { published: 0, draft: 0 }
    for (const course of courses ?? []) {
      if (course.status === 'published') c.published++
      else c.draft++
    }
    return c
  }, [courses])

  const noticeAge = notice ? relativePast(now, notice.at) : null

  return (
    <div className="max-w-7xl">
      <AdminBreadcrumb trail={['ADMIN', 'COURSES']} />

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-primary leading-tight">Courses</h1>
          <div className="mt-1 text-[13px] text-muted">
            <span className="text-success">{counts.published} published</span>
            <span className="mx-2">·</span>
            <span>{counts.draft} draft</span>
            <span className="mx-2">·</span>
            <span>Catalog seeded from <code className="font-mono text-secondary">/apps/api/seed/courses/</code></span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onSeed} loading={busy?.kind === 'seed'}>
          ↻ Re-seed all
        </Button>
      </div>

      {notice && (
        <NoticeBanner
          tone={notice.tone}
          eyebrow={`${notice.eyebrow} · ${noticeAge}`}
          body={notice.body}
          onDismiss={() => setNotice(null)}
        />
      )}

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <colgroup>
              <col />
              <col className="w-28" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-28" />
              <col className="w-44" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <Th>Course</Th>
                <Th>Language</Th>
                <Th align="right">Lessons</Th>
                <Th align="right">Steps</Th>
                <Th align="center">Public</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {courses === null && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted font-mono">
                    Loading_
                  </td>
                </tr>
              )}
              {courses && courses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted text-[13px]">
                    No courses yet. Click <span className="font-mono">Re-seed all</span> to populate from seed files.
                  </td>
                </tr>
              )}
              {courses?.map((c) => {
                const patching = busy?.kind === 'patch' && busy.id === c.id
                const wiping = busy?.kind === 'wipe' && busy.id === c.id
                return (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-b-0 hover:bg-elevated transition-colors"
                  >
                    <td className="px-4 h-14 align-middle">
                      <div className="text-[15px] font-medium text-primary">{c.title}</div>
                      <div className="font-mono text-[11px] text-muted mt-0.5">/learn/{c.slug}</div>
                    </td>
                    <td className="px-4 h-14 align-middle">
                      <span
                        className="inline-block font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm border"
                        style={{
                          color: c.accentColor,
                          borderColor: `${c.accentColor}55`,
                          backgroundColor: `${c.accentColor}1a`,
                        }}
                      >
                        {c.language}
                      </span>
                    </td>
                    <td className="px-4 h-14 align-middle text-right font-mono tabular-nums text-[15px] text-primary">
                      {c.lessonCount}
                    </td>
                    <td className="px-4 h-14 align-middle text-right font-mono tabular-nums text-[15px] text-primary">
                      {c.stepCount}
                    </td>
                    <td className="px-4 h-14 align-middle text-center">
                      <div className="inline-flex">
                        <Toggle
                          checked={c.isPublic}
                          disabled={patching}
                          onChange={(v) => onPatch(c.id, { isPublic: v })}
                          ariaLabel={`${c.isPublic ? 'Make private' : 'Make public'} ${c.title}`}
                        />
                      </div>
                    </td>
                    <td className="px-4 h-14 align-middle">
                      <button
                        type="button"
                        onClick={() =>
                          onPatch(c.id, {
                            status: c.status === 'published' ? 'draft' : 'published',
                          })
                        }
                        disabled={patching}
                        className={`font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm border transition-colors ${
                          c.status === 'published'
                            ? 'bg-success/10 text-success border-success/30 hover:bg-success/15'
                            : 'bg-muted/15 text-secondary border-border hover:border-accent'
                        } ${patching ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {c.status}
                      </button>
                    </td>
                    <td className="px-4 h-14 align-middle text-right">
                      <div className="inline-flex items-center gap-1">
                        <IconAction
                          label="Open course"
                          as={Link}
                          to={`/learn/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalIcon className="w-4 h-4" />
                        </IconAction>
                        <IconAction label="Copy public URL" onClick={() => copyUrl(c.slug)}>
                          <ClipboardIcon className="w-4 h-4" />
                        </IconAction>
                        <IconAction
                          label="Wipe content"
                          tone="danger"
                          onClick={() => setWipeTarget(c)}
                          disabled={wiping || busy !== null}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
        Snapshot diff visible in <Link to="/admin/errors" className="hover:text-secondary transition-colors">Errors</Link>. Re-seeding patches in place; wiping is per-course.
      </div>

      <WipeConfirmModal
        course={wipeTarget}
        wiping={busy?.kind === 'wipe'}
        onCancel={() => setWipeTarget(null)}
        onConfirm={performWipe}
      />
    </div>
  )
}

function NoticeBanner({
  tone,
  eyebrow,
  body,
  onDismiss,
}: {
  tone: 'ok' | 'err'
  eyebrow: string
  body: string
  onDismiss?: () => void
}) {
  const accent = tone === 'ok' ? 'border-l-success' : 'border-l-danger'
  const eyebrowColor = tone === 'ok' ? 'text-success' : 'text-danger'
  return (
    <div
      className={`rounded-md border border-border border-l-4 ${accent} bg-surface px-4 py-3 mb-6 flex items-start justify-between gap-4`}
    >
      <div>
        <div className={`font-mono text-[11px] uppercase tracking-wider mb-1 ${eyebrowColor}`}>
          {eyebrow}
        </div>
        <div className="text-[13px] text-secondary">{body}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="text-muted hover:text-primary transition-colors text-lg leading-none mt-0.5"
        >
          ×
        </button>
      )}
    </div>
  )
}

function WipeConfirmModal({
  course,
  wiping,
  onCancel,
  onConfirm,
}: {
  course: AdminCourse | null
  wiping: boolean
  onCancel: () => void
  onConfirm: (course: AdminCourse) => void
}) {
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (course) {
      setTyped('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [course])

  if (!course) return null

  const matched = typed === course.slug

  return (
    <Modal open onClose={() => !wiping && onCancel()} flow={wiping}>
      <div className="p-8">
        <div className="font-mono text-[11px] uppercase tracking-wider text-danger mb-2">
          Wipe course content
        </div>
        <h2 className="text-[18px] font-semibold text-primary">
          Wipe {course.title}?
        </h2>
        <div className="mt-3 text-[13px] text-secondary leading-relaxed">
          Removes all lessons and steps. Sessions and progress for this course are kept.
          Re-seeding restores content from <code className="font-mono">/apps/api/seed/courses/</code>.
        </div>

        <div className="mt-5">
          <label
            htmlFor="wipe-confirm"
            className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5"
          >
            Type the slug to confirm
          </label>
          <input
            ref={inputRef}
            id="wipe-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={course.slug}
            disabled={wiping}
            autoComplete="off"
            spellCheck={false}
            className="admin-input font-mono"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onCancel} disabled={wiping}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => matched && !wiping && onConfirm(course)}
            disabled={!matched || wiping}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 font-mono uppercase tracking-wider whitespace-nowrap rounded-sm bg-danger text-primary border border-danger text-[13px] transition-colors hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-danger/40 disabled:border-danger/40"
          >
            {wiping ? 'Wiping…' : 'Wipe content'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
}) {
  const a = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <th className={`h-10 px-4 font-mono text-[11px] uppercase tracking-wider text-muted ${a}`}>
      {children}
    </th>
  )
}

interface IconActionBaseProps {
  label: string
  tone?: 'default' | 'danger'
  children: React.ReactNode
  disabled?: boolean
}
type IconActionButtonProps = IconActionBaseProps & {
  as?: 'button'
  onClick: () => void
}
type IconActionLinkProps = IconActionBaseProps & {
  as: typeof Link
  to: string
  target?: string
  rel?: string
}
type IconActionProps = IconActionButtonProps | IconActionLinkProps

function IconAction(props: IconActionProps) {
  const tone = props.tone ?? 'default'
  const baseClass =
    'inline-flex items-center justify-center w-7 h-7 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const toneClass =
    tone === 'danger'
      ? 'text-danger/80 hover:text-danger hover:bg-danger/10'
      : 'text-muted hover:text-primary hover:bg-elevated'
  if ('to' in props) {
    return (
      <Link to={props.to} target={props.target} rel={props.rel} aria-label={props.label} className={`${baseClass} ${toneClass}`}>
        {props.children}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props.label}
      className={`${baseClass} ${toneClass}`}
    >
      {props.children}
    </button>
  )
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4l-9 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 12v8H4V10h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M9 4h6" strokeLinecap="round" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function asMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function relativePast(now: number, target: number): string {
  const diff = Math.max(0, now - target)
  const seconds = Math.round(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}
