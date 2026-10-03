import { afterEach, describe, expect, it, vi } from 'vitest'
import { pickLocalized, preferredLocale, resolveLocale } from './scrollLocale'

describe('resolveLocale', () => {
  it('prefers an exact match', () => {
    expect(resolveLocale(['en', 'es-MX', 'es'], 'es-MX')).toBe('es-MX')
  })

  it('matches case-insensitively', () => {
    expect(resolveLocale(['en', 'es-mx'], 'es-MX')).toBe('es-mx')
  })

  it('falls back to the same language', () => {
    expect(resolveLocale(['en', 'es'], 'es-AR')).toBe('es')
  })

  it('falls back to the first supported locale', () => {
    expect(resolveLocale(['en', 'es'], 'ja')).toBe('en')
  })

  it('returns the preferred locale when the scroll lists none', () => {
    expect(resolveLocale([], 'ja')).toBe('ja')
  })
})

describe('pickLocalized', () => {
  const text = { en: 'Hello', es: 'Hola' }

  it('returns the text in the user locale', () => {
    expect(pickLocalized(text, ['en', 'es'], 'es-MX')).toBe('Hola')
  })

  it('falls back to the first manifest locale', () => {
    expect(pickLocalized(text, ['en', 'es'], 'fr')).toBe('Hello')
  })

  it('falls back to any available text when the resolved locale has none', () => {
    expect(pickLocalized({ es: 'Hola' }, ['en', 'es'], 'fr')).toBe('Hola')
  })

  it('returns an empty string for empty text', () => {
    expect(pickLocalized({}, ['en'], 'en')).toBe('')
  })
})

describe('preferredLocale', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads the browser language', () => {
    vi.spyOn(globalThis.navigator, 'language', 'get').mockReturnValue('es-MX')
    expect(preferredLocale()).toBe('es-MX')
  })

  it('defaults to en', () => {
    vi.spyOn(globalThis.navigator, 'language', 'get').mockReturnValue('')
    expect(preferredLocale()).toBe('en')
  })
})
