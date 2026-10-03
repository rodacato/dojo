import { z } from 'zod'
import { scrollCompleteSchema, scrollProgressSchema, unitIdSchema } from './scroll-protocol'

export const ANONYMOUS_ID_HEADER = 'X-Anonymous-Id'

export const anonymousIdSchema = z.uuid()

export const scrollUnitProgressSchema = z.object({
  completed: z.boolean(),
  state: scrollProgressSchema.shape.state,
})

export const scrollProgressDTOSchema = z.object({
  userRef: z.string().min(1).max(128),
  completed: z.boolean(),
  units: z.record(unitIdSchema, scrollUnitProgressSchema),
  updatedAt: z.string().nullable(),
})

// What the protocol's `progress` and `complete` messages carry, without the envelope.
export const recordScrollProgressSchema = z.discriminatedUnion('type', [
  scrollProgressSchema.pick({ type: true, unitId: true, completed: true, state: true }),
  scrollCompleteSchema.pick({ type: true, unitId: true }),
])

export type ScrollUnitProgressDTO = z.infer<typeof scrollUnitProgressSchema>
export type ScrollProgressDTO = z.infer<typeof scrollProgressDTOSchema>
export type RecordScrollProgressInput = z.infer<typeof recordScrollProgressSchema>
