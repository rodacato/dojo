export type ProgressOwner =
  | { kind: 'user'; userId: string }
  | { kind: 'anonymous'; anonymousId: string }

// `unitId: null` is the whole scroll; it never implies that every unit is complete.
export interface ProgressRecord {
  unitId: string | null
  completed: boolean
  state?: unknown
  updatedAt: Date
}

export interface ScrollProgressView {
  userRef: string
  completed: boolean
  units: Record<string, { completed: boolean; state?: unknown }>
  updatedAt: Date | null
}

export function ownerId(owner: ProgressOwner): string {
  return owner.kind === 'user' ? `user:${owner.userId}` : `anon:${owner.anonymousId}`
}

export function mergeRecords(existing: ProgressRecord | undefined, incoming: ProgressRecord): ProgressRecord {
  if (!existing) return incoming
  const newest = incoming.updatedAt > existing.updatedAt ? incoming : existing
  const oldest = newest === incoming ? existing : incoming
  return {
    unitId: existing.unitId,
    completed: existing.completed || incoming.completed,
    state: newest.state ?? oldest.state,
    updatedAt: newest.updatedAt,
  }
}

export function toProgressView(userRef: string, records: ProgressRecord[]): ScrollProgressView {
  const units: ScrollProgressView['units'] = {}
  let completed = false
  let updatedAt: Date | null = null

  for (const record of records) {
    if (record.unitId === null) completed = record.completed
    else units[record.unitId] = { completed: record.completed, ...(record.state !== undefined && { state: record.state }) }
    if (!updatedAt || record.updatedAt > updatedAt) updatedAt = record.updatedAt
  }
  return { userRef, completed, units, updatedAt }
}
