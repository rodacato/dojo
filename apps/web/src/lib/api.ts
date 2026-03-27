// Re-export everything from the modular API directory.
// This file exists so that existing imports (`from '../lib/api'`) keep working.
export {
  api,
  ApiError,
  type AttemptDTO,
  type DashboardData,
  type SessionAttempt,
  type SessionWithExercise,
  type StartSessionResponse,
  type SubmitAttemptResponse,
  type AdminExerciseDTO,
  type LeaderboardEntry,
  type LeaderboardData,
  type PublicProfileData,
} from './api/index'
