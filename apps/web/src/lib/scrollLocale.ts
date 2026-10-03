export function preferredLocale(): string {
  return globalThis.navigator?.language || 'en'
}

const languageOf = (locale: string) => locale.toLowerCase().split('-')[0]

/** Exact match first, then same language, then the scroll's first locale. */
export function resolveLocale(supported: readonly string[], preferred: string): string {
  const exact = supported.find((locale) => locale.toLowerCase() === preferred.toLowerCase())
  if (exact) return exact
  const sameLanguage = supported.find((locale) => languageOf(locale) === languageOf(preferred))
  return sameLanguage ?? supported[0] ?? preferred
}

export function pickLocalized(
  text: Readonly<Record<string, string>>,
  supported: readonly string[],
  preferred: string,
): string {
  return text[resolveLocale(supported, preferred)] ?? Object.values(text)[0] ?? ''
}
