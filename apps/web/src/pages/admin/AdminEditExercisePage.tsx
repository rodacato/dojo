import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Difficulty, ExerciseType } from '@dojo/shared'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Toggle } from '../../components/ui/Toggle'
import { PageLoader } from '../../components/PageLoader'
import {
  AdminBreadcrumb,
  type BasicsValue,
  BasicsFields,
  FormField,
  SectionCard,
  StickyFormBar,
  ValidationBanner,
  VariationCardItem,
} from './_form-parts'

interface VariationDraft {
  ownerRole: string
  ownerContext: string
}

interface FormState extends BasicsValue {
  status: string
  adminNotes: string
  variations: VariationDraft[]
}

interface FeedbackData {
  total: number
  clarity: Record<string, number>
  timing: Record<string, number>
  evaluation: Record<string, number>
  notes: Array<{ note: string; variationId: string; submittedAt: string }>
  byVariation: Record<
    string,
    {
      total: number
      clarity: Record<string, number>
      timing: Record<string, number>
      evaluation: Record<string, number>
    }
  >
}

export function AdminEditExercisePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState | null>(null)
  const initialRef = useRef<FormState | null>(null)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [variationLabels, setVariationLabels] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getAdminExercise(id).then((ex) => {
      const next: FormState = {
        title: ex.title,
        description: ex.description,
        duration: ex.duration,
        difficulty: ex.difficulty as Difficulty,
        type: ex.type as ExerciseType,
        status: ex.status,
        languages: ex.languages,
        tags: ex.tags,
        topics: ex.topics,
        adminNotes: ((ex as Record<string, unknown>).adminNotes as string) ?? '',
        variations: ex.variations.map((v) => ({
          ownerRole: v.ownerRole,
          ownerContext: v.ownerContext,
        })),
      }
      setForm(next)
      initialRef.current = next
      const labels: Record<string, string> = {}
      ex.variations.forEach((v, i) => {
        labels[v.id] = `VAR ${i + 1}`
      })
      setVariationLabels(labels)
    })
    api.getExerciseFeedback(id).then(setFeedback).catch((err) => {
      console.error('Failed to fetch exercise feedback:', err)
    })
  }, [id])

  const dirty = useMemo(() => {
    if (!form || !initialRef.current) return false
    return JSON.stringify(form) !== JSON.stringify(initialRef.current)
  }, [form])

  if (!form) return <PageLoader />

  const titleInvalid = form.title.trim().length === 0
  const variationsInvalid =
    form.variations.length === 0 || form.variations.every((v) => !v.ownerRole.trim())
  const validationMessage = (() => {
    if (!showErrors) return null
    const issues: string[] = []
    if (titleInvalid) issues.push('Title is required.')
    if (variationsInvalid) issues.push('At least 1 variation must have an owner role.')
    if (issues.length === 0) return null
    return `${issues.length} field${issues.length > 1 ? 's' : ''} require attention. ${issues.join(' ')}`
  })()

  const archived = form.status === 'archived'
  const published = form.status === 'published'

  function setBasics(next: BasicsValue) {
    setForm((prev) => (prev ? { ...prev, ...next } : prev))
  }

  function setStatus(next: string) {
    setForm((prev) => (prev ? { ...prev, status: next } : prev))
  }

  function setAdminNotes(value: string) {
    setForm((prev) => (prev ? { ...prev, adminNotes: value } : prev))
  }

  function updateVariation(index: number, field: keyof VariationDraft, value: string) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            variations: prev.variations.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
          }
        : prev,
    )
  }

  function addVariation() {
    setForm((prev) =>
      prev ? { ...prev, variations: [...prev.variations, { ownerRole: '', ownerContext: '' }] } : prev,
    )
  }

  function removeVariation(index: number) {
    setForm((prev) =>
      prev ? { ...prev, variations: prev.variations.filter((_, i) => i !== index) } : prev,
    )
  }

  async function handleSave() {
    if (!form || !id) return
    if (titleInvalid || variationsInvalid) {
      setShowErrors(true)
      return
    }
    setSaving(true)
    setSubmitError(null)
    try {
      await api.updateExercise(id, {
        title: form.title,
        description: form.description,
        duration: form.duration,
        difficulty: form.difficulty,
        type: form.type,
        status: form.status,
        languages: form.languages,
        tags: form.tags,
        topics: form.topics,
        adminNotes: form.adminNotes || null,
        variations: form.variations,
      })
      navigate('/admin/exercises')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!id || archiving) return
    if (!confirm('Archive this exercise? It will be hidden from the catalog but data is preserved.')) return
    setArchiving(true)
    try {
      await api.archiveExercise(id)
      navigate('/admin/exercises')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to archive')
      setArchiving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <AdminBreadcrumb trail={['ADMIN', 'EXERCISES', `EDIT — ${form.title || 'Untitled'}`]} />

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/exercises')}
            className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-secondary transition-colors mb-2"
          >
            ← Back to exercises
          </button>
          <h1 className="text-[24px] font-semibold text-primary leading-tight">
            {form.title || 'Untitled exercise'}
          </h1>
        </div>
        <div className="flex items-center gap-3 mt-7">
          {!archived && (
            <Button variant="destructive" size="sm" onClick={handleArchive} loading={archiving}>
              Archive
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/exercises')}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving}>
            {dirty && <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
            Save changes
          </Button>
        </div>
      </div>

      {validationMessage && <ValidationBanner message={validationMessage} />}
      {submitError && <ValidationBanner message={submitError} />}

      <div className="space-y-8">
        <div className="rounded-md border border-border bg-surface px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Status</span>
            <StatusPill status={form.status} />
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Make public
            </span>
            <Toggle
              checked={published}
              disabled={archived}
              onChange={(next) => setStatus(next ? 'published' : 'draft')}
              ariaLabel="Make public"
            />
          </div>
        </div>

        <SectionCard eyebrow="Basics">
          <BasicsFields
            value={form}
            onChange={setBasics}
            titleError={showErrors && titleInvalid}
          />
        </SectionCard>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                Variations · {form.variations.length}
              </div>
              <div className="font-mono text-[11px] text-muted mt-1">
                Each variation is a sensei persona. The user gets one per session.
              </div>
            </div>
            {form.variations.length < 3 && (
              <button
                type="button"
                onClick={addVariation}
                className="font-mono text-[11px] uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
              >
                + Add variation
              </button>
            )}
          </div>
          <div className="space-y-4">
            {form.variations.map((v, i) => (
              <VariationCardItem
                key={i}
                index={i}
                ownerRole={v.ownerRole}
                ownerContext={v.ownerContext}
                onChange={(field, value) => updateVariation(i, field, value)}
                onRemove={form.variations.length > 1 ? () => removeVariation(i) : undefined}
              />
            ))}
          </div>
        </section>

        <SectionCard eyebrow="Admin notes">
          <FormField label="Internal notes" hint="Not shown to users.">
            <textarea
              value={form.adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Why this exercise exists, what to watch for, who tested it..."
              rows={4}
              className="admin-input font-mono"
            />
          </FormField>
        </SectionCard>

        {feedback && feedback.total > 0 && (
          <FeedbackPanel feedback={feedback} variationLabels={variationLabels} />
        )}
      </div>

      <StickyFormBar hint={dirty ? 'Unsaved changes · ⌘+S to save' : '⌘+S to save'}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/exercises')}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </StickyFormBar>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-success/10 text-success border-success/30',
    draft: 'bg-muted/15 text-secondary border-border',
    archived: 'bg-danger/10 text-danger border-danger/30',
  }
  return (
    <span
      className={`font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
        styles[status] ?? styles['draft']
      }`}
    >
      {status}
    </span>
  )
}

const CLARITY_WEIGHTS: Record<string, number> = { clear: 5, somewhat_unclear: 3, confusing: 1 }
const TIMING_WEIGHTS: Record<string, number> = { about_right: 5, too_short: 2, too_long: 3 }
const FAIRNESS_WEIGHTS: Record<string, number> = {
  fair_and_relevant: 5,
  too_generic: 3,
  missed_the_point: 1,
}

function score(distribution: Record<string, number>, weights: Record<string, number>) {
  let total = 0
  let weighted = 0
  for (const [key, count] of Object.entries(distribution)) {
    const w = weights[key]
    if (w == null) continue
    total += count
    weighted += w * count
  }
  return total === 0 ? null : { value: weighted / total, votes: total }
}

function tone(value: number | null): 'emerald' | 'indigo' | 'amber' | 'red' | 'muted' {
  if (value == null) return 'muted'
  if (value >= 4.5) return 'emerald'
  if (value >= 3.5) return 'indigo'
  if (value >= 2.5) return 'amber'
  return 'red'
}

function FeedbackPanel({
  feedback,
  variationLabels,
}: {
  feedback: FeedbackData
  variationLabels: Record<string, string>
}) {
  const clarity = score(feedback.clarity, CLARITY_WEIGHTS)
  const timing = score(feedback.timing, TIMING_WEIGHTS)
  const fairness = score(feedback.evaluation, FAIRNESS_WEIGHTS)

  const variations = Object.entries(feedback.byVariation)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Learner feedback · {feedback.total} sessions
        </div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Last 30 days
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SignalCard label="Clarity" score={clarity} />
        <SignalCard label="Timing" score={timing} />
        <SignalCard label="Fairness" score={fairness} />
      </div>

      {variations.length > 0 && (
        <div className="rounded-md border border-border bg-surface overflow-hidden mb-6">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <ThSm>Variation</ThSm>
                <ThSm align="right">Sessions</ThSm>
                <ThSm align="right">Clarity</ThSm>
                <ThSm align="right">Timing</ThSm>
                <ThSm align="right">Fairness</ThSm>
              </tr>
            </thead>
            <tbody>
              {variations.map(([vId, vData]) => {
                const c = score(vData.clarity, CLARITY_WEIGHTS)
                const t = score(vData.timing, TIMING_WEIGHTS)
                const f = score(vData.evaluation, FAIRNESS_WEIGHTS)
                return (
                  <tr key={vId} className="border-b border-border last:border-b-0">
                    <td className="px-4 h-12 align-middle font-mono text-[11px] uppercase tracking-wider text-secondary">
                      {variationLabels[vId] ?? vId.slice(0, 8)}
                    </td>
                    <td className="px-4 h-12 align-middle text-right font-mono tabular-nums text-primary">
                      {vData.total}
                    </td>
                    <Td score={c} />
                    <Td score={t} />
                    <Td score={f} />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {feedback.notes.length > 0 && (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-3">
            Recent notes
          </div>
          <div className="space-y-3">
            {feedback.notes.slice(0, 4).map((n, i) => (
              <div
                key={i}
                className="rounded-md border border-border bg-page p-4"
              >
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2">
                  Anonymous · {new Date(n.submittedAt).toISOString().slice(0, 10)} ·{' '}
                  {variationLabels[n.variationId] ?? 'VAR ?'}
                </div>
                <div className="text-[13px] text-secondary leading-relaxed">{n.note}</div>
              </div>
            ))}
          </div>
          {feedback.notes.length > 4 && (
            <div className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
              {feedback.notes.length - 4} more notes
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function SignalCard({
  label,
  score,
}: {
  label: string
  score: { value: number; votes: number } | null
}) {
  const t = tone(score?.value ?? null)
  const fill = score ? Math.min(100, Math.max(0, (score.value / 5) * 100)) : 0
  const barColor = TONE_BAR[t]
  const valueColor = TONE_VALUE[t]
  return (
    <div className="rounded-md border border-border bg-surface p-4 flex flex-col gap-3 h-30">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono font-bold text-[32px] leading-none ${valueColor}`}>
          {score ? score.value.toFixed(1) : '—'}
        </span>
        <span className="text-[13px] text-muted">/ 5</span>
      </div>
      <div className="h-1 rounded-sm bg-page overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${fill}%` }}
        />
      </div>
      <div className="font-mono text-[11px] text-muted">
        {score ? `${score.votes} votes · last 30d` : 'no votes yet'}
      </div>
    </div>
  )
}

const TONE_BAR: Record<ReturnType<typeof tone>, string> = {
  emerald: 'bg-success',
  indigo: 'bg-accent',
  amber: 'bg-warning',
  red: 'bg-danger',
  muted: 'bg-border',
}

const TONE_VALUE: Record<ReturnType<typeof tone>, string> = {
  emerald: 'text-success',
  indigo: 'text-primary',
  amber: 'text-warning',
  red: 'text-danger',
  muted: 'text-muted',
}

function ThSm({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`h-10 px-4 font-mono text-[11px] uppercase tracking-wider text-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function Td({ score }: { score: { value: number; votes: number } | null }) {
  const t = tone(score?.value ?? null)
  return (
    <td
      className={`px-4 h-12 align-middle text-right font-mono tabular-nums ${TONE_VALUE[t]}`}
    >
      {score ? score.value.toFixed(1) : '—'}
    </td>
  )
}
