import { useEffect, useState, type FormEvent } from 'react'
import type { HistoryOutcomeFilter } from '@dojo/shared'
import { Input, Select } from '../ui/Input'

export const HISTORY_OUTCOME_OPTIONS: ReadonlyArray<{ value: HistoryOutcomeFilter; label: string }> = [
  { value: 'all', label: 'All sessions' },
  { value: 'passed', label: 'Passed' },
  { value: 'passed_with_notes', label: 'Passed with notes' },
  { value: 'needs_work', label: 'Needs work' },
  { value: 'expired', label: 'Expired' },
  { value: 'no_evaluation', label: 'No evaluation' },
]

export const HISTORY_SEARCH_ID = 'history-query'
const SEARCH_DELAY_MS = 250

interface HistoryFiltersProps {
  query: string
  outcome: HistoryOutcomeFilter
  disabled: boolean
  onQueryChange: (query: string) => void
  onOutcomeChange: (outcome: HistoryOutcomeFilter) => void
}

export function HistoryFilters({ query, outcome, disabled, onQueryChange, onOutcomeChange }: Readonly<HistoryFiltersProps>) {
  const [draft, setDraft] = useState(query)

  const [appliedQuery, setAppliedQuery] = useState(query)
  if (query !== appliedQuery) {
    setAppliedQuery(query)
    if (query !== draft.trim()) setDraft(query)
  }

  useEffect(() => {
    if (draft.trim() === query) return
    const timer = setTimeout(() => onQueryChange(draft.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draft, query, onQueryChange])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (draft.trim() !== query) onQueryChange(draft.trim())
  }

  function clearSearch() {
    setDraft('')
    onQueryChange('')
    document.getElementById(HISTORY_SEARCH_ID)?.focus()
  }

  return (
    <form
      aria-label="Find a past kata"
      onSubmit={submit}
      className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15rem] gap-4 md:gap-6 py-5 md:py-6 border-y border-border"
    >
      <div className="relative min-w-0">
        <Input
          id={HISTORY_SEARCH_ID}
          type="search"
          label="Find a kata"
          placeholder="Search titles"
          maxLength={120}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          className="pr-12 [&::-webkit-search-cancel-button]:hidden"
        />
        {draft && (
          <button
            type="button"
            aria-label="Clear search"
            disabled={disabled}
            onClick={clearSearch}
            className="absolute bottom-0.5 right-0.5 size-11 rounded-sm text-xl text-secondary hover:text-primary hover:bg-elevated transition-colors disabled:opacity-50"
          >
            ×
          </button>
        )}
      </div>
      <Select
        label="Result"
        value={outcome}
        disabled={disabled}
        onChange={(event) => onOutcomeChange(event.target.value as HistoryOutcomeFilter)}
      >
        {HISTORY_OUTCOME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </form>
  )
}
