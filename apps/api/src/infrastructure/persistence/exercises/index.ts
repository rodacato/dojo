import { backendExercises } from './backend'
import { frontendExercises } from './frontend'
import { architectureExercises } from './architecture'
import { securityExercises } from './security'
import { reliabilityExercises } from './reliability'
import { devopsExercises } from './devops'
import { testingExercises } from './testing'
import { processExercises } from './process'

export type { SeedExercise } from './types'
export { uuidv5 } from './types'

export const EXERCISES = [
  ...backendExercises,
  ...frontendExercises,
  ...architectureExercises,
  ...securityExercises,
  ...reliabilityExercises,
  ...devopsExercises,
  ...testingExercises,
  ...processExercises,
]
