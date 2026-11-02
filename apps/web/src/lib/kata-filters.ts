import type { KataType } from '@dojo/shared'

export type Duration = 5 | 10 | 20

export interface KataFilters {
  duration: Duration
  type: KataType | ''
  language: string
}

export const DURATIONS: Duration[] = [5, 10, 20]

const KEY = 'dojo_kata_filters'
const TYPES = new Set(['', 'code', 'review', 'chat', 'whiteboard'])

// A convenience for this browser only; standing preferences live in Settings (D57).
export function loadKataFilters(): KataFilters | null {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<KataFilters> | null
    if (!stored || !DURATIONS.includes(stored.duration as Duration)) return null
    if (!TYPES.has(stored.type ?? '') || typeof (stored.language ?? '') !== 'string') return null
    return { duration: stored.duration as Duration, type: stored.type ?? '', language: stored.language ?? '' }
  } catch {
    return null
  }
}

export function saveKataFilters(filters: KataFilters): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(filters))
  } catch {
    // Private mode or blocked storage: the chooser still works, it just won't remember.
  }
}
