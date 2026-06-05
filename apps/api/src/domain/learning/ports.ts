import type { Scroll } from './scroll'

export interface ScrollRepositoryPort {
  findById(id: string): Promise<Scroll | null>
  findBySlug(slug: string): Promise<Scroll | null>
  findAllPublished(): Promise<Scroll[]>
  findAllPublic(): Promise<Scroll[]>
}

export type ProgressOwner =
  | { kind: 'user'; userId: string }
  | { kind: 'anonymous'; sessionId: string }

export interface ScrollProgress {
  owner: ProgressOwner
  scrollId: string
  completedSteps: string[]
  lastAccessedAt: Date
}

export interface ScrollProgressPort {
  findByOwnerAndScroll(owner: ProgressOwner, scrollId: string): Promise<ScrollProgress | null>
  findAllForAnonymous(sessionId: string): Promise<ScrollProgress[]>
  save(progress: ScrollProgress): Promise<void>
  deleteAnonymous(sessionId: string): Promise<void>
}

export type NudgeFeedback = 'up' | 'down'

export interface NudgeRepositoryPort {
  create(params: {
    userId: string | null
    stepId: string
    prompt: string
    response: string
  }): Promise<string>

  setFeedback(id: string, feedback: NudgeFeedback): Promise<void>
}
