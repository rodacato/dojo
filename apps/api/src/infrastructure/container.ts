import { GetExerciseOptions } from '../application/practice/GetExerciseOptions'
import { GetSession } from '../application/practice/GetSession'
import { GenerateSessionBody } from '../application/practice/GenerateSessionBody'
import { StartSession } from '../application/practice/StartSession'
import { SubmitAttempt } from '../application/practice/SubmitAttempt'
import { GetExerciseById } from '../application/content/GetExerciseById'
import { CreateExercise } from '../application/content/CreateExercise'
import { UpsertUser } from '../application/identity/UpsertUser'
import { GetCourseList } from '../application/learning/GetCourseList'
import { GetCourseBySlug } from '../application/learning/GetCourseBySlug'
import { ExecuteStep } from '../application/learning/ExecuteStep'
import { TrackProgress } from '../application/learning/TrackProgress'
import { GetCourseProgress } from '../application/learning/GetCourseProgress'
import { MergeAnonymousProgress } from '../application/learning/MergeAnonymousProgress'
import { db } from './persistence/drizzle/client'
import { PostgresExerciseRepository } from './persistence/PostgresExerciseRepository'
import { PostgresSessionRepository } from './persistence/PostgresSessionRepository'
import { PostgresUserRepository } from './persistence/PostgresUserRepository'
import { InMemoryEventBus } from './events/InMemoryEventBus'
import { MockLLMAdapter } from './llm/MockLLMAdapter'
import { AnthropicStreamAdapter } from './llm/AnthropicStreamAdapter'
import { OpenAIStreamAdapter } from './llm/OpenAIStreamAdapter'
import { config } from '../config'
import { registerBadgeHandlers } from './events/BadgeEventHandler'
import { PostgresPreferencesRepository } from './persistence/PostgresPreferencesRepository'
import { PostgresCourseRepository } from './persistence/PostgresCourseRepository'
import { PostgresCourseProgressRepository } from './persistence/PostgresCourseProgressRepository'
import { PistonAdapter } from './execution/PistonAdapter'
import { MockExecutionAdapter } from './execution/MockExecutionAdapter'
import { ExecutionQueue } from './execution/ExecutionQueue'
import type { CodeExecutionPort, LLMPort } from '../domain/practice/ports'

const sessionRepo = new PostgresSessionRepository(db)
const exerciseRepo = new PostgresExerciseRepository(db)
const userRepo = new PostgresUserRepository(db)
const preferencesRepo = new PostgresPreferencesRepository(db)
export const courseRepo = new PostgresCourseRepository(db)
const courseProgressRepo = new PostgresCourseProgressRepository(db)

function createLLMAdapter(): LLMPort {
  switch (config.LLM_ADAPTER_FORMAT) {
    case 'anthropic':
      return new AnthropicStreamAdapter(config.LLM_API_KEY)
    case 'openai':
      return new OpenAIStreamAdapter(config.LLM_API_KEY, config.LLM_BASE_URL ?? 'https://api.openai.com')
    default:
      return new MockLLMAdapter()
  }
}

const llm = createLLMAdapter()

function createExecutionAdapter(): CodeExecutionPort {
  if (config.CODE_EXECUTION_ENABLED) return new PistonAdapter()
  return new MockExecutionAdapter()
}

export const executionQueue = new ExecutionQueue(
  createExecutionAdapter(),
  config.PISTON_MAX_CONCURRENT,
)

export const eventBus = new InMemoryEventBus()

// Register domain event handlers
registerBadgeHandlers(eventBus, db)

export const useCases = {
  startSession: new StartSession({ exerciseRepo, sessionRepo, eventBus }),
  generateSessionBody: new GenerateSessionBody({ exerciseRepo, sessionRepo, llm }),
  submitAttempt: new SubmitAttempt({ sessionRepo, llm, eventBus }),
  getExerciseOptions: new GetExerciseOptions({ exerciseRepo, preferencesRepo }),
  getExerciseById: new GetExerciseById({ exerciseRepo }),
  createExercise: new CreateExercise({ exerciseRepo }),
  getSession: new GetSession({ sessionRepo }),
  upsertUser: new UpsertUser({ userRepo }),
  getCourseList: new GetCourseList({ courseRepo }),
  getCourseBySlug: new GetCourseBySlug({ courseRepo }),
  executeStep: new ExecuteStep({ executionPort: createExecutionAdapter() }),
  trackProgress: new TrackProgress({ progressRepo: courseProgressRepo }),
  getCourseProgress: new GetCourseProgress({ progressRepo: courseProgressRepo }),
  mergeAnonymousProgress: new MergeAnonymousProgress({ progressRepo: courseProgressRepo }),
}
