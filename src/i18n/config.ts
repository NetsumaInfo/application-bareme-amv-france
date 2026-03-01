export const APP_LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français', nativeLabel: 'Français', shortLabel: 'FR', locale: 'fr-FR', flag: '🇫🇷' },
  { value: 'en', label: 'Anglais', nativeLabel: 'English', shortLabel: 'EN', locale: 'en-US', flag: '🇺🇸' },
  { value: 'ja', label: 'Japonais', nativeLabel: '日本語', shortLabel: '日本', locale: 'ja-JP', flag: '🇯🇵' },
  { value: 'ru', label: 'Russe', nativeLabel: 'Русский', shortLabel: 'РУ', locale: 'ru-RU', flag: '🇷🇺' },
  { value: 'zh', label: 'Chinois', nativeLabel: '中文', shortLabel: '中文', locale: 'zh-CN', flag: '🇨🇳' },
  { value: 'es', label: 'Espagnol', nativeLabel: 'Español', shortLabel: 'ES', locale: 'es-ES', flag: '🇪🇸' },
] as const

export type AppLanguage = typeof APP_LANGUAGE_OPTIONS[number]['value']

export const APP_LANGUAGE_LABELS = APP_LANGUAGE_OPTIONS.reduce<Record<AppLanguage, string>>((acc, option) => {
  acc[option.value] = option.label
  return acc
}, {} as Record<AppLanguage, string>)

export const APP_LANGUAGE_NATIVE_LABELS = APP_LANGUAGE_OPTIONS.reduce<Record<AppLanguage, string>>((acc, option) => {
  acc[option.value] = option.nativeLabel
  return acc
}, {} as Record<AppLanguage, string>)

export const APP_LANGUAGE_SHORT_LABELS = APP_LANGUAGE_OPTIONS.reduce<Record<AppLanguage, string>>((acc, option) => {
  acc[option.value] = option.shortLabel
  return acc
}, {} as Record<AppLanguage, string>)

export const APP_LANGUAGE_INTL_LOCALES = APP_LANGUAGE_OPTIONS.reduce<Record<AppLanguage, string>>((acc, option) => {
  acc[option.value] = option.locale
  return acc
}, {} as Record<AppLanguage, string>)

export const APP_LANGUAGE_FLAGS = APP_LANGUAGE_OPTIONS.reduce<Record<AppLanguage, string>>((acc, option) => {
  acc[option.value] = option.flag
  return acc
}, {} as Record<AppLanguage, string>)

export function isAppLanguage(value: unknown): value is AppLanguage {
  return APP_LANGUAGE_OPTIONS.some((option) => option.value === value)
}

export function normalizeAppLanguage(value: unknown): AppLanguage | null {
  if (isAppLanguage(value)) return value
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (normalized.startsWith('fr')) return 'fr'
  if (normalized.startsWith('en')) return 'en'
  if (normalized.startsWith('ja') || normalized.startsWith('jp')) return 'ja'
  if (normalized.startsWith('ru')) return 'ru'
  if (normalized.startsWith('zh') || normalized.startsWith('cn')) return 'zh'
  if (normalized.startsWith('es')) return 'es'
  return null
}

export function applyLanguageToDocument(language: AppLanguage) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = APP_LANGUAGE_INTL_LOCALES[language]
  document.documentElement.dataset.language = language
}

export function detectSystemLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'fr'
  const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language]

  for (const candidate of candidates) {
    const normalized = normalizeAppLanguage(candidate)
    if (normalized) return normalized
  }

  return 'fr'
}
