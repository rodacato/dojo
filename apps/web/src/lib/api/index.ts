import { auth } from './auth'
import { practice } from './practice'
import { admin } from './admin'
import { profile } from './profile'
import { learn } from './learn'
import { playground } from './playground'

export { ApiError } from './client'

export type {
  AttemptDTO,
  DashboardData,
  SessionAttempt,
  SessionWithExercise,
  StartSessionResponse,
  SubmitAttemptResponse,
  AdminExerciseDTO,
  LeaderboardEntry,
  LeaderboardData,
  PublicProfileData,
} from './types'

// ---------------------------------------------------------------------------
// Unified API object — same shape as the original `api` export
// ---------------------------------------------------------------------------

export const api = {
  ...auth,
  ...practice,
  ...admin,
  ...profile,
  ...learn,
  playground,
}
