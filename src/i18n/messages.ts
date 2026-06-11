import type { AppLanguage } from '@/i18n/config'
import fr from '@/i18n/locales/fr.json'

export type TranslationParams = Record<string, string | number | null | undefined>
type TranslationDictionary = Record<string, string>

// French is the source/fallback language and stays eagerly bundled.
// Other locales are loaded on demand to keep entry bundles small.
const dictionaries: Partial<Record<AppLanguage, TranslationDictionary>> = {
  fr,
}

const localeModules = import.meta.glob<{ default: TranslationDictionary }>([
  './locales/*.json',
  '!./locales/fr.json',
])

const pendingLoads = new Map<AppLanguage, Promise<void>>()

export function isLocaleLoaded(language: AppLanguage): boolean {
  return dictionaries[language] !== undefined
}

export function loadLocale(language: AppLanguage): Promise<void> {
  if (isLocaleLoaded(language)) return Promise.resolve()

  const pending = pendingLoads.get(language)
  if (pending) return pending

  const importer = localeModules[`./locales/${language}.json`]
  if (!importer) {
    // Unknown locale file: fall back to French silently.
    return Promise.resolve()
  }

  const load = importer()
    .then((module) => {
      dictionaries[language] = module.default
    })
    .catch(() => {
      // Keep French fallback on load failure; retry is possible on next call.
    })
    .finally(() => {
      pendingLoads.delete(language)
    })

  pendingLoads.set(language, load)
  return load
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key]
    return value === null || value === undefined ? '' : String(value)
  })
}

export function translateKey(language: AppLanguage, key: string, params?: TranslationParams): string {
  const dictionary = dictionaries[language] ?? dictionaries.fr ?? {}
  const template = dictionary[key] || key
  return interpolate(template, params)
}
