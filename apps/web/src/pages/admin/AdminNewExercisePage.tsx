import { type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Difficulty, ExerciseType } from '@dojo/shared'
import { TOPICS } from '@dojo/shared'
import { api } from '../../lib/api'
import { ChipSelect } from '../../components/ui/ChipSelect'
import { ChipInput } from '../../components/ui/ChipInput'

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
  languages: string[]
  tags: string[]
  topics: string[]
  variations: VariationDraft[]
}

const INITIAL: FormState = {
  title: '',
  description: '',
  duration: 20,
  difficulty: 'medium',
  type: 'code',
  languages: [],
  tags: [],
  topics: [],
  variations: [{ ownerRole: '', ownerContext: '' }],
}

export function AdminNewExercisePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateVariation(index: number, field: keyof VariationDraft, value: string) {
    const next = form.variations.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    update('variations', next)
  }

  function addVariation() {
    update('variations', [...form.variations, { ownerRole: '', ownerContext: '' }])
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await api.createExercise({
        title: form.title,
        description: form.description,
        duration: form.duration,
        difficulty: form.difficulty,
        type: form.type,
        languages: form.languages,
        tags: form.tags,
        topics: form.topics,
        variations: form.variations,
      })
      navigate('/admin/exercises')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xl text-primary">New Exercise</h1>
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
            placeholder="The N+1 You Didn't Write"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="admin-input h-48"
            placeholder="Markdown supported. Include code blocks with triple backticks."
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
                <option key={d} value={d}>
                  {d}
                </option>
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
                    placeholder="Senior Rails engineer with 8 years..."
                  />
                </Field>
                <Field label="Owner Context">
                  <textarea
                    value={v.ownerContext}
                    onChange={(e) => updateVariation(i, 'ownerContext', e.target.value)}
                    className="admin-input h-32"
                    placeholder="Evaluate the developer's ability to..."
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.title || !form.description || form.variations.length === 0}
          className="w-full py-3 bg-accent text-primary font-mono rounded-sm hover:bg-accent/90 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save exercise'}
        </button>
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
