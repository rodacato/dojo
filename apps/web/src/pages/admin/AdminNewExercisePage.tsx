import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import {
  AdminBreadcrumb,
  type BasicsValue,
  BasicsFields,
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
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const titleInvalid = form.title.trim().length === 0
  const variationsInvalid = form.variations.length === 0 || form.variations.every((v) => !v.ownerRole.trim())
  const validationMessage = (() => {
    if (!showErrors) return null
    const issues: string[] = []
    if (titleInvalid) issues.push('Title is required.')
    if (variationsInvalid) issues.push('At least 1 variation must have an owner role.')
    if (issues.length === 0) return null
    return `${issues.length} field${issues.length > 1 ? 's' : ''} require attention. ${issues.join(' ')}`
  })()

  function setBasics(next: BasicsValue) {
    setForm((prev) => ({ ...prev, ...next }))
  }

  function updateVariation(index: number, field: keyof VariationDraft, value: string) {
    setForm((prev) => ({
      ...prev,
      variations: prev.variations.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  function addVariation() {
    setForm((prev) => ({
      ...prev,
      variations: [...prev.variations, { ownerRole: '', ownerContext: '' }],
    }))
  }

  function removeVariation(index: number) {
    setForm((prev) => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    if (titleInvalid || variationsInvalid) {
      setShowErrors(true)
      return
    }
    setSaving(true)
    setSubmitError(null)
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
      setSubmitError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!saving) void handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="max-w-4xl">
      <AdminBreadcrumb trail={['ADMIN', 'EXERCISES', 'NEW']} />

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/exercises')}
            className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-secondary transition-colors mb-2"
          >
            ← Back to exercises
          </button>
          <h1 className="text-[24px] font-semibold text-primary leading-tight">New exercise</h1>
        </div>
        <div className="flex items-center gap-3 mt-7">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/exercises')}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving}>
            Save as draft
          </Button>
        </div>
      </div>

      {validationMessage && <ValidationBanner message={validationMessage} />}
      {submitError && <ValidationBanner message={submitError} />}

      <div className="space-y-8">
        <SectionCard
          eyebrow="Basics"
          rightSlot={
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted bg-elevated border border-border px-2 py-0.5 rounded-sm">
              Draft
            </span>
          }
        >
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
                Variations
              </div>
              <div className="font-mono text-[11px] text-muted mt-1">
                Each variation is a sensei persona evaluating the same kata. The user gets one per session.
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

        <SectionCard eyebrow="Status">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted bg-elevated border border-border px-2 py-0.5 rounded-sm">
              Draft
            </span>
            <span className="text-[13px] text-muted">
              New exercises start as draft. Publish from Edit after preview.
            </span>
          </div>
        </SectionCard>
      </div>

      <StickyFormBar hint="⌘+S to save">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/exercises')}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} loading={saving}>
          Save as draft
        </Button>
      </StickyFormBar>
    </div>
  )
}
