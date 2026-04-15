import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

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

type Notice = { kind: 'ok' | 'err'; text: string } | null

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[] | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [notice, setNotice] = useState<Notice>(null)

  const refresh = useCallback(async () => {
    const list = await api.getAdminCourses()
    setCourses(list)
  }, [])

  useEffect(() => {
    refresh().catch((e) => setNotice({ kind: 'err', text: `Failed to load: ${asMsg(e)}` }))
  }, [refresh])

  async function onSeed() {
    setBusy({ kind: 'seed' })
    setNotice(null)
    try {
      const report = await api.seedCourses()
      const summary = report.seeded
        .map((c) => `${c.title} (${c.lessonCount}L/${c.stepCount}S)`)
        .join(', ')
      setNotice({ kind: 'ok', text: `Seeded ${report.seeded.length}: ${summary}` })
      await refresh()
    } catch (e) {
      setNotice({ kind: 'err', text: `Seed failed: ${asMsg(e)}` })
    } finally {
      setBusy(null)
    }
  }

  async function onPatch(
    id: string,
    patch: { isPublic?: boolean; status?: 'draft' | 'published' },
  ) {
    setBusy({ kind: 'patch', id })
    setNotice(null)
    try {
      await api.updateCourse(id, patch)
      await refresh()
    } catch (e) {
      setNotice({ kind: 'err', text: `Update failed: ${asMsg(e)}` })
    } finally {
      setBusy(null)
    }
  }

  async function onWipe(c: AdminCourse) {
    if (!confirm(`Wipe all lessons and steps for "${c.title}"? Re-seeding will repopulate them from code.`)) {
      return
    }
    setBusy({ kind: 'wipe', id: c.id })
    setNotice(null)
    try {
      await api.wipeCourseContent(c.id)
      setNotice({ kind: 'ok', text: `Cleared content of ${c.title}. Click "Re-seed" to repopulate.` })
      await refresh()
    } catch (e) {
      setNotice({ kind: 'err', text: `Wipe failed: ${asMsg(e)}` })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono text-xl text-primary">Courses</h1>
          <p className="text-muted text-xs font-mono mt-1">
            Code-managed catalog — edit in seed-courses* files, then re-seed here.
          </p>
        </div>
        <button
          onClick={onSeed}
          disabled={busy !== null}
          className="px-4 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-wait transition-colors"
        >
          {busy?.kind === 'seed' ? 'seeding...' : '↻ Re-seed all'}
        </button>
      </div>

      {notice && (
        <div
          className={`mb-4 p-3 rounded-sm font-mono text-xs border ${
            notice.kind === 'ok'
              ? 'border-success/40 text-success bg-success/5'
              : 'border-danger/40 text-danger bg-danger/5'
          }`}
        >
          {notice.text}
        </div>
      )}

      {courses === null ? (
        <div className="text-muted font-mono text-sm">Loading...</div>
      ) : courses.length === 0 ? (
        <div className="text-muted font-mono text-sm">
          No courses yet. Click "Re-seed all" to populate from seed files.
        </div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <Th>Title</Th>
                <Th>Language</Th>
                <Th align="right">Lessons</Th>
                <Th align="right">Steps</Th>
                <Th align="center">Public</Th>
                <Th align="center">Status</Th>
                <Th>Preview</Th>
                <Th>Content</Th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => {
                const patching = busy?.kind === 'patch' && busy.id === c.id
                const wiping = busy?.kind === 'wipe' && busy.id === c.id
                return (
                  <tr key={c.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-sm text-primary">{c.title}</div>
                      <div className="font-mono text-xs text-muted">/{c.slug}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm"
                        style={{
                          backgroundColor: c.accentColor + '20',
                          color: c.accentColor,
                        }}
                      >
                        {c.language}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-secondary">
                      {c.lessonCount}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-secondary">
                      {c.stepCount}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Toggle
                        checked={c.isPublic}
                        disabled={patching}
                        onChange={(v) => onPatch(c.id, { isPublic: v })}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() =>
                          onPatch(c.id, {
                            status: c.status === 'published' ? 'draft' : 'published',
                          })
                        }
                        disabled={patching}
                        className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm transition-colors ${
                          c.status === 'published'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-muted/10 text-muted'
                        } ${patching ? 'opacity-50 cursor-wait' : 'hover:bg-accent/20'}`}
                      >
                        {c.status}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/learn/${c.slug}`}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        open →
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onWipe(c)}
                        disabled={wiping || busy !== null}
                        className="font-mono text-xs text-danger/80 hover:text-danger disabled:opacity-50 disabled:cursor-wait"
                      >
                        {wiping ? 'wiping...' : 'wipe'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
}) {
  const a = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <th className={`${a} px-4 py-2 text-muted font-mono text-xs uppercase`}>{children}</th>
  )
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-muted/40'
      } ${disabled ? 'opacity-50 cursor-wait' : ''}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-surface transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function asMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
