type Brand<T, B> = T & { readonly _brand: B }

export type SessionId = Brand<string, 'SessionId'>
export type UserId = Brand<string, 'UserId'>
export type ExerciseId = Brand<string, 'ExerciseId'>
export type VariationId = Brand<string, 'VariationId'>
export type AttemptId = Brand<string, 'AttemptId'>

export const SessionId = (id: string): SessionId => id as SessionId
export const UserId = (id: string): UserId => id as UserId
export const ExerciseId = (id: string): ExerciseId => id as ExerciseId
export const VariationId = (id: string): VariationId => id as VariationId
export const AttemptId = (id: string): AttemptId => id as AttemptId
