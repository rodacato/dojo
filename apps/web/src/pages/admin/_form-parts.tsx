import type { ReactNode } from 'react'
import type { Difficulty, ExerciseType } from '@dojo/shared'
import { TOPICS } from '@dojo/shared'
import { ChipSelect } from '../../components/ui/ChipSelect'
import { ChipInput } from '../../components/ui/ChipInput'

const VARIATION_ACCENTS = [
  'border-l-accent',
  'border-l-type-chat',
  'border-l-type-whiteboard',
]

export function AdminBreadcrumb({ trail }: { trail: string[] }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-4">
      {trail.join(' / ')}
    </div>
  )
}

export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
        {label}
      </label>
      {children}
      {(hint || error) && (
        <div
          className={`text-[11px] mt-1.5 font-mono ${
            error ? 'text-danger' : 'text-muted'
          }`}
        >
          {error ?? hint}
        </div>
      )}
    </div>
  )
}

export function SectionCard({
  eyebrow,
  rightSlot,
  children,
}: {
  eyebrow: string
  rightSlot?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-md border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {eyebrow}
        </div>
        {rightSlot}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

export interface BasicsValue {
  title: string
  description: string
  type: ExerciseType
  difficulty: Difficulty
  duration: number
  topics: string[]
  languages: string[]
  tags: string[]
}

export function BasicsFields({
  value,
  onChange,
  titleError,
}: {
  value: BasicsValue
  onChange: (next: BasicsValue) => void
  titleError?: boolean
}) {
  const set = <K extends keyof BasicsValue>(key: K, v: BasicsValue[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <>
      <FormField
        label="Title *"
        error={titleError ? 'Title is required.' : undefined}
      >
        <input
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Refactor a 200-line useEffect"
          className={`admin-input ${titleError ? 'border-danger focus:border-danger focus:ring-danger/30' : ''}`}
        />
      </FormField>

      <FormField label="Description" hint="Markdown supported. Code blocks render with syntax highlight.">
        <textarea
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Describe the problem, constraints, and expected outcome..."
          rows={6}
          className="admin-input font-mono"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Type">
          <select
            value={value.type}
            onChange={(e) => set('type', e.target.value as ExerciseType)}
            className="admin-input"
          >
            <option value="code">CODE</option>
            <option value="chat">CHAT</option>
            <option value="whiteboard">WHITEBOARD</option>
          </select>
        </FormField>
        <FormField label="Difficulty">
          <select
            value={value.difficulty}
            onChange={(e) => set('difficulty', e.target.value as Difficulty)}
            className="admin-input"
          >
            <option value="easy">EASY</option>
            <option value="medium">MEDIUM</option>
            <option value="hard">HARD</option>
          </select>
        </FormField>
        <FormField label="Duration (min)">
          <select
            value={value.duration}
            onChange={(e) => set('duration', Number(e.target.value))}
            className="admin-input"
          >
            {[10, 15, 20, 30, 45, 60].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Topics">
        <ChipSelect
          options={TOPICS}
          selected={value.topics}
          onChange={(topics) => set('topics', topics)}
          placeholder="Type to add (e.g. useEffect, n+1, hooks)..."
        />
      </FormField>

      <FormField label="Languages">
        <ChipInput
          value={value.languages}
          onChange={(v) => set('languages', v)}
          placeholder="typescript, sql, python..."
        />
      </FormField>

      <FormField label="Tags">
        <ChipInput
          value={value.tags}
          onChange={(v) => set('tags', v)}
          placeholder="senior, frontend, performance..."
        />
      </FormField>
    </>
  )
}

export function VariationCardItem({
  index,
  ownerRole,
  ownerContext,
  onChange,
  onRemove,
}: {
  index: number
  ownerRole: string
  ownerContext: string
  onChange: (field: 'ownerRole' | 'ownerContext', value: string) => void
  onRemove?: () => void
}) {
  const accent = VARIATION_ACCENTS[index] ?? VARIATION_ACCENTS[0]
  return (
    <div className={`rounded-md border border-border bg-surface border-l-2 ${accent} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          Variation {index + 1}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-danger transition-colors"
          >
            Remove
          </button>
        )}
      </div>
      <div className="space-y-4">
        <FormField label="Owner role">
          <input
            value={ownerRole}
            onChange={(e) => onChange('ownerRole', e.target.value)}
            placeholder="[Senior DBA — 12 yrs in PostgreSQL]"
            className="admin-input font-mono"
          />
        </FormField>
        <FormField label="Context for the LLM">
          <textarea
            value={ownerContext}
            onChange={(e) => onChange('ownerContext', e.target.value)}
            placeholder="Tell the sensei what to focus on, what hints to give, what bias to avoid."
            rows={4}
            className="admin-input font-mono"
          />
        </FormField>
      </div>
    </div>
  )
}

export function ValidationBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-danger/40 border-l-4 border-l-danger bg-surface p-4 mb-6">
      <div className="font-mono text-[11px] uppercase tracking-wider text-danger mb-1">
        Validation
      </div>
      <div className="text-[13px] text-secondary">{message}</div>
    </div>
  )
}

export function StickyFormBar({
  hint,
  children,
}: {
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="sticky bottom-0 -mx-8 mt-8 px-8 py-4 border-t border-border bg-page/95 backdrop-blur z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {hint}
        </div>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </div>
  )
}
