import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Difficulty, ExerciseType } from '@dojo/shared'
import { TOPICS } from '@dojo/shared'
import { api } from '../../lib/api'
import { ChipSelect } from '../../components/ui/ChipSelect'
import { ChipInput } from '../../components/ui/ChipInput'
import { PageLoader } from '../../components/PageLoader'

interface VariationDraft {
  ownerRole: string
  ownerContext: string
}

interface FormState {
  title: string
  description: string
  duration: number
  difficulty: Difficulty
  type: ExerciseType
  status: string
  languages: string[]
  tags: string[]
  topics: string[]
  adminNotes: string
  variations: VariationDraft[]
}

interface FeedbackData {
  total: number
  clarity: Record<string, number>
  timing: Record<string, number>
  evaluation: Record<string, number>
  notes: Array<{ note: string; variationId: string; submittedAt: string }>
  byVariation: Record<string, { total: number; clarity: Record<string, number>; timing: Record<string, number>; evaluation: Record<string, number> }>
}

export function AdminEditExercisePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState | null>(null)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [variationMap, setVariationMap] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.getAdminExercise(id).then((ex) => {
      setForm({
        title: ex.title,
        description: ex.description,
        duration: ex.duration,
        difficulty: ex.difficulty as Difficulty,
        type: ex.type as ExerciseType,
        status: ex.status,
        languages: ex.languages,
        tags: ex.tags,
        topics: ex.topics,
        adminNotes: (ex as Record<string, unknown>).adminNotes as string ?? '',
        variations: ex.variations.map((v) => ({
          ownerRole: v.ownerRole,
          ownerContext: v.ownerContext,
        })),
      })
      const vMap: Record<string, string> = {}
      ex.variations.forEach((v, i) => { vMap[v.id] = `Variation ${i + 1}` })
      setVariationMap(vMap)
    })
    api.getExerciseFeedback(id).then(setFeedback).catch((err) => { console.error('Failed to fetch exercise feedback:', err) })
  }, [id])

  if (!form) return <PageLoader />

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  function updateVariation(index: number, field: keyof VariationDraft, value: string) {
    if (!form) return
    const next = form.variations.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    update('variations', next)
  }

  function addVariation() {
    if (!form) return
    update('variations', [...form.variations, { ownerRole: '', ownerContext: '' }])
  }

  async function handleSave() {
    if (!form || !id) return
    setSaving(true)
    setError(null)
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
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!id || !confirm('Archive this exercise? It will be removed from the catalog.')) return
    setArchiving(true)
    try {
      await api.archiveExercise(id)
      navigate('/admin/exercises')
    } catch {
      setArchiving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xl text-primary">Edit Exercise</h1>
        <button
          onClick={() => navigate('/admin/exercises')}
          className="text-muted font-mono text-sm hover:text-secondary"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-sm text-danger text-sm font-mono">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="admin-input"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="admin-input h-48"
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) => update('type', e.target.value as ExerciseType)}
              className="admin-input"
            >
              <option value="code">CODE</option>
              <option value="chat">CHAT</option>
              <option value="whiteboard">WHITEBOARD</option>
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) => update('difficulty', e.target.value as Difficulty)}
              className="admin-input"
            >
              <option value="easy">EASY</option>
              <option value="medium">MEDIUM</option>
              <option value="hard">HARD</option>
            </select>
          </Field>
          <Field label="Duration (min)">
            <select
              value={form.duration}
              onChange={(e) => update('duration', Number(e.target.value))}
              className="admin-input"
            >
              {[10, 15, 20, 30, 45].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Topics">
          <ChipSelect
            options={TOPICS}
            selected={form.topics}
            onChange={(topics) => update('topics', topics)}
            placeholder="Select topics..."
          />
        </Field>

        <Field label="Languages">
          <ChipInput
            value={form.languages}
            onChange={(v) => update('languages', v)}
            placeholder="Add language (Enter)..."
          />
        </Field>

        <Field label="Tags">
          <ChipInput
            value={form.tags}
            onChange={(v) => update('tags', v)}
            placeholder="Add tag (Enter)..."
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-muted text-xs font-mono uppercase tracking-wider">
              Variations
            </label>
            {form.variations.length < 3 && (
              <button
                onClick={addVariation}
                className="text-accent font-mono text-xs hover:text-accent/80"
              >
                + Add variation
              </button>
            )}
          </div>
          <div className="space-y-4">
            {form.variations.map((v, i) => (
              <div key={i} className="p-4 bg-surface border border-border rounded-sm space-y-3">
                <div className="text-muted text-xs font-mono">Variation {i + 1}</div>
                <Field label="Owner Role">
                  <input
                    value={v.ownerRole}
                    onChange={(e) => updateVariation(i, 'ownerRole', e.target.value)}
                    className="admin-input"
                  />
                </Field>
                <Field label="Owner Context">
                  <textarea
                    value={v.ownerContext}
                    onChange={(e) => updateVariation(i, 'ownerContext', e.target.value)}
                    className="admin-input h-32"
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Notes */}
        <Field label="Admin Notes (internal)">
          <textarea
            value={form.adminNotes}
            onChange={(e) => update('adminNotes', e.target.value)}
            placeholder="Internal notes about edit decisions, feedback responses..."
            className="admin-input h-24"
          />
        </Field>

        {/* Feedback Section */}
        {feedback && feedback.total > 0 && (
          <div className="border border-border/40 rounded-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs font-mono uppercase tracking-wider">
                Kata Feedback ({feedback.total} sessions)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SignalBar label="Description clarity" data={feedback.clarity} labels={{ clear: 'Clear', somewhat_unclear: 'Unclear', confusing: 'Confusing' }} colors={{ clear: 'text-success', somewhat_unclear: 'text-warning', confusing: 'text-danger' }} />
              <SignalBar label="Time limit" data={feedback.timing} labels={{ about_right: 'Right', too_short: 'Too short', too_long: 'Too long' }} colors={{ about_right: 'text-success', too_short: 'text-danger', too_long: 'text-warning' }} />
              <SignalBar label="Evaluation" data={feedback.evaluation} labels={{ fair_and_relevant: 'Fair', too_generic: 'Generic', missed_the_point: 'Missed' }} colors={{ fair_and_relevant: 'text-success', too_generic: 'text-warning', missed_the_point: 'text-danger' }} />
            </div>

            {/* By variation */}
            {Object.keys(feedback.byVariation).length > 1 && (
              <div className="border-t border-border/30 pt-3">
                <p className="text-muted text-[10px] font-mono uppercase tracking-wider mb-2">by variation</p>
                {Object.entries(feedback.byVariation).map(([vId, vData]) => (
                  <div key={vId} className="flex items-center justify-between text-xs py-1">
                    <span className="text-secondary font-mono">{variationMap[vId] ?? vId.slice(0, 8)}</span>
                    <span className="text-muted font-mono">
                      {vData.total} sessions
                      {vData.evaluation?.['missed_the_point'] ? ` · ${vData.evaluation['missed_the_point']} missed` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {feedback.notes.length > 0 && (
              <div className="border-t border-border/30 pt-3 space-y-2">
                <p className="text-muted text-[10px] font-mono uppercase tracking-wider">notes</p>
                {feedback.notes.map((n, i) => (
                  <div key={i} className="text-xs text-secondary bg-page p-2 rounded-sm">
                    <span className="text-muted/50 font-mono text-[10px] mr-2">
                      {new Date(n.submittedAt).toLocaleDateString()}
                    </span>
                    {n.note}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !form.title || !form.description || form.variations.length === 0}
            className="flex-1 py-3 bg-accent text-primary font-mono rounded-sm hover:bg-accent/90 disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Update exercise'}
          </button>
          {form.status !== 'archived' && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="px-4 py-3 border border-danger/40 text-danger font-mono text-sm rounded-sm hover:bg-danger/10 disabled:opacity-40"
            >
              {archiving ? '...' : 'Archive'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-muted text-xs font-mono uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function SignalBar({
  label,
  data,
  labels,
  colors,
}: {
  label: string
  data: Record<string, number>
  labels: Record<string, string>
  colors: Record<string, string>
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null

  return (
    <div>
      <p className="text-muted text-[10px] font-mono uppercase mb-1.5">{label}</p>
      <div className="space-y-1">
        {entries.map(([key, count]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className={colors[key] ?? 'text-secondary'}>{labels[key] ?? key}</span>
            <span className="font-mono text-muted">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
