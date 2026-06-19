import { CalculateBelt } from '../application/recognition/CalculateBelt'
import { ListUserMilestones } from '../application/recognition/ListUserMilestones'
import { PostgresMilestoneRepository } from './persistence/PostgresMilestoneRepository'
import { GetKataOptions } from '../application/practice/GetKataOptions'
import { GetSession } from '../application/practice/GetSession'
import { GenerateSessionBody } from '../application/practice/GenerateSessionBody'
import { StartSession } from '../application/practice/StartSession'
import { SubmitAttempt } from '../application/practice/SubmitAttempt'
import { GetKataById } from '../application/content/GetKataById'
import { CreateKata } from '../application/content/CreateKata'
import { UpsertUser } from '../application/identity/UpsertUser'
import { GetScrollList } from '../application/learning/GetScrollList'
import { GetScrollBySlug } from '../application/learning/GetScrollBySlug'
import { ExecuteStep } from '../application/learning/ExecuteStep'
import { TrackProgress } from '../application/learning/TrackProgress'
import { GetScrollProgress } from '../application/learning/GetScrollProgress'
import { GetAllScrollProgress } from '../application/learning/GetAllScrollProgress'
import { MergeAnonymousProgress } from '../application/learning/MergeAnonymousProgress'
import { GenerateNudge } from '../application/learning/GenerateNudge'
import { SubmitNudgeFeedback } from '../application/learning/SubmitNudgeFeedback'
import { PostgresNudgeRepository } from './persistence/PostgresNudgeRepository'
import { db } from './persistence/drizzle/client'
import { PostgresKataRepository } from './persistence/PostgresKataRepository'
import { PostgresSessionRepository } from './persistence/PostgresSessionRepository'
import { PostgresUserRepository } from './persistence/PostgresUserRepository'
import { InMemoryEventBus } from './events/InMemoryEventBus'
import { MockLLMAdapter } from './llm/MockLLMAdapter'
import { AnthropicStreamAdapter } from './llm/AnthropicStreamAdapter'
import { OpenAIStreamAdapter } from './llm/OpenAIStreamAdapter'
import { config } from '../config'
import { registerMilestoneHandlers } from './events/MilestoneEventHandler'
import { PostgresPreferencesRepository } from './persistence/PostgresPreferencesRepository'
import { PostgresScrollRepository } from './persistence/PostgresScrollRepository'
import { PostgresScrollProgressRepository } from './persistence/PostgresScrollProgressRepository'
import { PistonAdapter } from './execution/PistonAdapter'
import { MockExecutionAdapter } from './execution/MockExecutionAdapter'
import { ExecutionQueue } from './execution/ExecutionQueue'
import { PistonRuntimeProvisioner } from './execution/PistonRuntimeProvisioner'
import type { CodeExecutionPort, LLMPort } from '../domain/practice/ports'
import type { ErrorReporterPort } from './observability/ports'
import { ConsoleErrorReporter } from './observability/ConsoleErrorReporter'
import { PostgresErrorReporter } from './observability/PostgresErrorReporter'
import { SentryErrorReporter } from './observability/SentryErrorReporter'
import { CompositeErrorReporter } from './observability/CompositeErrorReporter'

const sessionRepo = new PostgresSessionRepository(db)
const kataRepo = new PostgresKataRepository(db)
const userRepo = new PostgresUserRepository(db)
const preferencesRepo = new PostgresPreferencesRepository(db)
export const scrollRepo = new PostgresScrollRepository(db)
const scrollProgressRepo = new PostgresScrollProgressRepository(db)
const nudgeRepo = new PostgresNudgeRepository(db)
const milestoneRepo = new PostgresMilestoneRepository(db)

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

export const llm = createLLMAdapter()

function createExecutionAdapter(): CodeExecutionPort {
  if (config.FF_CODE_EXECUTION_ENABLED) return new PistonAdapter()
  return new MockExecutionAdapter()
}

export const executionQueue = new ExecutionQueue(
  createExecutionAdapter(),
  config.PISTON_MAX_CONCURRENT,
)

export const pistonRuntimeProvisioner = new PistonRuntimeProvisioner(config.PISTON_URL)

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
registerMilestoneHandlers(eventBus, db)

export const useCases = {
  startSession: new StartSession({ kataRepo, sessionRepo, eventBus }),
  generateSessionBody: new GenerateSessionBody({ kataRepo, sessionRepo, llm, errorReporter }),
  submitAttempt: new SubmitAttempt({ sessionRepo, llm, eventBus }),
  getKataOptions: new GetKataOptions({ kataRepo, preferencesRepo }),
  getKataById: new GetKataById({ kataRepo }),
  createKata: new CreateKata({ kataRepo }),
  getSession: new GetSession({ sessionRepo }),
  upsertUser: new UpsertUser({ userRepo }),
  getScrollList: new GetScrollList({ scrollRepo }),
  getScrollBySlug: new GetScrollBySlug({ scrollRepo }),
  executeStep: new ExecuteStep({ executionPort: createExecutionAdapter() }),
  trackProgress: new TrackProgress({ progressRepo: scrollProgressRepo, scrollRepo, eventBus }),
  getScrollProgress: new GetScrollProgress({ progressRepo: scrollProgressRepo }),
  getAllScrollProgress: new GetAllScrollProgress({ progressRepo: scrollProgressRepo }),
  mergeAnonymousProgress: new MergeAnonymousProgress({ progressRepo: scrollProgressRepo }),
  generateNudge: new GenerateNudge({ scrollRepo, llm, nudgeRepo }),
  submitNudgeFeedback: new SubmitNudgeFeedback({ nudgeRepo }),
  calculateBelt: new CalculateBelt({ sessionRepo }),
  listUserMilestones: new ListUserMilestones({ milestoneRepo }),
}
