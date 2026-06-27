export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class SessionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Session not found: ${id}`, 'SESSION_NOT_FOUND')
  }
}

export class SessionAlreadyCompletedError extends DomainError {
  constructor(id: string) {
    super(`Session is already completed or failed: ${id}`, 'SESSION_ALREADY_COMPLETED')
  }
}

export class KataNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Kata not found: ${id}`, 'KATA_NOT_FOUND')
  }
}

export class NoEligibleKatasError extends DomainError {
  constructor() {
    super('No eligible katas found for the given filters', 'NO_ELIGIBLE_KATAS')
  }
}

export class SessionExpiredError extends DomainError {
  constructor(id: string) {
    super(`Session time limit exceeded: ${id}`, 'SESSION_EXPIRED')
  }
}

export class AttemptLimitReachedError extends DomainError {
  constructor(id: string) {
    super(`Session has reached its attempt limit: ${id}`, 'ATTEMPT_LIMIT_REACHED')
  }
}
