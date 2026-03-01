import { useMemo, type ReactNode } from 'react'
import { useUIStore } from '@/store/useUIStore'
import {
  APP_LANGUAGE_INTL_LOCALES,
  APP_LANGUAGE_LABELS,
  APP_LANGUAGE_NATIVE_LABELS,
} from '@/i18n/config'
import { translateKey } from '@/i18n/messages'
import { I18nContext, type I18nContextValue } from '@/i18n/context'

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useUIStore((state) => state.language)

  const value = useMemo<I18nContextValue>(() => ({
    language,
    languageLabel: APP_LANGUAGE_LABELS[language],
    languageNativeLabel: APP_LANGUAGE_NATIVE_LABELS[language],
    t: (key, params) => translateKey(language, key, params),
    formatDate: (value, options) => {
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return new Intl.DateTimeFormat(APP_LANGUAGE_INTL_LOCALES[language], options).format(date)
    },
  }), [language])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
