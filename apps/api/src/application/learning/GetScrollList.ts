import type { ScrollRepositoryPort } from '../../domain/learning/ports'
import type { ScrollStatus } from '../../domain/learning/values'
import type { ExternalReference } from '@dojo/shared'

export interface ScrollSummary {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  status: ScrollStatus
  isPublic: boolean
  lessonCount: number
  stepCount: number
  externalReferences: ExternalReference[]
}

interface Deps {
  scrollRepo: ScrollRepositoryPort
}

export class GetScrollList {
  constructor(private readonly deps: Deps) {}

  async execute(options?: { publicOnly?: boolean }): Promise<ScrollSummary[]> {
    const scrolls = options?.publicOnly
      ? await this.deps.scrollRepo.findAllPublic()
      : await this.deps.scrollRepo.findAllPublished()
    return scrolls.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      language: c.language,
      accentColor: c.accentColor,
      status: c.status,
      isPublic: c.isPublic,
      lessonCount: c.lessons.length,
      stepCount: c.lessons.reduce((sum, l) => sum + l.steps.length, 0),
      externalReferences: c.externalReferences,
    }))
  }
}
