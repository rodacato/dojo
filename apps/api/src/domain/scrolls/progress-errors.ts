import { DomainError } from '../shared/errors'

export class ScrollProgressNotEnabledError extends DomainError {
  constructor(slug: string) {
    super(`Scroll "${slug}" does not declare the progress capability`, 'SCROLL_PROGRESS_DISABLED')
  }
}

export class ScrollUnitNotFoundError extends DomainError {
  constructor(unitId: string) {
    super(`Unit "${unitId}" is not in the scroll manifest`, 'SCROLL_UNIT_NOT_FOUND')
  }
}

export class ScrollOwnerRequiredError extends DomainError {
  constructor() {
    super('Sign in or send a valid anonymous id', 'SCROLL_OWNER_REQUIRED')
  }
}
