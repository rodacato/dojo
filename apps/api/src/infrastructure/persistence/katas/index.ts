import { backendKatas } from './backend'
import { frontendKatas } from './frontend'
import { architectureKatas } from './architecture'
import { securityKatas } from './security'
import { reliabilityKatas } from './reliability'
import { devopsKatas } from './devops'
import { testingKatas } from './testing'
import { processKatas } from './process'
import { testCodeKatas } from './testcode-katas'
import { debuggingKatas } from './debugging'
import { sqlAdvancedKatas } from './sql-advanced'
import { reviewKatas } from './review'

export type { SeedKata } from './types'
export { uuidv5 } from './types'

export const KATAS = [
  ...backendKatas,
  ...frontendKatas,
  ...architectureKatas,
  ...securityKatas,
  ...reliabilityKatas,
  ...devopsKatas,
  ...testingKatas,
  ...processKatas,
  ...testCodeKatas,
  ...debuggingKatas,
  ...sqlAdvancedKatas,
  ...reviewKatas,
]
