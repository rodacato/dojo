import type { ScrollProgressPort } from '../domain/scrolls/ports'
import { ownerId, type ProgressOwner, type ProgressRecord } from '../domain/scrolls/progress'

interface Row {
  owner: string
  scrollId: string
  record: ProgressRecord
}

export class InMemoryScrollProgressRepository implements ScrollProgressPort {
  readonly rows: Row[] = []

  async list(owner: ProgressOwner, scrollId: string) {
    return this.rows.filter((row) => row.owner === ownerId(owner) && row.scrollId === scrollId).map((row) => row.record)
  }

  async find(owner: ProgressOwner, scrollId: string, unitId: string | null) {
    return (await this.list(owner, scrollId)).find((record) => record.unitId === unitId) ?? null
  }

  async save(owner: ProgressOwner, scrollId: string, record: ProgressRecord) {
    const key = ownerId(owner)
    const index = this.rows.findIndex(
      (row) => row.owner === key && row.scrollId === scrollId && row.record.unitId === record.unitId,
    )
    if (index === -1) this.rows.push({ owner: key, scrollId, record })
    else this.rows[index] = { owner: key, scrollId, record }
  }

  async listAnonymous(anonymousId: string) {
    const key = ownerId({ kind: 'anonymous', anonymousId })
    return this.rows.filter((row) => row.owner === key).map(({ scrollId, record }) => ({ scrollId, record }))
  }

  async deleteAnonymous(anonymousId: string) {
    const key = ownerId({ kind: 'anonymous', anonymousId })
    for (let i = this.rows.length - 1; i >= 0; i--) if (this.rows[i]?.owner === key) this.rows.splice(i, 1)
  }
}
