import type { AppLanguage } from '@/i18n/config'
import fr from '@/i18n/locales/fr.json'

export type TranslationParams = Record<string, string | number | null | undefined>
type TranslationDictionary = Record<string, string>

// French is the source/fallback language and is bundled eagerly.
// All other locales are split into their own chunks and loaded on demand.
const FR_DICTIONARY: TranslationDictionary = fr

const dictionaries: Partial<Record<AppLanguage, TranslationDictionary>> = {
  fr: FR_DICTIONARY,
}

// Lazy importers for non-fr locales. `import.meta.glob` keeps each JSON in its
// own chunk so they are only fetched when the corresponding language is active.
const localeLoaders = import.meta.glob<{ default: TranslationDictionary }>([
  './locales/*.json',
  '!./locales/fr.json',
])

function loaderKey(language: AppLanguage): string {
  return `./locales/${language}.json`
}

// Dedup concurrent loads of the same locale via a pending-promise map.
const pendingLoads = new Map<AppLanguage, Promise<void>>()

export function isLocaleLoaded(language: AppLanguage): boolean {
  return dictionaries[language] !== undefined
}

export function loadLocale(language: AppLanguage): Promise<void> {
  if (isLocaleLoaded(language)) return Promise.resolve()

  const existing = pendingLoads.get(language)
  if (existing) return existing

  const loader = localeLoaders[loaderKey(language)]
  if (!loader) {
    // Unknown locale (or fr, which is already loaded) — nothing to do.
    return Promise.resolve()
  }

  const promise = loader()
    .then((mod) => {
      dictionaries[language] = mod.default
    })
    .catch(() => {
      // On failure keep the fr fallback; do not cache the rejection.
    })
    .finally(() => {
      pendingLoads.delete(language)
    })

  pendingLoads.set(language, promise)
  return promise
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key]
    return value === null || value === undefined ? '' : String(value)
  })
}

export function translateKey(language: AppLanguage, key: string, params?: TranslationParams): string {
  // Fall back to French while the requested locale chunk is still loading
  // (or if it failed to load).
  const dictionary = dictionaries[language] ?? FR_DICTIONARY
  const template = dictionary[key] ?? FR_DICTIONARY[key] ?? key
  return interpolate(template, params)
}
