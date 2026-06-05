import type { DomainEvent } from '../shared/events'
import { KataId, VariationId } from '../shared/types'
import type { UserId } from '../shared/types'
import type { KataPublished } from './events'
import type { Difficulty, KataStatus, KataType } from './values'
import type { Rubric } from '@dojo/shared'

export interface Variation {
  readonly id: VariationId
  readonly kataId: KataId
  readonly ownerRole: string
  readonly ownerContext: string
  readonly createdAt: Date
}

export interface KataProps {
  id: KataId
  title: string
  description: string
  durationMinutes: number
  difficulty: Difficulty
  category: string
  type: KataType
  status: KataStatus
  languages: string[]
  tags: string[]
  topics: string[]
  testCode: string | null
  starterCode: string | null
  // Hidden evaluation rubric for `type: 'review'` kata. Never exposed to
  // the learner until completion (PRD 027).
  rubric: Rubric | null
  variations: Variation[]
  version: number
  adminNotes: string | null
  createdBy: UserId
  createdAt: Date
  updatedAt: Date | null
}

export class Kata {
  readonly id: KataId
  readonly title: string
  readonly description: string
  readonly durationMinutes: number
  readonly difficulty: Difficulty
  readonly category: string
  readonly type: KataType
  readonly languages: string[]
  readonly tags: string[]
  readonly topics: string[]
  readonly testCode: string | null
  readonly starterCode: string | null
  readonly rubric: Rubric | null
  readonly variations: Variation[]
  readonly version: number
  readonly adminNotes: string | null
  readonly createdBy: UserId
  readonly createdAt: Date
  readonly updatedAt: Date | null
  private _status: KataStatus
  private _pendingEvents: DomainEvent[] = []

  constructor(props: KataProps) {
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
    this.testCode = props.testCode
    this.starterCode = props.starterCode
    this.rubric = props.rubric
    this.variations = props.variations
    this.version = props.version
    this.adminNotes = props.adminNotes
    this.createdBy = props.createdBy
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  get status(): KataStatus {
    return this._status
  }

  static create(params: {
    title: string
    description: string
    durationMinutes: number
    difficulty: Difficulty
    category: string
    type: KataType
    languages: string[]
    tags: string[]
    topics: string[]
    createdBy: UserId
    variations: Array<{ ownerRole: string; ownerContext: string }>
  }): Kata {
    const id = KataId(crypto.randomUUID())
    const variations: Variation[] = params.variations.map((v) => ({
      id: VariationId(crypto.randomUUID()),
      kataId: id,
      ownerRole: v.ownerRole,
      ownerContext: v.ownerContext,
      createdAt: new Date(),
    }))

    return new Kata({
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
      testCode: null,
      starterCode: null,
      rubric: null,
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
      throw new Error('Cannot publish an archived kata')
    }
    this._status = 'published'

    const event: KataPublished = {
      type: 'KataPublished',
      aggregateId: this.id,
      occurredAt: new Date(),
      kataId: this.id,
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
