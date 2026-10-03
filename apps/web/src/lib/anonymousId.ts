const KEY = 'dojo-anon-id'

export function getOrCreateAnonymousId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}

export function getAnonymousId(): string | null {
  return localStorage.getItem(KEY)
}

export function clearAnonymousId(): void {
  localStorage.removeItem(KEY)
}
