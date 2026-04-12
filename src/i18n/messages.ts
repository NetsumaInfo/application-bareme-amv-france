import type { AppLanguage } from '@/i18n/config'
import fr from '@/i18n/locales/fr.json'
import en from '@/i18n/locales/en.json'
import ja from '@/i18n/locales/ja.json'
import ru from '@/i18n/locales/ru.json'
import zh from '@/i18n/locales/zh.json'
import es from '@/i18n/locales/es.json'

export type TranslationParams = Record<string, string | number | null | undefined>
type TranslationDictionary = Record<string, string>

const dictionaries: Record<AppLanguage, TranslationDictionary> = {
  fr,
  en,
  ja,
  ru,
  zh,
  es,
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key]
    return value === null || value === undefined ? '' : String(value)
  })
}

export function translateKey(language: AppLanguage, key: string, params?: TranslationParams): string {
  const dictionary = dictionaries[language]
  const template = dictionary[key] || key
  return interpolate(template, params)
}
