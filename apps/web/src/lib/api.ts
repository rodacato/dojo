// Re-export everything from the modular API directory.
// This file exists so that existing imports (`from '../lib/api'`) keep working.
export {
  api,
  ApiError,
  type AttemptDTO,
  type DashboardData,
  type SessionAttempt,
  type SessionWithKata,
  type StartSessionResponse,
  type SubmitAttemptResponse,
  type AdminKataDTO,
  type PublicProfileData,
} from './api/index'
