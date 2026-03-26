import type { DomainEvent } from '../shared/events'
import { ExerciseId, VariationId } from '../shared/types'
import type { UserId } from '../shared/types'
import type { ExercisePublished } from './events'
import type { Difficulty, ExerciseStatus, ExerciseType } from './values'

export interface Variation {
  readonly id: VariationId
  readonly exerciseId: ExerciseId
  readonly ownerRole: string
  readonly ownerContext: string
  readonly createdAt: Date
}

export interface ExerciseProps {
  id: ExerciseId
  title: string
  description: string
  durationMinutes: number
  difficulty: Difficulty
  category: string
  type: ExerciseType
  status: ExerciseStatus
  languages: string[]
  tags: string[]
  topics: string[]
  variations: Variation[]
  version: number
  adminNotes: string | null
  createdBy: UserId
  createdAt: Date
  updatedAt: Date | null
}

export class Exercise {
  readonly id: ExerciseId
  readonly title: string
  readonly description: string
  readonly durationMinutes: number
  readonly difficulty: Difficulty
  readonly category: string
  readonly type: ExerciseType
  readonly languages: string[]
  readonly tags: string[]
  readonly topics: string[]
  readonly variations: Variation[]
  readonly version: number
  readonly adminNotes: string | null
  readonly createdBy: UserId
  readonly createdAt: Date
  readonly updatedAt: Date | null
  private _status: ExerciseStatus
  private _pendingEvents: DomainEvent[] = []

  constructor(props: ExerciseProps) {
    this.id = props.id
    this.title = props.title
    this.description = props.description
    this.durationMinutes = props.durationMinutes
    this.difficulty = props.difficulty
    this.category = props.category
    this.type = props.type
    this._status = props.status
    this.languages = props.languages
    this.tags = props.tags
    this.topics = props.topics
    this.variations = props.variations
    this.version = props.version
    this.adminNotes = props.adminNotes
    this.createdBy = props.createdBy
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  get status(): ExerciseStatus {
    return this._status
  }

  static create(params: {
    title: string
    description: string
    durationMinutes: number
    difficulty: Difficulty
    category: string
    type: ExerciseType
    languages: string[]
    tags: string[]
    topics: string[]
    createdBy: UserId
    variations: Array<{ ownerRole: string; ownerContext: string }>
  }): Exercise {
    const id = ExerciseId(crypto.randomUUID())
    const variations: Variation[] = params.variations.map((v) => ({
      id: VariationId(crypto.randomUUID()),
      exerciseId: id,
      ownerRole: v.ownerRole,
      ownerContext: v.ownerContext,
      createdAt: new Date(),
    }))

    return new Exercise({
      id,
      title: params.title,
      description: params.description,
      durationMinutes: params.durationMinutes,
      difficulty: params.difficulty,
      category: params.category,
      type: params.type,
      status: 'draft',
      languages: params.languages,
      tags: params.tags,
      topics: params.topics,
      variations,
      version: 1,
      adminNotes: null,
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: null,
    })
  }

  publish(publishedBy: UserId): void {
    if (this._status === 'archived') {
      throw new Error('Cannot publish an archived exercise')
    }
    this._status = 'published'

    const event: ExercisePublished = {
      type: 'ExercisePublished',
      aggregateId: this.id,
      occurredAt: new Date(),
      exerciseId: this.id,
      publishedBy,
    }
    this._pendingEvents.push(event)
  }

  archive(): void {
    this._status = 'archived'
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._pendingEvents]
    this._pendingEvents = []
    return events
  }
}
