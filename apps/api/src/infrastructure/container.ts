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
import { GenerateNudge } from '../application/learning/GenerateNudge'
import { SubmitNudgeFeedback } from '../application/learning/SubmitNudgeFeedback'
import { PostgresNudgeRepository } from './persistence/PostgresNudgeRepository'
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
import type { ErrorReporterPort } from './observability/ports'
import { ConsoleErrorReporter } from './observability/ConsoleErrorReporter'
import { PostgresErrorReporter } from './observability/PostgresErrorReporter'
import { SentryErrorReporter } from './observability/SentryErrorReporter'
import { CompositeErrorReporter } from './observability/CompositeErrorReporter'

const sessionRepo = new PostgresSessionRepository(db)
const exerciseRepo = new PostgresExerciseRepository(db)
const userRepo = new PostgresUserRepository(db)
const preferencesRepo = new PostgresPreferencesRepository(db)
export const courseRepo = new PostgresCourseRepository(db)
const courseProgressRepo = new PostgresCourseProgressRepository(db)
const nudgeRepo = new PostgresNudgeRepository(db)

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
  if (config.FF_CODE_EXECUTION_ENABLED) return new PistonAdapter()
  return new MockExecutionAdapter()
}

export const executionQueue = new ExecutionQueue(
  createExecutionAdapter(),
  config.PISTON_MAX_CONCURRENT,
)

// Environments we never want to emit to Sentry even if a DSN is present.
// Prevents a copied prod `.env` from pumping dev noise into the Sentry
// project (or burning through the free-tier quota while debugging).
const SENTRY_SKIPPED_ENVS = new Set(['development', 'test'])

function createErrorReporter(): ErrorReporterPort {
  // Order matters only for logs: stdout first so `kamal app logs` keeps
  // showing errors exactly when they happen.
  const reporters: ErrorReporterPort[] = [new ConsoleErrorReporter(), new PostgresErrorReporter(db)]

  const sentryGated = config.SENTRY_DSN && SENTRY_SKIPPED_ENVS.has(config.SENTRY_ENVIRONMENT)
  if (sentryGated) {
    console.warn(
      `[observability] SENTRY_DSN is set but SENTRY_ENVIRONMENT=${config.SENTRY_ENVIRONMENT} — skipping Sentry adapter. ` +
        `Set SENTRY_ENVIRONMENT to production|staging to enable.`,
    )
  }

  if (config.SENTRY_DSN && !SENTRY_SKIPPED_ENVS.has(config.SENTRY_ENVIRONMENT)) {
    reporters.push(
      new SentryErrorReporter({
        dsn: config.SENTRY_DSN,
        environment: config.SENTRY_ENVIRONMENT,
        tracesSampleRate: config.SENTRY_TRACES_SAMPLE_RATE,
        release: config.SENTRY_RELEASE || undefined,
      }),
    )
  }
  return new CompositeErrorReporter(reporters)
}

export const errorReporter = createErrorReporter()

export const eventBus = new InMemoryEventBus()

// Register domain event handlers
registerBadgeHandlers(eventBus, db)

export const useCases = {
  startSession: new StartSession({ exerciseRepo, sessionRepo, eventBus }),
  generateSessionBody: new GenerateSessionBody({ exerciseRepo, sessionRepo, llm, errorReporter }),
  submitAttempt: new SubmitAttempt({ sessionRepo, llm, eventBus }),
  getExerciseOptions: new GetExerciseOptions({ exerciseRepo, preferencesRepo }),
  getExerciseById: new GetExerciseById({ exerciseRepo }),
  createExercise: new CreateExercise({ exerciseRepo }),
  getSession: new GetSession({ sessionRepo }),
  upsertUser: new UpsertUser({ userRepo }),
  getCourseList: new GetCourseList({ courseRepo }),
  getCourseBySlug: new GetCourseBySlug({ courseRepo }),
  executeStep: new ExecuteStep({ executionPort: createExecutionAdapter() }),
  trackProgress: new TrackProgress({ progressRepo: courseProgressRepo, courseRepo, eventBus }),
  getCourseProgress: new GetCourseProgress({ progressRepo: courseProgressRepo }),
  mergeAnonymousProgress: new MergeAnonymousProgress({ progressRepo: courseProgressRepo }),
  generateNudge: new GenerateNudge({ courseRepo, llm, nudgeRepo }),
  submitNudgeFeedback: new SubmitNudgeFeedback({ nudgeRepo }),
}
